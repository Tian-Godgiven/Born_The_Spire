/**
 * 统一的目标解析系统
 *
 * 核心思想：targetType 是一个"键名"，从 context 中获取对应的值
 * 如果 context 中没有该键，说明调用方式有误，抛出错误
 */

import type { Entity } from "@/core/objects/system/Entity"
import type { ActionEvent } from "@/core/objects/system/ActionEvent"
import type { Effect } from "@/core/objects/system/effect/Effect"
import type { TriggerMapItem } from "@/core/types/object/trigger"
import { nowBattle } from "@/core/objects/game/battle"
import { randomChoice } from "@/core/hooks/random"
import { isEntity, isEffect } from "@/core/utils/typeGuards"

// ==================== TargetContext 定义 ====================

/**
 * 目标解析的上下文
 *
 * 所有需要的对象都平级放在 context 中
 * targetType 作为键名从 context 中获取值
 */
export interface TargetContext {
    // 基础对象
    item?: Entity               // 物品自身（遗物/器官/卡牌）
    owner?: Entity              // 物品拥有者（玩家/敌人）
    source?: Entity             // 事件来源（可指代不同含义）
    target?: Entity | Entity[]  // 事件目标

    // 事件相关
    event?: ActionEvent         // 当前事件

    // 触发器相关
    trigger?: TriggerMapItem    // 触发器定义
    triggerSource?: Entity      // 触发器的 source（通常就是 item）
    triggerOwner?: Entity       // 触发器的 owner（通常就是 owner）
    triggerEffect?: Effect      // 触发效果

    // 事件触发器上下文（来自 event.triggerContext）
    eventTriggerSource?: Entity
    eventTriggerOwner?: Entity

    // 战斗相关
    battle?: any

    // 其他自定义字段
    [key: string]: any
}

// ==================== resolveTarget 函数 ====================

/**
 * 支持的 targetType 字符串类型
 */
export type TargetTypeString =
    | "item" | "owner" | "source" | "target" | "effect"
    | "eventSource" | "eventMedium" | "eventTarget"
    | "trigger" | "triggerSource" | "triggerOwner"
    | "eventTriggerSource" | "eventTriggerOwner"
    | "battle" | "player" | "players"
    | "enemy" | "enemies" | "randomEnemy" | "allEnemies" | "allAllies"
    | "turnNumber"
    | "triggerEffect"  // 触发效果 (Effect 类型)
    | string  // 允许自定义键

/**
 * 统一的目标解析函数
 *
 * @param targetType - 目标类型（键名）
 * @param context - 上下文对象，包含所有可能需要的引用
 * @returns 解析后的目标对象（Entity、Entity数组），找不到返回 null
 * @throws Error - 如果 context 中没有该键，说明调用方式有误
 *
 * @example
 * // 基础用法
 * resolveTarget("item", { item: relic })  // → relic
 * resolveTarget("owner", { owner: player })  // → player
 *
 * // 事件相关
 * resolveTarget("eventSource", { event })  // → event.source
 * resolveTarget("eventTarget", { event })  // → event.target
 *
 * // 触发器相关
 * resolveTarget("triggerSource", { triggerSource })  // → triggerSource
 * resolveTarget("triggerOwner", { triggerOwner })  // → triggerOwner
 *
 * // 嵌套获取
 * resolveTarget("eventSource", { event: { source: player } })  // → player
 */
export function resolveTarget(
    targetType: TargetTypeString,
    context: TargetContext
): Entity | Entity[] | Effect {
    const value = getTargetValue(targetType, context)

    if (value === undefined) {
        throw new Error(
            `[resolveTarget] context 中没有找到 targetType: "${targetType}"\n` +
            `可用的键: ${Object.keys(context).filter(k => context[k] !== undefined).join(", ")}`
        )
    }

    // 不允许 null，如果需要可选目标请使用 resolveTargetOptional
    if (value === null) {
        throw new Error(
            `[resolveTarget] targetType "${targetType}" 找到了空值（null）。如果这是可选目标，请使用 resolveTargetOptional`
        )
    }

    // 允许 EventParticipant (Entity, Effect, Battle, State等)、Entity数组
    const isValidType =
        (value as any)?.participantType ||  // 任意 EventParticipant
        Array.isArray(value)                  // Entity 数组

    if (!isValidType) {
        throw new Error(
            `[resolveTarget] targetType "${targetType}" 的值不是有效类型（EventParticipant/Entity[]）：${typeof value}`
        )
    }

    return value
}

