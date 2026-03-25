import { ActionEvent } from "@/core/objects/system/ActionEvent"
import { Effect } from "@/core/objects/system/effect/Effect"
import { Entity } from "@/core/objects/system/Entity"
import {
    addCharges,
    reduceCooldown,
    setToggleState,
    resetAbilityUses
} from "@/core/hooks/activeAbility"

/**
 * 主动能力相关的效果函数
 */

/**
 * 为能力添加充能
 */
export function addAbilityChargesEffect(event: ActionEvent, effect: Effect) {
    const abilityKey = String(effect.params.abilityKey)
    const amount = Number(effect.params.amount ?? 1)
    const targets = Array.isArray(event.target) ? event.target : [event.target]

    if (!abilityKey) {
        console.error("[addAbilityChargesEffect] 缺少 abilityKey 参数")
        return
    }

    for (const target of targets) {
        if (target instanceof Entity) {
            addCharges(target, abilityKey, amount)
        }
    }
}

/**
 * 减少能力冷却时间
 */
export function reduceAbilityCooldownEffect(event: ActionEvent, effect: Effect) {
    const abilityKey = String(effect.params.abilityKey)
    const amount = Number(effect.params.amount ?? 1)
    const targets = Array.isArray(event.target) ? event.target : [event.target]

    if (!abilityKey) {
        console.error("[reduceAbilityCooldownEffect] 缺少 abilityKey 参数")
        return
    }

    for (const target of targets) {
        if (target instanceof Entity) {
            reduceCooldown(target, abilityKey, amount)
        }
    }
}

/**
 * 设置开关型能力状态
 */
export function setAbilityToggleEffect(event: ActionEvent, effect: Effect) {
    const abilityKey = String(effect.params.abilityKey)
    const active = Boolean(effect.params.active)
    const targets = Array.isArray(event.target) ? event.target : [event.target]

    if (!abilityKey || effect.params.active === undefined) {
        console.error("[setAbilityToggleEffect] 缺少 abilityKey 或 active 参数")
        return
    }

    for (const target of targets) {
        if (target instanceof Entity) {
            setToggleState(target, abilityKey, active)
        }
    }
}

/**
 * 重置能力使用次数
 */
export function resetAbilityUsesEffect(event: ActionEvent, effect: Effect) {
    const abilityKey = String(effect.params.abilityKey)
    const type = effect.params.type as "turn" | "battle" | "floor" | "total" | undefined
    const targets = Array.isArray(event.target) ? event.target : [event.target]

    if (!abilityKey) {
        console.error("[resetAbilityUsesEffect] 缺少 abilityKey 参数")
        return
    }

    for (const target of targets) {
        if (target instanceof Entity) {
            resetAbilityUses(target, abilityKey, type ?? "turn")
        }
    }
}

/**
 * 强制执行能力（忽略限制）
 */
export async function forceExecuteAbilityEffect(event: ActionEvent, effect: Effect) {
    const abilityKey = String(effect.params.abilityKey)
    const source = event.source

    if (!abilityKey || !source) {
        console.error("[forceExecuteAbilityEffect] 缺少 abilityKey 或 source")
        return
    }

    // 这里需要找到能力定义并执行
    // 由于需要访问具体的能力定义，这个效果可能需要在具体的物品上下文中实现

    // 暂时跳过具体实现，因为需要更多上下文信息
}

/**
 * 启用/禁用能力
 */
export function setAbilityEnabledEffect(event: ActionEvent, effect: Effect) {
    const abilityKey = String(effect.params.abilityKey)
    const enabled = Boolean(effect.params.enabled ?? true)
    const targets = Array.isArray(event.target) ? event.target : [event.target]

    if (!abilityKey) {
        console.error("[setAbilityEnabledEffect] 缺少 abilityKey 参数")
        return
    }

    // 这个效果需要在实体上存储禁用的能力列表
    // 暂时使用简单的实现
    for (const target of targets) {
        if (target instanceof Entity) {
            // 在实体上存储禁用能力的信息
            if (!target.disabledAbilities) {
                target.disabledAbilities = new Set<string>()
            }

            if (enabled) {
                target.disabledAbilities.delete(abilityKey)
            } else {
                target.disabledAbilities.add(abilityKey)
            }
        }
    }
}

/**
 * 修改能力的消耗
 */
export function modifyAbilityCostEffect(event: ActionEvent, effect: Effect) {
    const abilityKey = String(effect.params.abilityKey)
    const costType = String(effect.params.costType)
    const modifier = Number(effect.params.modifier)
    const targets = Array.isArray(event.target) ? event.target : [event.target]

    if (!abilityKey || !costType || modifier === undefined) {
        console.error("[modifyAbilityCostEffect] 缺少必要参数")
        return
    }

    // 这个效果需要在实体上存储能力消耗修改器
    // 暂时使用简单的实现
    for (const target of targets) {
        if (target instanceof Entity) {
            if (!target.abilityCostModifiers) {
                target.abilityCostModifiers = new Map()
            }

            const key = `${abilityKey}_${costType}`
            const currentModifier = target.abilityCostModifiers.get(key) || 0
            target.abilityCostModifiers.set(key, currentModifier + modifier)
        }
    }
}

/**
 * 复制能力使用次数
 */
export function copyAbilityUsesEffect(event: ActionEvent, effect: Effect) {
    const fromAbilityKey = String(effect.params.fromAbilityKey)
    const toAbilityKey = String(effect.params.toAbilityKey)
    const targets = Array.isArray(event.target) ? event.target : [event.target]

    if (!fromAbilityKey || !toAbilityKey) {
        console.error("[copyAbilityUsesEffect] 缺少 fromAbilityKey 或 toAbilityKey 参数")
        return
    }

    for (const target of targets) {
        if (target instanceof Entity) {
            // 这里需要访问 usageTracker 来复制使用状态
            // 暂时跳过具体实现
        }
    }
}