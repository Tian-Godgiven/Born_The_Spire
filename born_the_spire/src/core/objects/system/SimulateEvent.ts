import { ActionEvent } from "./ActionEvent"
import { Effect } from "./effect/Effect"
import { EffectUnit, createEffectByUnit } from "./effect/EffectUnit"
import { Entity } from "./Entity"
import { EventParticipant } from "@/core/types/event/EventParticipant"
import { isEntity } from "@/core/utils/typeGuards"
import { cloneDeep } from "lodash"

/**
 * 事件模拟系统
 *
 * 用于模拟事件的执行流程，但不实际执行效果和产生副作用
 * 主要用途：
 * - 意图系统：计算受 Buff 影响后的伤害/格挡
 * - Mod 功能：预测效果结果
 * - AI 决策：评估不同行动的收益
 *
 * 模拟模式下：
 * - 触发器会被执行（可以修改 effect 参数）
 * - 效果函数不会被执行（不修改游戏状态）
 * - 不产生副作用（不消耗资源、不创建修饰器等）
 * - 不收集到事务中
 * - 不创建日志
 */

/**
 * 模拟单个效果的执行
 *
 * 创建一个模拟的 ActionEvent，触发相关触发器，但不执行效果函数
 *
 * @param effectUnit 要模拟的效果单元
 * @param source 效果来源
 * @param medium 效果媒介
 * @param target 效果目标
 * @returns 修改后的效果单元（包含触发器修改后的参数）
 */
export function simulateEffect(
    effectUnit: EffectUnit,
    source: EventParticipant,
    medium: EventParticipant,
    target: EventParticipant | EventParticipant[]
): EffectUnit {
    // 深拷贝 effect，避免修改原对象
    const mockEffectUnit = cloneDeep(effectUnit)

    // 创建模拟事件
    const mockEvent = new ActionEvent(
        mockEffectUnit.key,
        source,
        medium,
        target,
        {},
        [mockEffectUnit],
        []
    )

    // 标记为模拟模式
    mockEvent.simulate = true

    // 创建模拟效果对象
    const mockEffect = createEffectByUnit(mockEvent, mockEffectUnit)

    // 触发 before 触发器（触发器可以修改 mockEffect.params）
    simulateTriggers(mockEffect, "before", 0)

    // 触发 after 触发器
    simulateTriggers(mockEffect, "after", 0)

    // 返回修改后的 effectUnit
    return {
        ...mockEffectUnit,
        params: mockEffect.params  // 返回触发器修改后的参数
    }
}

/**
 * 模拟完整事件的执行
 *
 * 创建一个模拟的 ActionEvent，触发所有相关触发器，但不执行效果
 *
 * @param key 事件 key
 * @param source 事件来源
 * @param medium 事件媒介
 * @param target 事件目标
 * @param effectUnits 效果单元列表
 * @returns 修改后的效果单元列表
 */
export function simulateEvent(
    key: string,
    source: EventParticipant,
    medium: EventParticipant,
    target: EventParticipant | EventParticipant[],
    effectUnits: EffectUnit[]
): EffectUnit[] {
    // 深拷贝所有 effectUnits
    const mockEffectUnits = cloneDeep(effectUnits)

    // 创建模拟事件
    const mockEvent = new ActionEvent(
        key,
        source,
        medium,
        target,
        {},
        mockEffectUnits,
        []
    )

    // 标记为模拟模式
    mockEvent.simulate = true

    // 触发事件级别的 before 触发器
    simulateEventTriggers(mockEvent, "before", 0)

    // 触发每个效果的触发器
    for (const effect of mockEvent.effects) {
        simulateTriggers(effect, "before", 1)
        simulateTriggers(effect, "after", -1)
    }

    // 触发事件级别的 after 触发器
    simulateEventTriggers(mockEvent, "after", 0)

    // 返回修改后的 effectUnits
    return mockEvent.effects.map(effect => ({
        key: effect.key,
        params: effect.params,
        describe: effect.describe
    }))
}

/**
 * 模拟触发器执行（效果级别）
 *
 * 触发与效果相关的触发器，但不执行效果函数
 */
function simulateTriggers(
    effect: Effect,
    when: "before" | "after",
    triggerLevel: number
) {
    const event = effect.actionEvent

    // 检查是否为模拟模式
    if (!event.simulate) {
        console.warn("[SimulateEvent] 尝试在非模拟事件上调用 simulateTriggers")
        return
    }

    // 触发 source 的触发器
    if (isEntity(event.source)) {
        event.source.makeEvent(when, effect.key, event, effect, triggerLevel)
    }

    // 触发 medium 的触发器
    if (isEntity(event.medium)) {
        event.medium.viaEvent(when, effect.key, event, effect, triggerLevel)
    }

    // 触发 target 的触发器
    const targets = Array.isArray(event.target) ? event.target : [event.target]
    for (const t of targets) {
        if (isEntity(t)) {
            t.takeEvent(when, effect.key, event, effect, triggerLevel)
        }
    }
}

/**
 * 模拟触发器执行（事件级别）
 *
 * 触发与事件相关的触发器
 */
function simulateEventTriggers(
    event: ActionEvent,
    when: "before" | "after",
    triggerLevel: number
) {
    // 检查是否为模拟模式
    if (!event.simulate) {
        console.warn("[SimulateEvent] 尝试在非模拟事件上调用 simulateEventTriggers")
        return
    }

    // 触发 source 的触发器
    if (isEntity(event.source)) {
        event.source.makeEvent(when, event.key, event, null, triggerLevel)
    }

    // 触发 medium 的触发器
    if (isEntity(event.medium)) {
        event.medium.viaEvent(when, event.key, event, null, triggerLevel)
    }

    // 触发 target 的触发器
    const targets = Array.isArray(event.target) ? event.target : [event.target]
    for (const t of targets) {
        if (isEntity(t)) {
            t.takeEvent(when, event.key, event, null, triggerLevel)
        }
    }
}

/**
 * 检查事件是否为模拟模式
 *
 * 触发器可以使用此方法判断是否应该执行副作用
 */
export function isSimulateMode(event: ActionEvent): boolean {
    return event.simulate
}

/**
 * 便捷方法：模拟伤害效果
 *
 * 用于意图系统计算受 Buff 影响后的伤害
 */
export function simulateDamage(
    baseDamage: number,
    source: Entity,
    target: Entity
): number {
    const result = simulateEffect(
        {
            key: "damage",
            params: { value: baseDamage }
        },
        source,
        source,  // medium 通常是卡牌，这里简化为 source
        target
    )

    return result.params.value as number
}

/**
 * 便捷方法：模拟格挡效果
 *
 * 用于意图系统计算受 Buff 影响后的格挡
 */
export function simulateBlock(
    baseBlock: number,
    source: Entity,
    target: Entity
): number {
    const result = simulateEffect(
        {
            key: "block",
            params: { value: baseBlock }
        },
        source,
        source,
        target
    )

    return result.params.value as number
}
