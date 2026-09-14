import { ref } from "vue"

export type LayoutMode = "pc" | "mobile"

/** 当前布局。组件里只有少数 JS 尺寸（手牌重叠）读这个，样式一律走 CSS 变量 */
export const layoutMode = ref<LayoutMode>("pc")

const SHORT_SIDE_MAX = 900

/** 触屏且短边 ≤ 900。和当前横竖无关，竖屏也算手机 */
export function isPhoneDevice(): boolean {
    if (typeof window === "undefined") return false
    const coarse = window.matchMedia("(pointer: coarse)").matches
    const noHover = window.matchMedia("(hover: none)").matches
    const shortSide = Math.min(window.innerWidth, window.innerHeight)
    return (coarse || noHover) && shortSide <= SHORT_SIDE_MAX
}

function readMode(): LayoutMode {
    // 竖屏不当手机布局，走 PC 那套
    if (window.innerHeight > window.innerWidth) return "pc"
    if (isPhoneDevice()) return "mobile"
    return "pc"
}

/**
 * 在用户点击「开始游戏」的同步栈里调用。await 之后再调会丢掉手势，Android 会拒。
 * 已经全屏、PC、或不支持的浏览器（iPhone Safari）直接返回。
 */
export function requestGameFullscreen() {
    if (typeof document === "undefined") return
    if (!isPhoneDevice()) return
    if (document.fullscreenElement) return
    const root = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void
    }
    const request = root.requestFullscreen?.bind(root)
        ?? root.webkitRequestFullscreen?.bind(root)
    if (!request) return
    void Promise.resolve(request()).catch(() => {})
}

function apply() {
    const mode = readMode()
    layoutMode.value = mode
    document.documentElement.dataset.layout = mode
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
