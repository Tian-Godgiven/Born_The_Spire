import { ref, onMounted, type Ref } from "vue"

/**
 * 打开游戏内容弹窗时把所有悬停浮层收掉，避免 10000 的术语/卡名预览盖住 9999 的弹窗。
 */
export const popoverDismissToken = ref(0)

export function dismissAllPopovers() {
    popoverDismissToken.value++
}

/**
 * 浮层根元素的标记类名
 *
 * 浮层靠它认出「我现在处在哪个浮层里面」，见 usePopoverHost / findPopoverLayer。
 */
export const POPOVER_LAYER_CLASS = "popover-layer"

/**
 * 所有浮层共用的层级
 *
 * 取值高于全部模态框（现有模态最高 9999）：模态里同样会弹卡面、术语这类浮层，
 * 层级低于模态的话浮层会被自己所在的模态盖住。
 * 嵌套浮层是外层浮层的 DOM 子节点，同值即可自然叠在外层之上，不需要逐层加码。
 */
export const POPOVER_Z_INDEX = 10000

const POPOVER_HOVER_OPEN_DELAY_FALLBACK_MS = 400

/**
 * 悬停过多久才弹出。数值来自全局 SCSS `$popover-hover-open-delay`（写成 CSS 变量）。
 */
export function getPopoverHoverOpenDelay(): number {
    if (typeof document === "undefined") return POPOVER_HOVER_OPEN_DELAY_FALLBACK_MS
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--popover-hover-open-delay")
        .trim()
    if (!raw) return POPOVER_HOVER_OPEN_DELAY_FALLBACK_MS
    if (raw.endsWith("ms")) {
        const value = parseFloat(raw)
        return Number.isFinite(value) ? value : POPOVER_HOVER_OPEN_DELAY_FALLBACK_MS
    }
    if (raw.endsWith("s")) {
        const value = parseFloat(raw)
        return Number.isFinite(value) ? value * 1000 : POPOVER_HOVER_OPEN_DELAY_FALLBACK_MS
    }
    const value = parseFloat(raw)
    return Number.isFinite(value) ? value : POPOVER_HOVER_OPEN_DELAY_FALLBACK_MS
}

/**
 * 找出元素所处的浮层根节点，不在任何浮层里则返回 null
 */
export function findPopoverLayer(element: HTMLElement | null | undefined): HTMLElement | null {
    const layer = element?.closest(`.${POPOVER_LAYER_CLASS}`)
    return layer instanceof HTMLElement ? layer : null
}

/**
 * 决定浮层挂到 DOM 的哪个位置
 *
 * 默认挂 body：既躲开祖先的 overflow 裁剪，也躲开 GSAP 写在角色身上的 inline transform
 * ——transform 会成为后代 position:fixed 的包含块，就地渲染会让浮层相对角色而不是视口定位。
 *
 * 但触发元素本身就在另一个浮层里时，改挂进那个浮层。外层浮层已经在 body 下且不带 transform，
 * fixed 定位一样准；而 DOM 上保住父子关系，鼠标从外层浮层移进内层浮层时才不会触发外层的
 * mouseleave。器官介绍里的卡牌预览之所以点不进去，就是因为原先一律挂 body 断开了这层关系。
 */
export function usePopoverHost(anchor: Ref<HTMLElement | null | undefined>) {
    const host = ref<HTMLElement | string>("body")

    onMounted(() => {
        const layer = findPopoverLayer(anchor.value)
        if (layer) host.value = layer
    })

    return host
}
