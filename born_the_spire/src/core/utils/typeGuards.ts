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
export function isEntity(participant: EventParticipant | any): participant is Entity {
    if (Array.isArray(participant)) {
        return participant.every(p => p?.participantType === 'entity')
    }
    const result = participant?.participantType === 'entity'
    // 调试日志：记录participantType不是'entity'的对象
    if (!result && participant && participant.participantType) {
        // 只记录一次，避免刷屏
        console.warn('[isEntity] participantType 不是 entity:', {
            participantType: participant.participantType,
            label: participant.label,
            key: participant.key
        })
    }
    return result
}

/**
 * 检查对象是否为 State 类型
 */
export function isState(participant: EventParticipant | null | undefined): participant is State {
    return participant?.participantType === 'state'
}

/**
 * 检查对象是否为 Effect 类型
 */
export function isEffect(participant: EventParticipant | null | undefined): participant is Effect {
    return participant?.participantType === 'effect'
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
export function isCard(participant: EventParticipant | EventParticipant[]): participant is Card {
    if (Array.isArray(participant)) {
        return participant.every(p => isEntity(p) && (p as any).itemType === 'card')
    }
    if (!isEntity(participant)) return false
    return 'itemType' in participant && (participant as any).itemType === 'card'
}

/**
 * 检查对象是否为 Status 类型
 * 使用类型标识而不是 instanceof 以避免循环依赖
 */
export function isStatus(obj: any): obj is Status {
    if (Array.isArray(obj)) {
        return obj.every(o => o && typeof o === 'object' && o.statusType === 'status')
    }
    return obj && typeof obj === 'object' && obj.statusType === 'status'
}

/**
 * 检查对象是否为 Player 类型
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 */
export function isPlayer(participant: EventParticipant | EventParticipant[]): participant is Player {
    if (Array.isArray(participant)) {
        return participant.every(p => isEntity(p) && (p as any).targetType === 'player')
    }
    if (!isEntity(participant)) return false
    return 'targetType' in participant && (participant as any).targetType === 'player'
}

/**
 * 获取所有 Player 类型的对象
 * 返回满足 Player 类型的对象数组
 */
export function getPlayers(participants: EventParticipant | EventParticipant[]): Player[] {
    const arr = Array.isArray(participants) ? participants : [participants]
    return arr.filter(p => isEntity(p) && (p as any).targetType === 'player') as Player[]
}

/**
 * 检查对象是否为 Enemy 类型
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 */
export function isEnemy(participant: EventParticipant | EventParticipant[]): participant is Enemy {
    if (Array.isArray(participant)) {
        return participant.every(p => isEntity(p) && (p as any).targetType === 'enemy')
    }
    if (!isEntity(participant)) return false
    return 'targetType' in participant && (participant as any).targetType === 'enemy'
}

/**
 * 获取所有 Enemy 类型的对象
 * 返回满足 Enemy 类型的对象数组
 */
export function getEnemies(participants: EventParticipant | EventParticipant[]): Enemy[] {
    const arr = Array.isArray(participants) ? participants : [participants]
    return arr.filter(p => isEntity(p) && (p as any).targetType === 'enemy') as Enemy[]
}

/**
 * 检查对象是否为 Organ 类型
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 */
export function isOrgan(participant: EventParticipant | EventParticipant[]): participant is Organ {
    if (Array.isArray(participant)) {
        return participant.every(p => isEntity(p) && (p as any).targetType === 'organ')
    }
    if (!isEntity(participant)) return false
    return 'targetType' in participant && (participant as any).targetType === 'organ'
}

/**
 * 获取所有 Organ 类型的对象
 * 返回满足 Organ 类型的对象数组
 */
export function getOrgans(participants: EventParticipant | EventParticipant[]): Organ[] {
    const arr = Array.isArray(participants) ? participants : [participants]
    return arr.filter(p => isEntity(p) && (p as any).targetType === 'organ') as Organ[]
}

/**
 * 检查对象是否为 Chara 类型（Player 或 Enemy）
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 */
export function isChara(participant: EventParticipant | EventParticipant[]): participant is Player | Enemy {
    if (Array.isArray(participant)) {
        return participant.every(p => isEntity(p) && ((p as any).targetType === 'player' || (p as any).targetType === 'enemy'))
    }
    if (!isEntity(participant)) return false
    const targetType = (participant as any).targetType
    return targetType === 'player' || targetType === 'enemy'
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
