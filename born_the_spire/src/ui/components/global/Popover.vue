<template>
<div class="popover-trigger"
    :class="{ inline }"
    ref="triggerRef"
    @mouseenter="handlePointerEnter"
    @mouseleave="handlePointerLeave"
    @click="handleTriggerClick">

    <slot :open="open" :close="close" :toggle="toggle" :shown="shown"></slot>

    <Teleport :to="host">
        <div v-if="shown"
            ref="layerRef"
            :class="[POPOVER_LAYER_CLASS, `gap-${actualPlacement}`]"
            :style="layerStyle"
            @mouseenter="handlePointerEnter"
            @mouseleave="handlePointerLeave"
            @click="handleLayerClick">
            <div class="popover-inner" :style="{ maxWidth: `${maxWidth}px` }">
                <slot name="content"></slot>
            </div>
        </div>
    </Teleport>
</div>
</template>

<script setup lang='ts'>
    import { ref, computed, watch, nextTick, onMounted, onUnmounted, useTemplateRef, inject, provide } from 'vue'
    import { POPOVER_LAYER_CLASS, POPOVER_Z_INDEX, findPopoverLayer, popoverDismissToken, getPopoverHoverOpenDelay } from '@/ui/hooks/interaction/popoverHost'
    import {
        POPOVER_PACK_KEY,
        createPackId,
        registerPackMember,
        unregisterPackMember,
        getPackGroup,
        layoutPackGroup,
        packGroupHasPointer,
        type PopoverPackMember
    } from '@/ui/hooks/interaction/popoverPack'

    /** 浮层落在基准的哪一侧；那一侧放不下会自动翻到对面 */
    type Placement = "left" | "right" | "top" | "bottom"

    /**
     * 交叉轴对齐（横向浮层指纵向，纵向浮层指横向）
     *     start    与基准的起始边对齐
     *     center   与基准居中对齐
     *     trigger  与触发区的起始边对齐——基准是外层浮层、但想让浮层出现在触发文字那一行时用
     *     数字     直接给视口坐标，用于跟随光标
     */
    type Align = "start" | "center" | "trigger" | number

    const {
        trigger = "hover",
        placement = "right",
        align,
        offset = 8,
        closeDelay = 200,
        openDelay,
        anchor = null,
        triggerElement = null,
        disabled = false,
        maxWidth = 300,
        inline = false,
        show,
        order
    } = defineProps<{
        /** hover 悬停开合；click 点击开合并点外部关闭；manual 只听 v-model:show */
        trigger?: "hover" | "click" | "manual",
        placement?: Placement,
        align?: Align,
        /** 与基准的间距。hover 模式下这段间距做成浮层自己的 padding，指针横穿它时不会落空 */
        offset?: number,
        /** 指针离开后延迟多久关闭，留出移进浮层的时间 */
        closeDelay?: number,
        /** 指针停多久才弹出。不传则用全局 `$popover-hover-open-delay` */
        openDelay?: number,
        /**
         * 定位基准。不传时：触发区在别的浮层里就以那个浮层的内容盒为基准
         * （`.popover-inner`，不含间隙 padding），否则以触发区自身为基准
         */
        anchor?: HTMLElement | null,
        /**
         * 改用外部元素当触发区，悬停监听会挂到它身上
         *
         * 给已经有自己尺寸和布局行为的东西（卡牌、遗物、药水）用：套一层包裹 div 会让它
         * 在 flex 布局里变成另一个盒子，把手牌区这类布局挤乱
         */
        triggerElement?: HTMLElement | null,
        disabled?: boolean,
        maxWidth?: number,
        /** 触发区嵌在文字流里时打开，包裹层改为行内，不会把一句话截断成两行 */
        inline?: boolean,
        show?: boolean,
        /**
         * 同一锚点、同一侧的外侧序号。数字小的贴着锚点，大的往外排。
         * 嵌套浮层写了它，就加入外层那一排，不再单独贴着外层浮层的外边缘。
         * 不写则还是原来的贴边行为（卡名预览、卡面术语板）。
         */
        order?: number
    }>()

    const emit = defineEmits<{
        'update:show': [value: boolean]
    }>()

    /** 贴边时与视口保持的最小距离 */
    const VIEWPORT_MARGIN = 8

    const triggerRef = useTemplateRef<HTMLElement>("triggerRef")
    const layerRef = useTemplateRef<HTMLElement>("layerRef")

    const shown = ref(show ?? false)
    /** 翻转后实际采用的方向，间隙 padding 也跟着它走 */
    const actualPlacement = ref<Placement>(placement)
    const position = ref<{ left: number, top: number } | null>(null)

    /** 触发区所在的外层浮层：既是挂载宿主，也是默认定位基准 */
    const hostLayer = ref<HTMLElement | null>(null)
    const host = computed<HTMLElement | string>(() => hostLayer.value ?? "body")

    const parentPack = inject(POPOVER_PACK_KEY, null)
    /** 写了 order 的嵌套浮层：跟外层共用锚点，按 order 往同一侧排 */
    const joinsHostPack = computed(() => order !== undefined && parentPack != null)

    function getOwnOriginAnchor(): HTMLElement | null {
        if (anchor) return anchor
        if (triggerElement) return triggerElement
        const wrapper = triggerRef.value
        if (!wrapper) return null
        return (wrapper.firstElementChild ?? wrapper) as HTMLElement
    }

    function getGroupAnchor(): HTMLElement | null {
        if (joinsHostPack.value) return parentPack?.getOriginAnchor() ?? null
        return getOwnOriginAnchor()
    }

    function getGroupPlacement(): Placement {
        if (joinsHostPack.value) return parentPack?.getRequestedPlacement() ?? placement
        return placement
    }

    provide(POPOVER_PACK_KEY, {
        getOriginAnchor: getOwnOriginAnchor,
        getRequestedPlacement: () => placement,
        actualPlacement
    })

    const layerStyle = computed<Record<string, string>>(() => ({
        position: "fixed",
        left: `${position.value?.left ?? 0}px`,
        top: `${position.value?.top ?? 0}px`,
        // 首帧尚未测得尺寸，先摆在原点并隐藏，避免先在错位置画一帧再跳过去
        visibility: position.value ? "visible" : "hidden",
        zIndex: String(POPOVER_Z_INDEX),
        "--popover-gap": `${offset}px`
    }))

    onMounted(() => {
        hostLayer.value = findPopoverLayer(triggerElement ?? triggerRef.value)
        registerPackMember(packMember)
    })

    // ============ 开合 ============

    /** 指针是否停在触发区或浮层内。浮层挂在触发区之外，两边共用同一套进出逻辑 */
    let pointerInside = false
    let closeTimer: ReturnType<typeof setTimeout> | null = null
    let openTimer: ReturnType<typeof setTimeout> | null = null

    function clearCloseTimer() {
        if (closeTimer) {
            clearTimeout(closeTimer)
            closeTimer = null
        }
    }

    function clearOpenTimer() {
        if (openTimer) {
            clearTimeout(openTimer)
            openTimer = null
        }
    }

    function resolveOpenDelay(): number {
        return openDelay ?? getPopoverHoverOpenDelay()
    }

    function open() {
        clearCloseTimer()
        clearOpenTimer()
        if (disabled) return
        shown.value = true
    }

    function close(delay = 0) {
        clearCloseTimer()
        clearOpenTimer()
        if (delay <= 0) {
            shown.value = false
            return
        }
        closeTimer = setTimeout(() => {
            closeTimer = null
            if (shouldRemainOpen()) return
            shown.value = false
        }, delay)
    }

    function shouldRemainOpen(): boolean {
        if (pointerInside) return true
        // 最内侧那层：指针移到同一排更外侧的浮层上时不要关
        if (!joinsHostPack.value && packGroupHasPointer(packMember)) return true
        return false
    }

    function toggle() {
        shown.value ? close() : open()
    }

    function handlePointerEnter() {
        // 先记录指针位置再看 disabled：禁用期间指针可能已经停在触发区上，
        // 等 disabled 转回可用时要能立刻把浮层补上
        pointerInside = true
        if (trigger !== "hover") return
        clearCloseTimer()
        if (shown.value) {
            open()
            return
        }
        clearOpenTimer()
        const delay = resolveOpenDelay()
        if (delay <= 0) {
            open()
            return
        }
        openTimer = setTimeout(() => {
            openTimer = null
            if (!pointerInside || disabled) return
            open()
        }, delay)
    }

    function handlePointerLeave() {
        pointerInside = false
        if (trigger !== "hover") return
        clearOpenTimer()
        close(closeDelay)
    }

    function handleTriggerClick() {
        if (trigger !== "click") return
        toggle()
    }

    // 外部触发元素：监听直接挂到它身上，包裹层只留作 Teleport 的定位与宿主查询用
    let boundTrigger: HTMLElement | null = null

    function bindTriggerElement(element: HTMLElement | null) {
        if (boundTrigger === element) return
        unbindTriggerElement()
        if (!element) return
        element.addEventListener("mouseenter", handlePointerEnter)
        element.addEventListener("mouseleave", handlePointerLeave)
        element.addEventListener("click", handleTriggerClick)
        boundTrigger = element
    }

    function unbindTriggerElement() {
        if (!boundTrigger) return
        boundTrigger.removeEventListener("mouseenter", handlePointerEnter)
        boundTrigger.removeEventListener("mouseleave", handlePointerLeave)
        boundTrigger.removeEventListener("click", handleTriggerClick)
        boundTrigger = null
    }

    watch(() => triggerElement, (element) => {
        bindTriggerElement(element)
        if (element) hostLayer.value = findPopoverLayer(element)
    }, { immediate: true })

    function handleLayerClick(event: MouseEvent) {
        // 浮层内部的点击不该被外部关闭逻辑当成「点了外面」
        if (trigger === "click") event.stopPropagation()
    }

    function handleDocumentClick(event: MouseEvent) {
        const target = event.target as Node
        if (triggerRef.value?.contains(target)) return
        if (layerRef.value?.contains(target)) return
        close()
    }

    watch(shown, async (isShown) => {
        emit('update:show', isShown)

        if (!isShown) {
            stopObserve()
            position.value = null
            if (trigger === "click") document.removeEventListener("click", handleDocumentClick)
            return
        }

        await nextTick()
        layoutPackGroup(packMember)
        startObserve()
        if (trigger === "click") document.addEventListener("click", handleDocumentClick)
    })

    watch(() => show, (value) => {
        if (value === undefined) return
        shown.value = value
    })

    watch(() => disabled, (isDisabled) => {
        if (isDisabled) {
            clearCloseTimer()
            clearOpenTimer()
            shown.value = false
        } else if (pointerInside && trigger === "hover") {
            shown.value = true
        }
    })

    watch(popoverDismissToken, () => {
        pointerInside = false
        close()
    })

    // 基准换了（比如浮层跟着当前悬停的器官走）要重新贴过去
    watch([() => anchor, () => align, () => placement, () => order], () => {
        if (shown.value) nextTick(() => layoutPackGroup(packMember))
    })

    // ============ 定位 ============

    /**
     * 定位基准
     *
     * 不传 anchor 且不在浮层里时取触发区的第一个子元素而非包裹层本身：包裹层是块级元素，
     * 会被父容器撑满宽度，拿它定位会让浮层离实际内容很远。
     */
    function getAnchorRect(): DOMRect | null {
        if (anchor) return anchor.getBoundingClientRect()
        if (hostLayer.value) {
            const inner = hostLayer.value.querySelector(".popover-inner")
            const box = inner instanceof HTMLElement ? inner : hostLayer.value
            return box.getBoundingClientRect()
        }
        return getTriggerRect()
    }

    function getTriggerRect(): DOMRect | null {
        if (triggerElement) return triggerElement.getBoundingClientRect()
        const wrapper = triggerRef.value
        if (!wrapper) return null
        return (wrapper.firstElementChild ?? wrapper).getBoundingClientRect()
    }

    function clamp(value: number, min: number, max: number): number {
        if (max < min) return min
        return Math.min(Math.max(value, min), max)
    }

    /** 交叉轴坐标：横向浮层算 top，纵向浮层算 left */
    function resolveCross(anchorRect: DOMRect, size: number, isHorizontal: boolean): number {
        const mode = align ?? (isHorizontal ? "start" : "center")
        if (typeof mode === "number") return mode

        if (mode === "trigger") {
            const triggerRect = getTriggerRect()
            if (triggerRect) return isHorizontal ? triggerRect.top : triggerRect.left
        }
        if (mode === "center") {
            return isHorizontal
                ? anchorRect.top + anchorRect.height / 2 - size / 2
                : anchorRect.left + anchorRect.width / 2 - size / 2
        }
        return isHorizontal ? anchorRect.top : anchorRect.left
    }

    /**
     * 按实测尺寸摆放浮层：优先用指定方向，那一侧放不下就翻到对面，最后统一收进视口
     *
     * 与基准的间距由 .popover-layer 的 padding 提供，所以这里直接贴着基准边缘算坐标
     *
     * 同一组里 order 更大的一块贴着前一块的外边缘，不各自贴回锚点。
     */
    function layoutSelf() {
        const element = layerRef.value
        if (!element) return

        const { width, height } = element.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const group = getPackGroup(packMember)
        const index = group.findIndex(item => item.id === packMember.id)

        if (index > 0) {
            const prevLayer = group[index - 1].getLayer()
            if (!prevLayer) return
            const prevRect = prevLayer.getBoundingClientRect()
            const place = parentPack?.actualPlacement.value ?? placement
            let left = 0
            let top = 0
            switch (place) {
                case "right":
                    left = prevRect.right
                    top = prevRect.top
                    break
                case "left":
                    left = prevRect.left - width
                    top = prevRect.top
                    break
                case "bottom":
                    top = prevRect.bottom
                    left = prevRect.left
                    break
                case "top":
                    top = prevRect.top - height
                    left = prevRect.left
                    break
            }
            actualPlacement.value = place
            position.value = {
                left: clamp(left, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN),
                top: clamp(top, VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN)
            }
            return
        }

        const anchorRect = getAnchorRect()
        if (!anchorRect) return

        let place = placement
        if (place === "right" && anchorRect.right + width > viewportWidth && anchorRect.left - width >= 0) {
            place = "left"
        } else if (place === "left" && anchorRect.left - width < 0 && anchorRect.right + width <= viewportWidth) {
            place = "right"
        } else if (place === "bottom" && anchorRect.bottom + height > viewportHeight && anchorRect.top - height >= 0) {
            place = "top"
        } else if (place === "top" && anchorRect.top - height < 0 && anchorRect.bottom + height <= viewportHeight) {
            place = "bottom"
        }

        const isHorizontal = place === "left" || place === "right"

        let left = 0
        let top = 0
        switch (place) {
            case "right":
                left = anchorRect.right
                top = resolveCross(anchorRect, height, isHorizontal)
                break
            case "left":
                left = anchorRect.left - width
                top = resolveCross(anchorRect, height, isHorizontal)
                break
            case "bottom":
                top = anchorRect.bottom
                left = resolveCross(anchorRect, width, isHorizontal)
                break
            case "top":
                top = anchorRect.top - height
                left = resolveCross(anchorRect, width, isHorizontal)
                break
        }

        actualPlacement.value = place
        position.value = {
            left: clamp(left, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN),
            top: clamp(top, VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN)
        }
    }

    const packMember: PopoverPackMember = {
        id: createPackId(),
        getOrder: () => order ?? 0,
        getGroupAnchor,
        getGroupPlacement,
        getShown: () => shown.value,
        getPointerInside: () => pointerInside,
        getLayer: () => layerRef.value ?? null,
        layoutSelf
    }

    if (parentPack) {
        watch(parentPack.actualPlacement, () => {
            if (shown.value) nextTick(() => layoutPackGroup(packMember))
        })
    }

    // 浮层内容是异步/动态的（描述长度、词条数量都会变），尺寸一变就得重新收进视口
    let observer: ResizeObserver | null = null
    function startObserve() {
        if (!layerRef.value || observer) return
        observer = new ResizeObserver(() => layoutPackGroup(packMember))
        observer.observe(layerRef.value)
    }
    function stopObserve() {
        observer?.disconnect()
        observer = null
    }

    onUnmounted(() => {
        unregisterPackMember(packMember)
        clearCloseTimer()
        clearOpenTimer()
        stopObserve()
        unbindTriggerElement()
        document.removeEventListener("click", handleDocumentClick)
    })

    defineExpose({ open, close, toggle, shown })
</script>

<style scoped lang='scss'>
.popover-trigger{
    position: relative;
    overflow: visible;

    &.inline{
        display: inline;
    }
}

.popover-layer{
    position: fixed;
    width: fit-content;

    // 间距做成 padding 而不是留空，指针横穿间隙移向浮层时中途不会落空导致浮层被关掉
    &.gap-right  { padding-left: var(--popover-gap); }
    &.gap-left   { padding-right: var(--popover-gap); }
    &.gap-top    { padding-bottom: var(--popover-gap); }
    &.gap-bottom { padding-top: var(--popover-gap); }

    .popover-inner{
        width: fit-content;
    }
}
</style>
