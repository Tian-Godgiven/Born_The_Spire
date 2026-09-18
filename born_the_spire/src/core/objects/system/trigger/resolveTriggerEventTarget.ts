import type { ActionEvent } from "../ActionEvent"
import type { Effect } from "../effect/Effect"
import type { Entity } from "../Entity"
import type { Item } from "../../item/Item"
import type { EventParticipant } from "@/core/types/event/EventParticipant"
import type { TargetTypeString, TargetContext } from "@/core/types/TargetSpec"
import { resolveTargetOptional } from "@/core/types/TargetSpec"
import { nowBattle } from "@/core/objects/game/battle"

/**
 * 解析触发器事件目标
 *
 * 将 triggerEvent/triggerEffect/item/owner 组合成 TargetContext，
 * 再通过统一的 resolveTarget 函数解析 targetType。
 *
 * @param targetType - 目标类型键名
 * @param triggerEvent - 触发该 reaction 的原始事件
 * @param triggerEffect - 触发效果对象（可能为 null）
 * @param item - 物品自身（器官/遗物）
 * @param owner - 物品持有者（玩家/敌人）
 * @param options.bindings - 同一次 reaction 数组共用的 context（pickedTargets / as 绑定）
 * @returns 解析后的目标（Entity 或 Entity[]），找不到返回 null
 */
export function resolveTriggerEventTarget(
    targetType: TargetTypeString | Entity,
    triggerEvent: ActionEvent,
    triggerEffect: Effect | null,
    item: Item | EventParticipant,
    owner: Entity,
    options?: {
        allowNull?: boolean
        bindings?: TargetContext
        triggerCreator?: EventParticipant
        triggerHost?: Entity
    }
): Entity | Entity[] | null {
    // 如果 targetType 直接就是一个 Entity，直接返回
    if (targetType && typeof targetType === "object" && (targetType as any).participantType) {
        return targetType as Entity
    }

    const battle = nowBattle.value
    const bindings = options?.bindings
    const pickedTargets = bindings?.pickedTargets ?? []
    if (bindings) bindings.pickedTargets = pickedTargets

    const context: TargetContext = {
        ...(bindings ?? {}),
        item: item as Entity,
        declarationObject: options?.triggerCreator ?? item,
        declarationOwner: owner,
        source: triggerEvent.source as Entity,
        target: triggerEvent.target as Entity | Entity[],
        event: triggerEvent,
        triggerCreator: options?.triggerCreator ?? item,
        creatorOwner: owner,
        triggerHost: options?.triggerHost ?? owner,
        triggerEffect: triggerEffect ?? undefined,
        eventTriggerCreator: (triggerEvent as any).triggerContext?.creator,
        eventTriggerHost: (triggerEvent as any).triggerContext?.host,
        battle: battle ?? undefined,
        pickedTargets,
    }

    const result = resolveTargetOptional(targetType as string, context)

    if (result === null && !(options?.allowNull)) {
        console.warn(`[resolveTriggerEventTarget] 无法解析 targetType: "${targetType}"`)
    }

    return result
}
