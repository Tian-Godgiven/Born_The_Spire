import { ref } from "vue"

export type LayoutMode = "pc" | "mobile"

/** 当前布局。组件里只有少数 JS 尺寸（手牌重叠）读这个，样式一律走 CSS 变量 */
export const layoutMode = ref<LayoutMode>("pc")

/** 移动端竖屏：只提示横过来，不做竖版布局 */
export const needsLandscapePrompt = ref(false)

const SHORT_SIDE_MAX = 900

function readMode(): LayoutMode {
    const coarse = window.matchMedia("(pointer: coarse)").matches
    const noHover = window.matchMedia("(hover: none)").matches
    const shortSide = Math.min(window.innerWidth, window.innerHeight)
    if ((coarse || noHover) && shortSide <= SHORT_SIDE_MAX) return "mobile"
    return "pc"
}

function apply() {
    const mode = readMode()
    layoutMode.value = mode
    document.documentElement.dataset.layout = mode
    needsLandscapePrompt.value = mode === "mobile" && window.innerHeight > window.innerWidth
}

let started = false

export function initLayoutMode() {
    if (typeof window === "undefined") return
    apply()
    if (started) return
    started = true
    window.addEventListener("resize", apply)
    window.addEventListener("orientationchange", apply)
    window.matchMedia("(pointer: coarse)").addEventListener("change", apply)
    window.matchMedia("(hover: none)").addEventListener("change", apply)
}
