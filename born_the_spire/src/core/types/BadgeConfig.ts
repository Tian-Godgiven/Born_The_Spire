/**
 * 角标配置系统
 *
 * 角标是显示在遗物/器官四个角上的小标签，用于展示状态信息
 *
 * 类型 → 默认位置映射：
 *   indicator → 左上（类型标识，如 ⚡、临时）
 *   state     → 右上（状态/模式，如 偶/奇）
 *   counter   → 左下（累积/计数，如 3/10）
 *   cooldown  → 右下（冷却/消耗，0 时显示 ✓）
 *
 * 使用示例：
 *
 * 最简（只写类型，位置/格式自动推断）：
 *   badges: [{ type: "cooldown", status: "cooldown" }]
 *
 * 计数器（自动显示为 "当前/最大"）：
 *   badges: [{ type: "counter", status: "point", maxStatus: "maxPoint" }]
 *
 * 状态（自动用 displayMap 映射）：
 *   badges: [{ type: "state", status: "mode" }]
 *
 * 固定文字：
 *   badges: [{ type: "indicator", text: "稀有" }]
 *
 * 引用 owner 的属性：
 *   badges: [{ type: "counter", value: "$owner.stateStack(power)" }]
 *
 * 条件显示：
 *   badges: [{ type: "cooldown", status: "cooldown", showWhen: "$scene == combat" }]
 *
 * 覆盖位置和样式：
 *   badges: [{ type: "counter", status: "point", maxStatus: "maxPoint", position: "top-right", style: { backgroundColor: "#ff0000" } }]
 */

import type { Condition } from "./ConditionSystem"

export type BadgeType = "indicator" | "state" | "counter" | "cooldown"

export type BadgePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right"

/**
 * 角标配置
 */
export interface BadgeConfig {
    type: BadgeType

    // === 数据来源（选一个） ===
    status?: string        // 从自身 entity.status[key] 读值
    maxStatus?: string     // counter 类型的分母，从自身 status 读
    value?: string         // 通用引用表达式（$ 语法），如 "$owner.stateStack(power)"
    maxValue?: string | number  // counter 的分母，支持引用或固定数字
    text?: string          // 固定文字

    // === 条件显示 ===
    showWhen?: Condition   // 复用 ConditionSystem，如 "$scene == combat"

    // === 显示覆盖 ===
    position?: BadgePosition  // 覆盖默认位置
    style?: Record<string, string>  // 自定义样式
}

/**
 * 角标运行时数据（计算后传给 Vue 组件渲染）
 */
export interface BadgeRenderData {
    position: BadgePosition
    text: string
    style: Record<string, string>
    visible: boolean
}

// ==================== 默认配置 ====================

/**
 * 类型 → 默认位置
 */
export const BADGE_DEFAULT_POSITION: Record<BadgeType, BadgePosition> = {
    indicator: "top-left",
    state: "top-right",
    counter: "bottom-left",
    cooldown: "bottom-right",
}

/**
 * 类型 → 默认样式
 */
export const BADGE_DEFAULT_STYLE: Record<BadgeType, Record<string, string>> = {
    indicator: { backgroundColor: "#3b82f6", color: "white" },
    state: { backgroundColor: "#9b59b6", color: "white" },
    counter: { backgroundColor: "#2ecc71", color: "white" },
    cooldown: { backgroundColor: "#666", color: "white" },
}
