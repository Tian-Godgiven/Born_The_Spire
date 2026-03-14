/**
 * 事件参与者类型守卫工具函数
 *
 * 这些函数用于在运行时检查对象的类型
 * 主要用于效果函数中验证事件参与者的类型
 */

import type { EventParticipant } from "@/core/types/event/EventParticipant"
import type { Entity } from "@/core/objects/system/Entity"
import type { State } from "@/core/objects/system/State"
import type { Effect } from "@/core/objects/system/effect/Effect"
import type { Card } from "@/core/objects/item/Subclass/Card"
import type { Status } from "@/core/objects/system/status/Status"
import type { Player } from "@/core/objects/target/Player"
import type { Enemy } from "@/core/objects/target/Enemy"
import type { Organ } from "@/core/objects/target/Organ"

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

/**
 * 检查对象是否为 Status 类型
 * 使用类型标识而不是 instanceof 以避免循环依赖
 */
export function isStatus(obj: any): obj is Status {
    return obj && typeof obj === 'object' && obj.statusType === 'status'
}

/**
 * 检查对象是否为 Player 类型
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 */
export function isPlayer(participant: EventParticipant): participant is Player {
    if (!isEntity(participant)) return false
    return 'targetType' in participant && (participant as any).targetType === 'player'
}

/**
 * 检查对象是否为 Enemy 类型
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 */
export function isEnemy(participant: EventParticipant): participant is Enemy {
    if (!isEntity(participant)) return false
    return 'targetType' in participant && (participant as any).targetType === 'enemy'
}

/**
 * 检查对象是否为 Organ 类型
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 */
export function isOrgan(participant: EventParticipant): participant is Organ {
    if (!isEntity(participant)) return false
    return 'targetType' in participant && (participant as any).targetType === 'organ'
}

/**
 * 断言对象为 Player 类型，否则抛出错误
 */
export function assertPlayer(participant: EventParticipant, context: string = ""): asserts participant is Player {
    if (!isPlayer(participant)) {
        throw new Error(`${context}: 期望 Player 类型，实际为 ${(participant as any).targetType || participant.participantType}`)
    }
}

/**
 * 断言对象为 Enemy 类型，否则抛出错误
 */
export function assertEnemy(participant: EventParticipant, context: string = ""): asserts participant is Enemy {
    if (!isEnemy(participant)) {
        throw new Error(`${context}: 期望 Enemy 类型，实际为 ${(participant as any).targetType || participant.participantType}`)
    }
}

/**
 * 检查并断言 owner 是 Card 且 ownersOwner 是 Player
 * 返回元组 [boolean, Card?, Player?]，成功时返回断言后的值
 */
export function assertCardAndPlayer(
    owner: Entity,
    ownersOwner: Entity | undefined
): [true, Card, Player] | [false, null, null] {
    if (!isCard(owner)) {
        return [false, null, null]
    }
    if (ownersOwner && !isPlayer(ownersOwner)) {
        return [false, null, null]
    }
    // ownersOwner 为 undefined 时也返回 false，因为需要 Player
    if (!ownersOwner) {
        return [false, null, null]
    }
    return [true, owner, ownersOwner]
}
