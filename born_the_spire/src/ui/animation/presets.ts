import gsap from "gsap"
import type { AnimationDefinition } from "./types"
import { animationManager } from "./AnimationManager"

/**
 * 内置预设动画
 */
export const presetAnimations: AnimationDefinition[] = [
    // ==================== 死亡 ====================
    {
        key: "death_fadeout",
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
        mode: "overlay",
        channel: "position",
        build: (el) => {
            return gsap.timeline({ paused: true })
                .to(el, { x: -6, duration: 0.04 })
                .to(el, { x: 6, duration: 0.04 })
                .to(el, { x: -4, duration: 0.04 })
                .to(el, { x: 4, duration: 0.04 })
                .to(el, { x: 0, duration: 0.04 })
        },
    },

    // ==================== 治疗 ====================
    {
        key: "heal_glow",
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
]

/**
 * 注册所有预设动画
 */
export function registerPresetAnimations(): void {
    animationManager.registerAll(presetAnimations)
}
