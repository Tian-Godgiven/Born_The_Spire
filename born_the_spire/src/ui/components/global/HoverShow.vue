<template>
<div class="hoverShow"
    ref="mainRef"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave">
    <slot></slot>
    <Teleport :to="host">
        <div v-if="ifShow"
            ref="hoverRef"
            class="hover"
            :class="[POPOVER_LAYER_CLASS, `gap-${actualPosition}`]"
            :style="hoverStyle"
            @mouseenter="handleEnter"
            @mouseleave="handleLeave">
            <div class="hover-inner" :style="{ maxWidth: `${maxWidth}px` }">
                <slot name="hover"></slot>
            </div>
        </div>
    </Teleport>
</div>
</template>

<script setup lang='ts'>
    import { ref, watch, nextTick, onUnmounted, useTemplateRef } from 'vue';
    import { usePopoverHost, POPOVER_LAYER_CLASS } from '@/ui/hooks/interaction/popoverHost';

    type HoverPosition = "left" | "right" | "top" | "bottom"

    const {
        hoverPosition = "left",
        maxWidth = 300,
        waitTime = 200,
        disabled = false,
        anchor = null
    } = defineProps<{
        hoverPosition?: HoverPosition,
        maxWidth?: number,
        waitTime?: number,
        disabled?: boolean,
        /** 自定义定位基准，不传则以触发区内容为准。用于浮层要贴住内部某个子元素的场景 */
        anchor?: HTMLElement | null
    }>()

    const emit = defineEmits<{
        /** 浮层开合，使用方可据此清理只在浮层显示期间有意义的状态 */
        'update:show': [value: boolean]
    }>()

    /** 贴边时与视口保持的最小距离 */
    const VIEWPORT_MARGIN = 8

    const mainRef = useTemplateRef<HTMLElement>("mainRef")
    const hoverRef = useTemplateRef<HTMLElement>("hoverRef")

    const host = usePopoverHost(mainRef)

    const ifShow = ref(false)
    /** 翻转后实际采用的方向，间隙 padding 也跟着它走 */
    const actualPosition = ref<HoverPosition>(hoverPosition)
    const hoverStyle = ref<Record<string, string>>({})

    /** 鼠标是否停在触发区或浮层内。浮层挂在触发区之外，两边共用同一套进出逻辑 */
    let pointerInside = false
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    function clearHideTimer() {
        if (hideTimer) {
            clearTimeout(hideTimer)
            hideTimer = null
        }
    }

    function handleEnter() {
        // 先记录鼠标位置再看 disabled：禁用期间鼠标可能已经停在触发区上，
        // 等 disabled 转回可用时要能立刻把浮层补上
        pointerInside = true
        clearHideTimer()
        if (disabled) return
        ifShow.value = true
    }

    function handleLeave() {
        pointerInside = false
        clearHideTimer()
        // 延迟关闭，留出鼠标横穿间隙移进浮层的时间
        hideTimer = setTimeout(() => {
            hideTimer = null
            if (pointerInside) return
            ifShow.value = false
        }, waitTime)
    }

    watch(() => disabled, (isDisabled) => {
        if (isDisabled) {
            clearHideTimer()
            ifShow.value = false
        } else if (pointerInside) {
            ifShow.value = true
        }
    })

    watch(ifShow, async (show) => {
        emit('update:show', show)
        if (!show) {
            stopObserve()
            return
        }
        // 首帧就是 fixed，只是尚未显形，避免先按文档流画一帧再跳到目标位置
        hoverStyle.value = { position: "fixed", left: "0px", top: "0px", visibility: "hidden" }
        await nextTick()
        updatePosition()
        startObserve()
    })

    // 锚点换了（比如浮层跟着当前悬停的器官走）要重新贴过去
    watch(() => anchor, () => {
        if (ifShow.value) nextTick(updatePosition)
    })

    /**
     * 定位基准
     *
     * 不传 anchor 时取触发区的第一个子元素而非 .hoverShow 本身：.hoverShow 是块级 wrapper，
     * 会被父容器撑满宽度，拿它定位会让浮层离实际内容很远。
     */
    function getAnchorRect(): DOMRect | null {
        if (anchor) return anchor.getBoundingClientRect()
        const wrapper = mainRef.value
        if (!wrapper) return null
        return (wrapper.firstElementChild ?? wrapper).getBoundingClientRect()
    }

    function clamp(value: number, min: number, max: number): number {
        if (max < min) return min
        return Math.min(Math.max(value, min), max)
    }

    /**
     * 按实测尺寸摆放浮层：优先用指定方向，那一侧放不下就翻到对面，最后统一收进视口
     *
     * 与锚点的间距由 .hover 的 padding 提供，所以这里直接贴着锚点边缘算坐标
     */
    function updatePosition() {
        const anchorRect = getAnchorRect()
        const element = hoverRef.value
        if (!anchorRect || !element) return

        const { width, height } = element.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let place = hoverPosition
        if (place === "right" && anchorRect.right + width > viewportWidth && anchorRect.left - width >= 0) {
            place = "left"
        } else if (place === "left" && anchorRect.left - width < 0 && anchorRect.right + width <= viewportWidth) {
            place = "right"
        } else if (place === "bottom" && anchorRect.bottom + height > viewportHeight && anchorRect.top - height >= 0) {
            place = "top"
        } else if (place === "top" && anchorRect.top - height < 0 && anchorRect.bottom + height <= viewportHeight) {
            place = "bottom"
        }

        let left = 0
        let top = 0
        switch (place) {
            case "right":
                left = anchorRect.right
                top = anchorRect.top
                break
            case "left":
                left = anchorRect.left - width
                top = anchorRect.top
                break
            case "top":
                left = anchorRect.left + anchorRect.width / 2 - width / 2
                top = anchorRect.top - height
                break
            case "bottom":
                left = anchorRect.left + anchorRect.width / 2 - width / 2
                top = anchorRect.bottom
                break
        }

        actualPosition.value = place
        hoverStyle.value = {
            position: "fixed",
            left: `${clamp(left, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN)}px`,
            top: `${clamp(top, VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN)}px`,
            visibility: "visible"
        }
    }

    // 浮层内容是异步/动态的（描述长度、词条数量都会变），尺寸一变就得重新收进视口
    let observer: ResizeObserver | null = null
    function startObserve() {
        if (!hoverRef.value || observer) return
        observer = new ResizeObserver(() => updatePosition())
        observer.observe(hoverRef.value)
    }
    function stopObserve() {
        observer?.disconnect()
        observer = null
    }

    onUnmounted(() => {
        clearHideTimer()
        stopObserve()
    })
</script>

<style scoped lang='scss'>
/** 与锚点之间的间距，做成 padding 而不是留空，让间隙本身也算浮层的命中区域 */
$gap: 12px;

.hoverShow{
    position: relative;
    overflow: visible;
}
.hover{
    position: fixed;
    z-index: 1000;
    width: fit-content;

    // 鼠标横穿间隙移向浮层时，中途不会落空导致浮层被关掉
    &.gap-right  { padding-left: $gap; }
    &.gap-left   { padding-right: $gap; }
    &.gap-top    { padding-bottom: $gap; }
    &.gap-bottom { padding-top: $gap; }

    .hover-inner{
        width: fit-content;
    }
}
</style>
