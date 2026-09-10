import gsap from "gsap"
import type { AnimationDefinition } from "./types"
import { animationManager } from "./AnimationManager"
import { registerAnimationCategories, presetAnimationCategories } from "./categories"
import { markRaw } from "vue"
import HitTextItem from "./components/HitTextItem.vue"

/**
 * 内置预设动画
 */
export const presetAnimations: AnimationDefinition[] = [
    // ==================== 死亡 ====================
    {
        key: "death_fadeout",
        category: "death",
        mode: "overlay",
        channel: "death",
        priority: 999,
        interruptible: false,
        animate: {
            to: { opacity: 0 },
            duration: 0.6,
            ease: "power1.in",
        },
    },

    // ==================== 受伤 ====================
    {
        key: "hit_flash",
        category: "hit",
        mode: "overlay",
        channel: "color",
        build: (el) => {
            return gsap.timeline({ paused: true })
                .to(el, { filter: "brightness(2) saturate(0)", duration: 0.05 })
                .to(el, { filter: "brightness(1) saturate(1)", duration: 0.2 })
        },
    },

    {
        key: "hit_shake",
        category: "hit",
        mode: "overlay",
        channel: "position",
        build: (el) => {
            return gsap.timeline({ paused: true })
                .to(el, { x: -3, duration: 0.05 })
                .to(el, { x: 3, duration: 0.05 })
                .to(el, { x: -2, duration: 0.05 })
                .to(el, { x: 1, duration: 0.05 })
                .to(el, { x: 0, duration: 0.05 })
        },
    },

    // ==================== 受击跳字 ====================
    // append 模式：视觉在 HitTextItem 内部，这里的 duration 只决定组件挂多久。
    // 不设 channel 互斥语义——append 模式本来就多实例并存，连击的每个数字都是独立一份。
    {
        key: "hit_text",
        category: "hitText",
        mode: "append",
        channel: "hit_text",
        appendComponent: markRaw(HitTextItem),
        duration: 1.8,
    },

    // ==================== 治疗 ====================
    {
        key: "heal_glow",
        category: "heal",
        mode: "overlay",
        channel: "color",
        build: (el) => {
            return gsap.timeline({ paused: true })
                .to(el, { filter: "brightness(1.3) hue-rotate(-30deg)", duration: 0.2 })
                .to(el, { filter: "brightness(1) hue-rotate(0deg)", duration: 0.4 })
        },
    },

    // ==================== 通用 ====================
    {
        key: "fade_in",
        category: "ui",
        mode: "overlay",
        channel: "visibility",
        animate: {
            from: { opacity: 0 },
            to: { opacity: 1 },
            duration: 0.3,
            ease: "power1.out",
        },
    },

    {
        key: "fade_out",
        category: "ui",
        mode: "overlay",
        channel: "visibility",
        animate: {
            to: { opacity: 0 },
            duration: 0.3,
            ease: "power1.in",
        },
    },

    {
        key: "scale_in",
        category: "ui",
        mode: "overlay",
        channel: "visibility",
        animate: {
            from: { scale: 0, opacity: 0 },
            to: { scale: 1, opacity: 1 },
            duration: 0.3,
            ease: "back.out(1.7)",
        },
    },

    {
        key: "pulse",
        category: "ui",
        mode: "overlay",
        channel: "emphasis",
        build: (el) => {
            return gsap.timeline({ paused: true })
                .to(el, { scale: 1.1, duration: 0.15, ease: "power1.out" })
                .to(el, { scale: 1, duration: 0.15, ease: "power1.in" })
        },
    },

    // ==================== 卡牌展示（事件用） ====================
    {
        key: "card_appear",
        category: "card",
        mode: "overlay",
        channel: "visibility",
        animate: {
            from: { opacity: 0, scale: 0.7, y: 20 },
            to: { opacity: 1, scale: 1, y: 0 },
            duration: 0.5,
            ease: "back.out(1.4)",
        },
    },

    {
        key: "card_ascend_fadeout",
        category: "card",
        mode: "overlay",
        channel: "visibility",
        interruptible: false,
        animate: {
            to: { opacity: 0, y: -60, scale: 0.95 },
            duration: 0.9,
            ease: "power2.in",
        },
    },

    {
        key: "card_duplicate_fadeout",
        category: "card",
        mode: "overlay",
        channel: "visibility",
        interruptible: false,
        build: (el) => {
            return gsap.timeline({ paused: true })
                .to(el, { scale: 1.15, filter: "brightness(1.5)", duration: 0.25, ease: "power1.out" })
                .to(el, { scale: 1.05, filter: "brightness(1.15)", duration: 0.2, ease: "power1.inOut" })
                .to(el, { opacity: 0, scale: 1.25, duration: 0.45, ease: "power2.in" })
        },
    },

    {
        key: "card_fly",
        category: "card",
        mode: "overlay",
        channel: "flight",
        interruptible: false,
        repeat: "queue",
        build: (el, params) => {
            const dx = Number(params?.dx ?? 0)
            const dy = Number(params?.dy ?? 0)
            const hold = Number(params?.hold ?? 0)
            const fromRot = Number(params?.fromRot ?? 0)
            const toRot = Number(params?.toRot ?? 0)
            const scale = Number(params?.scale ?? 1)
            const vanish = Boolean(params?.vanish)
            const tl = gsap.timeline({ paused: true })
            gsap.set(el, { rotation: fromRot, opacity: 1, scale: 1 })
            if (vanish) {
                const dur = 0.36
                const x0 = Number(gsap.getProperty(el, "x")) || 0
                const y0 = Number(gsap.getProperty(el, "y")) || 0
                const bulge = Math.min(28, Math.hypot(dx - x0, dy - y0) * 0.1)
                const cx = (x0 + dx) / 2
                const cy = Math.min(y0, dy) - bulge
                const prog = { t: 0 }
                tl.to(prog, {
                    t: 1,
                    duration: dur,
                    ease: "power2.inOut",
                    onUpdate: () => {
                        const t = prog.t
                        const u = 1 - t
                        gsap.set(el, {
                            x: u * u * x0 + 2 * u * t * cx + t * t * dx,
                            y: u * u * y0 + 2 * u * t * cy + t * t * dy,
                        })
                    },
                })
                tl.to(el, { rotation: toRot, duration: dur, ease: "power2.inOut" }, 0)
                tl.to(el, {
                    scale: 0.1,
                    opacity: 0,
                    duration: dur * 2 / 3,
                    ease: "power2.in",
                }, dur / 3)
            } else {
                tl.to(el, {
                    x: dx,
                    y: dy,
                    rotation: toRot,
                    scale,
                    duration: 0.28,
                    ease: hold > 0 ? "power2.out" : "power2.inOut",
                })
            }
            if (hold > 0) tl.to({}, { duration: hold })
            return tl
        },
    },
]

/**
 * 注册所有预设动画（含它们所属的内置类别）
 */
export function registerPresetAnimations(): void {
    registerAnimationCategories(presetAnimationCategories)
    animationManager.registerAll(presetAnimations)
}
