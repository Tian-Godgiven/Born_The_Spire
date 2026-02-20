/**
 * 事件参与者类型守卫工具函数
 *
 * 这些函数用于在运行时检查对象的类型
 * 主要用于效果函数中验证事件参与者的类型
 */

import { EventParticipant } from "@/core/types/event/EventParticipant"
import { Entity } from "@/core/objects/system/Entity"
import { State } from "@/core/objects/system/State"
import { Effect } from "@/core/objects/system/effect/Effect"
import type { Card } from "@/core/objects/item/Subclass/Card"  // type-only import 避免循环依赖

/**
 * 检查对象是否为 Entity 类型
 */
export function isEntity(participant: EventParticipant): participant is Entity {
    return participant.participantType === 'entity'
}

/**
 * 检查对象是否为 State 类型
 */
export function isState(participant: EventParticipant): participant is State {
    return participant.participantType === 'state'
}

/**
 * 检查对象是否为 Effect 类型
 */
export function isEffect(participant: EventParticipant): participant is Effect {
    return participant.participantType === 'effect'
}

/**
 * 断言对象为 Entity 类型，否则抛出错误
 */
export function assertEntity(participant: EventParticipant, context: string = ""): asserts participant is Entity {
    if (!isEntity(participant)) {
        throw new Error(`${context}: 期望 Entity 类型，实际为 ${participant.participantType}`)
    }
}

/**
 * 断言对象为 State 类型，否则抛出错误
 */
export function assertState(participant: EventParticipant, context: string = ""): asserts participant is State {
    if (!isState(participant)) {
        throw new Error(`${context}: 期望 State 类型，实际为 ${participant.participantType}`)
    }
}

/**
 * 断言对象为 Effect 类型，否则抛出错误
 */
export function assertEffect(participant: EventParticipant, context: string = ""): asserts participant is Effect {
    if (!isEffect(participant)) {
        throw new Error(`${context}: 期望 Effect 类型，实际为 ${participant.participantType}`)
    }
}

/**
 * 检查对象是否为 Card 类型
 * 使用类型标识而不是 instanceof 以避免循环依赖
 */
export function isCard(participant: EventParticipant): participant is Card {
    if (!isEntity(participant)) return false
    return 'itemType' in participant && (participant as any).itemType === 'card'
}
