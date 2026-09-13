import gsap from "gsap"
import type { AnimationShorthand } from "./types"

export type DescribeFxKind = "reveal" | "motion"

export interface DescribeFxDefinition {
    key: string
    kind: DescribeFxKind
    /** 对应动画类别。不填视为不受类别开关管辖。现行内置都走 "ui" */
    category?: string
    animate?: AnimationShorthand
    build?: (el: HTMLElement) => gsap.core.Timeline
}

const describeFxMap = new Map<string, DescribeFxDefinition>()

export function registerDescribeFx(def: DescribeFxDefinition): void {
    describeFxMap.set(def.key, def)
}

export function getDescribeFx(key: string): DescribeFxDefinition | undefined {
    return describeFxMap.get(key)
}

export function normalizeFxKeys(fx: string | string[]): string[] {
    if (Array.isArray(fx)) return fx.filter(key => typeof key === "string" && key.length > 0)
    return typeof fx === "string" && fx.length > 0 ? [fx] : []
}

export function fxHasKind(keys: string[], kind: DescribeFxKind): boolean {
    return keys.some(key => getDescribeFx(key)?.kind === kind)
}

function buildAnimateTimeline(el: HTMLElement, animate: AnimationShorthand): gsap.core.Timeline {
    const tl = gsap.timeline({ paused: true })
    const { from, to, duration = 0.5, ease = "power1.inOut" } = animate
    if (from && to) {
        tl.fromTo(el, from, { ...to, duration, ease })
    } else if (from) {
        tl.from(el, { ...from, duration, ease })
    } else if (to) {
        tl.to(el, { ...to, duration, ease })
    }
    return tl
}

/** 在片段节点上叠所有 motion 类特效。返回清理函数。 */
export function playDescribeFxMotions(
    el: HTMLElement,
    keys: string[],
    timeScale: number,
): () => void {
    const timelines: gsap.core.Timeline[] = []
    for (const key of keys) {
        const def = getDescribeFx(key)
        if (!def || def.kind !== "motion") continue
        const tl = def.build
            ? def.build(el)
            : (def.animate ? buildAnimateTimeline(el, def.animate) : null)
        if (!tl) continue
        tl.timeScale(timeScale)
        tl.play()
        timelines.push(tl)
    }
    return () => {
        for (const tl of timelines) tl.kill()
        gsap.set(el, { clearProps: "x,y,transform" })
    }
}

const presetDescribeFx: DescribeFxDefinition[] = [
    {
        key: "beat",
        kind: "reveal",
        category: "ui",
    },
    {
        key: "shake",
        kind: "motion",
        category: "ui",
        build: (el) => gsap.timeline({ paused: true, repeat: -1 })
            .to(el, { x: -2, y: 1, duration: 0.03, ease: "none" })
            .to(el, { x: 2, y: -1, duration: 0.03, ease: "none" })
            .to(el, { x: -1, y: -2, duration: 0.03, ease: "none" })
            .to(el, { x: 0, y: 0, duration: 0.03, ease: "none" }),
    },
]

export function registerPresetDescribeFx(): void {
    for (const def of presetDescribeFx) {
        registerDescribeFx(def)
    }
}

registerPresetDescribeFx()
