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
 * 类型检查模式
 * - 'all': 所有元素都满足类型（默认）
 * - 'any': 至少一个元素满足类型，并返回所有满足类型的对象
 */
export type TypeGuardMode = 'all' | 'any'

/**
 * 检查对象是否为 Entity 类型
 */
export function isEntity(participant: EventParticipant | any, mode: TypeGuardMode = 'all'): participant is Entity {
    if (Array.isArray(participant)) {
        if (mode === 'all') {
            return participant.every(p => p?.participantType === 'entity')
        }
        // 'any' mode - 返回所有匹配的对象（通过类型断言）
        return (participant as any).some((p: any) => p?.participantType === 'entity')
    }
    return participant?.participantType === 'entity'
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
export function isCard(participant: EventParticipant, mode: TypeGuardMode = 'all'): participant is Card {
    if (Array.isArray(participant)) {
        if (mode === 'all') {
            return participant.every(p => isEntity(p) && (p as any).itemType === 'card')
        }
        return (participant as any).some((p: any) => isEntity(p) && (p as any).itemType === 'card')
    }
    if (!isEntity(participant)) return false
    return 'itemType' in participant && (participant as any).itemType === 'card'
}

/**
 * 检查对象是否为 Status 类型
 * 使用类型标识而不是 instanceof 以避免循环依赖
 */
export function isStatus(obj: any, mode: TypeGuardMode = 'all'): obj is Status {
    if (Array.isArray(obj)) {
        if (mode === 'all') {
            return obj.every(o => o && typeof o === 'object' && o.statusType === 'status')
        }
        return obj.some(o => o && typeof o === 'object' && o.statusType === 'status')
    }
    return obj && typeof obj === 'object' && obj.statusType === 'status'
}

/**
 * 检查对象是否为 Player 类型
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 * - mode='all'（默认）：所有元素均为 Player 时返回 true
 * - mode='any'：返回所有满足 Player 类型的对象数组，若无则返回 null
 */
export function isPlayer(participant: EventParticipant, mode?: 'all'): participant is Player
export function isPlayer(participant: EventParticipant | EventParticipant[], mode: 'any'): Player[] | null
export function isPlayer(participant: EventParticipant | EventParticipant[], mode: TypeGuardMode = 'all'): participant is Player | Player[] | null {
    if (mode === 'any') {
        const arr = Array.isArray(participant) ? participant : [participant]
        const matched = arr.filter(p => isEntity(p) && (p as any).targetType === 'player') as Player[]
        return matched.length > 0 ? matched : null
    }
    if (Array.isArray(participant)) {
        return participant.every(p => isEntity(p) && (p as any).targetType === 'player')
    }
    if (!isEntity(participant)) return false
    return 'targetType' in participant && (participant as any).targetType === 'player'
}

/**
 * 检查对象是否为 Enemy 类型
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 * - mode='all'（默认）：所有元素均为 Enemy 时返回 true
 * - mode='any'：返回所有满足 Enemy 类型的对象数组，若无则返回 null
 */
export function isEnemy(participant: EventParticipant, mode?: 'all'): participant is Enemy
export function isEnemy(participant: EventParticipant | EventParticipant[], mode: 'any'): Enemy[] | null
export function isEnemy(participant: EventParticipant | EventParticipant[], mode: TypeGuardMode = 'all'): participant is Enemy | Enemy[] | null {
    if (mode === 'any') {
        const arr = Array.isArray(participant) ? participant : [participant]
        const matched = arr.filter(p => isEntity(p) && (p as any).targetType === 'enemy') as Enemy[]
        return matched.length > 0 ? matched : null
    }
    if (Array.isArray(participant)) {
        return participant.every(p => isEntity(p) && (p as any).targetType === 'enemy')
    }
    if (!isEntity(participant)) return false
    return 'targetType' in participant && (participant as any).targetType === 'enemy'
}

/**
 * 检查对象是否为 Organ 类型
 * 使用 targetType 标识而不是 instanceof 以避免循环依赖
 * - mode='all'（默认）：所有元素均为 Organ 时返回 true
 * - mode='any'：返回所有满足 Organ 类型的对象数组，若无则返回 null
 */
export function isOrgan(participant: EventParticipant, mode?: 'all'): participant is Organ
export function isOrgan(participant: EventParticipant | EventParticipant[], mode: 'any'): Organ[] | null
export function isOrgan(participant: EventParticipant | EventParticipant[], mode: TypeGuardMode = 'all'): participant is Organ | Organ[] | null {
    if (mode === 'any') {
        const arr = Array.isArray(participant) ? participant : [participant]
        const matched = arr.filter(p => isEntity(p) && (p as any).targetType === 'organ') as Organ[]
        return matched.length > 0 ? matched : null
    }
    if (Array.isArray(participant)) {
        return participant.every(p => isEntity(p) && (p as any).targetType === 'organ')
    }
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
