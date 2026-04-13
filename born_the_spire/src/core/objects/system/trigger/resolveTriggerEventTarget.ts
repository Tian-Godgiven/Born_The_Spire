import type { ActionEvent } from "../ActionEvent"
import type { Effect } from "../effect/Effect"
import type { Entity } from "../Entity"
import type { Item } from "../../item/Item"
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
 * @param options - 额外选项
 * @returns 解析后的目标（Entity 或 Entity[]），找不到返回 null
 */
export function resolveTriggerEventTarget(
    targetType: TargetTypeString | Entity,
    triggerEvent: ActionEvent,
    triggerEffect: Effect | null,
    item: Item,
    owner: Entity,
    options?: { allowNull?: boolean }
): Entity | Entity[] | null {
    // 如果 targetType 直接就是一个 Entity，直接返回
    if (targetType && typeof targetType === "object" && (targetType as any).participantType) {
        return targetType as Entity
    }

    const battle = nowBattle.value

    const context: TargetContext = {
        item: item as Entity,
        owner,
        source: triggerEvent.source as Entity,
        target: triggerEvent.target as Entity | Entity[],
        event: triggerEvent,
        triggerSource: item as Entity,
        triggerOwner: owner,
        triggerEffect: triggerEffect ?? undefined,
        eventTriggerSource: (triggerEvent as any).triggerContext?.source,
        eventTriggerOwner: (triggerEvent as any).triggerContext?.owner,
        battle: battle ?? undefined,
    }

    const result = resolveTargetOptional(targetType as string, context)

    if (result === null && !(options?.allowNull)) {
        console.warn(`[resolveTriggerEventTarget] 无法解析 targetType: "${targetType}"`)
    }

    return result
}
