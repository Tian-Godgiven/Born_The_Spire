/**
 * 效果预览系统
 * 用于在不真正执行效果的情况下，计算效果的最终数值
 */

import type { Card } from "@/core/objects/item/Subclass/Card"
import type { Entity } from "@/core/objects/system/Entity"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { effectMap } from "@/static/list/system/effectMap"

/**
 * 预览结果
 */
export interface PreviewResult {
    [effectKey: string]: number
}

/**
 * 模拟事件对象
 * 用于预览，不会真正执行效果
 */
interface MockEvent {
    key: string
    source: Entity
    target: Entity | Entity[] | null
    effects: EffectUnit[]
    isPreview: true
    spawnedEvents: MockEvent[]  // 捕获生成的子事件
    spawnEvent: (config: any) => void
}

/**
 * 创建模拟事件
 */
function createMockEvent(
    key: string,
    source: Entity,
    target: Entity | Entity[] | null,
    effects: EffectUnit[]
): MockEvent {
    const spawnedEvents: MockEvent[] = []

    const mockEvent: MockEvent = {
        key,
        source,
        target,
        effects,
        isPreview: true,
        spawnedEvents,
        spawnEvent(config: any) {
            // 捕获生成的子事件
            const childEvent = createMockEvent(
                config.key,
                config.source || source,
                config.target || target,
                config.effects || []
            )
            spawnedEvents.push(childEvent)
        }
    }

    return mockEvent
}

/**
 * 执行效果的预览
 * 调用效果的 preview 方法（如果有）
 */
function executeEffectPreview(effectKey: string, effect: EffectUnit, event: MockEvent): number | null {
    const effectDef = effectMap.find((e: any) => e.key === effectKey)
    if (!effectDef) {
        console.warn(`[EffectPreview] 未找到效果定义: ${effectKey}`)
        return null
    }

    // 如果效果有 preview 方法，调用它
    if (typeof effectDef.preview === "function") {
        return effectDef.preview(event, effect)
    }

    return null
}

/**
 * 处理生成的子事件
 * 递归执行子事件的预览
 */
function processSpawnedEvents(mockEvent: MockEvent): void {
    for (const childEvent of mockEvent.spawnedEvents) {
        // 执行子事件的触发器
        executeMockTriggers(childEvent)

        // 执行子事件的效果预览
        for (const effect of childEvent.effects) {
            executeEffectPreview(effect.key, effect, childEvent)
        }

        // 递归处理子事件的子事件
        processSpawnedEvents(childEvent)
    }
}

/**
 * 执行模拟事件的触发器
 */
function executeMockTriggers(mockEvent: MockEvent): void {
    const { source, target, key } = mockEvent

    // 执行 source 的 before_make 触发器
    if (source && source.trigger) {
        const triggers = source.trigger.getTriggers?.("before", "make", key)
        if (triggers) {
            for (const trigger of triggers) {
                trigger.callback(mockEvent, null)
            }
        }
    }

    // 执行 target 的 before_take 触发器
    if (target && !Array.isArray(target) && target.trigger) {
        const triggers = target.trigger.getTriggers?.("before", "take", key)
        if (triggers) {
            for (const trigger of triggers) {
                trigger.callback(mockEvent, null)
            }
        }
    }
}

/**
 * 预览卡牌效果
 *
 * @param card 卡牌对象
 * @param source 使用卡牌的实体（通常是玩家）
 * @param target 目标实体（可选，如果不提供则只考虑 source 的状态）
 * @returns 预览结果，包含各个效果的最终数值
 */
export function previewCardEffects(
    card: Card,
    source: Entity,
    target?: Entity | Entity[]
): PreviewResult {
    const result: PreviewResult = {}

    // 获取卡牌的使用效果（从 useInteractions 数组中获取第一个）
    const useInteraction = card.useInteractions?.[0]
    if (!useInteraction || !useInteraction.effects) {
        return result
    }

    // 为每个效果创建模拟事件
    for (const effectUnit of useInteraction.effects) {
        const mockEvent = createMockEvent(
            effectUnit.key,
            source,
            target || null,
            [effectUnit]
        )

        // 1. 执行触发器（会生成子事件）
        executeMockTriggers(mockEvent)

        // 2. 处理生成的子事件（如 modifyDamage）
        processSpawnedEvents(mockEvent)

        // 3. 读取最终的效果值
        const previewValue = executeEffectPreview(effectUnit.key, effectUnit, mockEvent)
        if (previewValue !== null) {
            result[effectUnit.key] = previewValue
        }
    }

    return result
}

// ==================== 预览函数工厂 ====================
// 供 effectMap 中的效果声明式地接入预览系统
// 使用方式见文件顶部注释

/**
 * 值类效果的预览函数
 * 适用于：damage, heal, gainArmor 等——触发器会改 params.value，这里只负责读出
 *
 * 用法: { key: "damage", effect: damageTo, preview: previewValue }
 */
export const previewValue = (_event: any, effect: any): number => {
    return Number(effect.params.value) || 0
}

/**
 * 修改器效果的预览函数工厂（按增量）
 * 适用于：modifyDamageValue 等——把增量加到目标效果的 params.value 上
 *
 * @param targetEffectKey 要修改的目标效果 key（如 "damage"）
 * 用法: { key: "modifyDamageValue", effect: ..., preview: previewModifyValue("damage") }
 */
export const previewModifyValue = (targetEffectKey: string) =>
    (event: any, effect: any): number | null => {
        const delta = Number(effect.params.delta)
        const targetEffect = event.effects[0]
        if (targetEffect && targetEffect.key === targetEffectKey) {
            const oldValue = Number(targetEffect.params.value)
            const newValue = Math.max(0, oldValue + delta)
            targetEffect.params.value = newValue
            return newValue
        }
        return null
    }

/**
 * 修改器效果的预览函数工厂（按百分比）
 * 适用于：modifyDamageByPercent 等
 *
 * @param targetEffectKey 要修改的目标效果 key
 * 用法: { key: "modifyDamageByPercent", effect: ..., preview: previewModifyByPercent("damage") }
 */
export const previewModifyByPercent = (targetEffectKey: string) =>
    (event: any, effect: any): number | null => {
        const percent = Number(effect.params.percent)
        const targetEffect = event.effects[0]
        if (targetEffect && targetEffect.key === targetEffectKey) {
            const oldValue = Number(targetEffect.params.value)
            const delta = Math.round(oldValue * percent)
            const newValue = Math.max(0, oldValue + delta)
            targetEffect.params.value = newValue
            return newValue
        }
        return null
    }

/**
 * 预览单个效果的值
 * 便捷方法，用于只关心某个效果的情况
 */
export function previewEffectValue(
    card: Card,
    source: Entity,
    effectKey: string,
    target?: Entity | Entity[]
): number {
    const result = previewCardEffects(card, source, target)
    return result[effectKey] || 0
}
