import { ref, shallowRef, computed, nextTick, markRaw, type Ref } from "vue"
import type { Card as CardType } from "@/core/objects/item/Subclass/Card"
import { getCardGlossaries } from "@/ui/hooks/express/glossary"
import { usePopoverHost } from "@/ui/hooks/interaction/popoverHost"

/**
 * 卡牌悬浮预览
 *
 * 描述文本里的卡牌引用悬停时，在鼠标旁弹出完整卡面。
 *
 * 关键点：浮层第一帧就必须带上 position:fixed 和坐标，否则它会先以文档流位置
 * 渲染一帧再跳到鼠标旁，表现为闪现。这里的做法是先用鼠标坐标定位并 visibility:hidden，
 * 等元素测得尺寸后再修正边界并显示，全程不会出现在错误位置。
 *
 * 调用方传入 anchor（描述文本所在的元素）后，浮层会自动挂进外层浮层而不是 body，
 * 这样从器官介绍移到卡面时外层浮层不会被 mouseleave 关掉，见 usePopoverHost。
 */

/** 浮层与鼠标/触发元素的间距 */
const OFFSET = 8

export function useCardPopover(anchor?: Ref<HTMLElement | null | undefined>) {
    const hoveredCard = shallowRef<CardType | null>(null)
    const popoverRef = ref<HTMLElement>()
    const popoverStyle = ref<Record<string, string>>({})

    // 浮层挂哪：外层若已是浮层就挂进去，否则挂 body
    const host = usePopoverHost(anchor ?? ref(null))

    const hoveredGlossaries = computed(() => {
        return hoveredCard.value ? getCardGlossaries(hoveredCard.value) : []
    })

    let hideTimer: ReturnType<typeof setTimeout> | null = null

    function baseStyle(left: number, top: number, visible: boolean): Record<string, string> {
        return {
            position: "fixed",
            left: `${left}px`,
            top: `${top}px`,
            zIndex: "10001",
            visibility: visible ? "visible" : "hidden"
        }
    }

    /**
     * 在指定视口坐标旁显示卡牌
     */
    async function showAt(card: CardType, x: number, y: number) {
        cancelHide()

        // 首帧：已经是 fixed 且在鼠标旁，只是尚未显示
        popoverStyle.value = baseStyle(x + OFFSET, y, false)
        // markRaw 防止 Card 对象被深度响应式包装
        hoveredCard.value = markRaw(card)

        await nextTick()
        clampIntoViewport(x, y)
    }

    /**
     * 在触发元素旁显示卡牌
     */
    async function showNear(card: CardType, element: HTMLElement) {
        const rect = element.getBoundingClientRect()
        await showAt(card, rect.right, rect.top)
    }

    /**
     * 依据实测尺寸把浮层收进视口：右侧放不下翻到左侧，仍放不下则贴边
     */
    function clampIntoViewport(x: number, y: number) {
        const element = popoverRef.value
        if (!element) return

        const { width, height } = element.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let left = x + OFFSET
        if (left + width > viewportWidth) {
            left = x - OFFSET - width
        }
        if (left < OFFSET) {
            left = Math.max(OFFSET, viewportWidth - width - OFFSET)
        }

        let top = y
        if (top + height > viewportHeight) {
            top = viewportHeight - height - OFFSET
        }
        if (top < OFFSET) {
            top = OFFSET
        }

        popoverStyle.value = baseStyle(left, top, true)
    }

    /**
     * 隐藏浮层，delay 用于给鼠标留出移动到浮层上的时间
     */
    function hide(delay = 0) {
        cancelHide()
        if (delay <= 0) {
            hoveredCard.value = null
            return
        }
        hideTimer = setTimeout(() => {
            hoveredCard.value = null
            hideTimer = null
        }, delay)
    }

    /**
     * 取消待执行的隐藏（鼠标移进浮层时调用）
     */
    function cancelHide() {
        if (hideTimer) {
            clearTimeout(hideTimer)
            hideTimer = null
        }
    }

    return {
        hoveredCard,
        hoveredGlossaries,
        popoverRef,
        popoverStyle,
        host,
        showAt,
        showNear,
        hide,
        cancelHide
    }
}
