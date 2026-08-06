import { ref, onMounted, type Ref } from "vue"

/**
 * 浮层根元素的标记类名
 *
 * 浮层靠它认出「我现在处在哪个浮层里面」，见 usePopoverHost。
 */
export const POPOVER_LAYER_CLASS = "popover-layer"

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
        const layer = anchor.value?.closest(`.${POPOVER_LAYER_CLASS}`)
        if (layer instanceof HTMLElement) {
            host.value = layer
        }
    })

    return host
}