/**
 * 获取目标值（内部函数，返回 undefined 或 null 而不是抛错）
 * - undefined 表示 context 中没有该键
 * - null 表示找到但没有目标（如空数组的第一个元素）
 */
export function getTargetValue(
    targetType: string,
    context: TargetContext
): Entity | Entity[] | Effect | undefined | null {
    switch (targetType) {
        // 直接从 context 获取
        case "item": return context.item
        case "owner": return context.owner
        case "source": return context.source
        case "target": return context.target

        // 事件相关 - 需要类型断言，因为 ActionEvent 的 source/medium/target 是 EventParticipant
        case "eventSource": return context.event?.source as Entity | undefined
        case "eventMedium": return context.event?.medium as Entity | undefined
        case "eventTarget": return context.event?.target as Entity | Entity[] | undefined

        // 触发器相关 - 直接从 context 获取
        case "triggerSource": return context.triggerSource
        case "triggerOwner": return context.triggerOwner
        case "triggerEffect": return context.triggerEffect

        // 事件触发器相关（来自 event.triggerContext）
        case "eventTriggerSource": return context.eventTriggerSource ?? context.event?.triggerContext?.source ?? context.triggerSource
        case "eventTriggerOwner": return context.eventTriggerOwner ?? context.event?.triggerContext?.owner ?? context.triggerOwner

        // 战斗相关
        case "battle": return context.battle

        // 通过 battle 获取的对象
        case "player":
            if (!context.battle) throw new Error("[resolveTarget] battle 不存在，无法获取 player")
            const player = context.battle.getTeam("player")?.[0]
            if (!player) throw new Error("[resolveTarget] 战斗中没有玩家")
            return player
        case "players":
            if (!context.battle) throw new Error("[resolveTarget] battle 不存在，无法获取 players")
            return context.battle.getTeam("player") || []
        case "enemy":
            if (!context.battle) throw new Error("[resolveTarget] battle 不存在，无法获取 enemy")
            const enemies = context.battle.getAliveEnemies()
            return enemies[0]
        case "enemies":
            if (!context.battle) throw new Error("[resolveTarget] battle 不存在，无法获取 enemies")
            return context.battle.getAliveEnemies()
        case "randomEnemy":
            if (!context.battle) throw new Error("[resolveTarget] battle 不存在，无法获取 randomEnemy")
            const allEnemies = context.battle.getAliveEnemies()
            if (allEnemies.length === 0) throw new Error("[resolveTarget] 战斗中没有可用的敌人")
            return randomChoice(allEnemies, "randomEnemy")
        case "allEnemies":
            if (!context.battle) throw new Error("[resolveTarget] battle 不存在，无法获取 allEnemies")
            return context.battle.getAliveEnemies()
        case "allAllies":
            if (!context.battle) throw new Error("[resolveTarget] battle 不存在，无法获取 allAllies")
            return context.battle.getTeam("player") || []
        case "allEntities":
            if (!context.battle) throw new Error("[resolveTarget] battle 不存在，无法获取 allEntities")
            return [...context.battle.getTeam("player"), ...context.battle.getAliveEnemies()]

        // 默认：直接从 context 中获取（允许自定义键）
        default:
            return context[targetType]
    }
}

// ==================== 分步解析函数 ====================

/**
 * 解析 targetType 为实际的目标对象
 * 如果找不到目标，返回 null（不抛错，用于可选目标）
 */
export function resolveTargetOptional(
    targetType: string,
    context: TargetContext
): Entity | Entity[] | Effect | null {
    try {
        const result = resolveTarget(targetType, context)
        return result
    } catch {
        return null
    }
}

/**
 * 解析 targetType，返回多个可能的目标（用于数组场景）
 */
export function resolveTargetArray(
    targetType: string,
    context: TargetContext
): Entity[] {
    const target = resolveTarget(targetType, context)
    if (Array.isArray(target)) return target
    return [target]
}

// ==================== 类型保护 ====================

/**
 * 判断 context 中是否有指定的 targetType
 */
export function hasTarget(targetType: string, context: TargetContext): boolean {
    const value = getTargetValue(targetType, context)
    return value !== undefined
}

/**
 * 判断 targetType 是否是嵌套路径（如 "event.source"）
 */
export function isNestedPath(targetType: string): boolean {
    return targetType.includes(".")
}

/**
 * 解析嵌套路径（如 "event.source" → context.event.source）
 */
export function resolveNestedPath(
    path: string,
    context: TargetContext
): any {
    const parts = path.split(".")
    let current: any = context

    for (const part of parts) {
        if (current === undefined || current === null) return undefined
        current = current[part]
    }

    return current
}
