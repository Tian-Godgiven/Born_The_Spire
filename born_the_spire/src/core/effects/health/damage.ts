import { ActionEvent, doEvent, handleEventEntity } from "@/core/objects/system/ActionEvent";
import { changeCurrentValue, getCurrentValue } from "@/core/objects/system/Current/current";
import type { Effect } from "@/core/objects/system/effect/Effect";
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import type { EventParticipant } from "@/core/types/event/EventParticipant";
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier";
import { isEntity, isEffect } from "@/core/utils/typeGuards";
import { newError } from "@/ui/hooks/global/alert";

/** 扣血但仍走受伤流水线：attack 挨打，damage 中毒等非攻击受伤 */
export function isHurtEffectKey(key: string): boolean {
    return key === "damage" || key === "attack"
}

/**
 * 把一次 attack/damage 置零，并打上抵消标记。
 * 数据里用 `nullifyDamageValue`；自定义 EffectFunc 里调这个，不要直接写 params.value = 0。
 */
export function nullifyHurtEffect(hurtEffect: Effect): void {
    const prev = Number(hurtEffect.params.value) || 0
    hurtEffect.params.value = 0
    if (prev > 0) hurtEffect.nullified = true
}

/**
 * 仅抵消多目标 attack/damage 对某个目标的伤害。
 * Effect 的数值在所有目标间共享，因此不能直接把 params.value 置零。
 */
export function nullifyHurtEffectForTarget(hurtEffect: Effect, target: EventParticipant): void {
    hurtEffect.ignoredHurtTargets.add(target)
}

//对单个目标造成伤害
export const damageTo:EffectFunc = (event:ActionEvent,effect)=>{
    const baseValue = Number(effect.params.value)
    const multiplier = effect.params.multiplier !== undefined ? Number(effect.params.multiplier) : 1
    const value = baseValue * multiplier
    if (!Number.isFinite(value)) {
        newError(["伤害效果的 value 或 multiplier 必须是有限数字", effect.params])
        return false
    }
    const {target} = event
    handleEventEntity(target,(t)=>{
        // 伤害只能作用于实体对象
        if (!isEntity(t)) {
            newError(["伤害效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }
        if (effect.ignoredHurtTargets.has(t)) return
        const oldValue = getCurrentValue(t,"health",0)
        changeCurrentValue(t,"health",oldValue-value,event)
    })
    return true
}

//使得某个伤害事件的值减少
// 用于 reaction 系统：event.target 是 damage Effect
export const reduceDamageFor:EffectFunc = (event,effect)=>{
    const value = Number(effect.params.value)
    const target = event.target


    // 验证 target 是 Effect 类型
    if (Array.isArray(target)) {
        newError(["reduceDamageFor 效果不支持多目标", target])
        return false
    }

    if (!isEffect(target)) {
        newError(["reduceDamageFor 的目标必须是 Effect 类型，当前类型:", target.participantType])
        return false
    }

    if (!isHurtEffectKey(target.key)) {
        newError(["reduceDamageFor 只能作用于 attack/damage 效果，当前效果:", target.key])
        return false
    }

    // 减少伤害值
    const oldValue = Number(target.params.value)
    const newValue = Math.max(0, oldValue - value)  // 伤害不能为负
    target.params.value = newValue

    return true
}

/**
 * 修改伤害效果的值
 *
 * params:
 * - delta: number - 变化量（正数增加，负数减少）
 * - multiplier: number - 乘在 delta 上，缺省 1。实际加值 = delta × multiplier
 *
 * 用于 reaction 系统：event.target 是 damage Effect
 */
export const modifyDamageValue: EffectFunc = (event, effect) => {
    const delta = Number(effect.params.delta)
    const multiplier = effect.params.multiplier !== undefined ? Number(effect.params.multiplier) : 1
    const applied = delta * multiplier
    const target = event.target

    // 验证 target 是 Effect 类型
    if (Array.isArray(target)) {
        newError(["modifyDamageValue 效果不支持多目标", target])
        return false
    }

    if (!isEffect(target)) {
        newError(["modifyDamageValue 的目标必须是 Effect 类型，当前类型:", target.participantType])
        return false
    }

    if (!isHurtEffectKey(target.key)) {
        newError(["modifyDamageValue 只能作用于 attack/damage 效果，当前效果:", target.key])
        return false
    }

    // 修改伤害值
    const oldValue = Number(target.params.value)
    const newValue = Math.max(0, oldValue + applied)  // 伤害不能为负
    target.params.value = newValue

    return true
}

/**
 * 将伤害效果的值置零（全免疫）
 *
 * 无 params。用于 reaction 系统：event.target 是 damage Effect
 */
export const nullifyDamageValue: EffectFunc = (event, effect) => {
    const target = event.target

    if (Array.isArray(target)) {
        newError(["nullifyDamageValue 效果不支持多目标", target])
        return false
    }

    if (!isEffect(target)) {
        newError(["nullifyDamageValue 的目标必须是 Effect 类型，当前类型:", target.participantType])
        return false
    }

    if (!isHurtEffectKey(target.key)) {
        newError(["nullifyDamageValue 只能作用于 attack/damage 效果，当前效果:", target.key])
        return false
    }

    nullifyHurtEffect(target)

    return true
}

/**
 * 按百分比修改伤害效果的值
 *
 * params:
 * - percent: number - 百分比（0.25 表示增加25%，-0.25 表示减少25%）
 *
 * 用于 reaction 系统：event.target 是 damage Effect
 */
export const modifyDamageByPercent: EffectFunc = (event, effect) => {
    const percent = Number(effect.params.percent)
    const target = event.target

    // 验证 target 是 Effect 类型
    if (Array.isArray(target)) {
        newError(["modifyDamageByPercent 效果不支持多目标", target])
        return false
    }

    if (!isEffect(target)) {
        newError(["modifyDamageByPercent 的目标必须是 Effect 类型，当前类型:", target.participantType])
        return false
    }

    if (!isHurtEffectKey(target.key)) {
        newError(["modifyDamageByPercent 只能作用于 attack/damage 效果，当前效果:", target.key])
        return false
    }

    // 按百分比修改伤害值
    const oldValue = Number(target.params.value)
    const delta = Math.round(oldValue * percent)  // 四舍五入
    const newValue = Math.max(0, oldValue + delta)  // 伤害不能为负
    target.params.value = newValue

    return true
}

// 造成无视护甲的伤害：spawn 一个带 info.ignoreArmor 的 damage 子事件，
// 由 mechanismRegistry 的 armor absorb 触发器识别并跳过吸收
export const damageIgnoreArmor: EffectFunc = (event, effect) => {
    const value = Number(effect.params.value)
    doEvent({
        key: "damage",
        source: event.source,
        medium: event.medium,
        target: event.target,
        info: { ignoreArmor: true },
        effectUnits: [{ key: "damageTo", params: { value } }]
    })
    return true
}

// 致命保命：如果当前伤害会杀死目标，置零；并消耗器官身上的 lethalGuardReady 状态
// 挂在 on take attack/damage 触发器，target=triggerEffect；level 低于护甲 priority，在吸收之后再判定致命
// event.source 是器官（由 ItemModifier 的 reaction 上下文提供）
export const checkAndSaveLethal: EffectFunc = (event, effect) => {
    const target = event.target
    if (Array.isArray(target) || !isEffect(target) || !isHurtEffectKey(target.key)) {
        newError(["checkAndSaveLethal 目标必须是 attack/damage Effect"])
        return false
    }

    const damageActionEvent = target.actionEvent
    const damagedRaw = damageActionEvent?.target
    const damaged = Array.isArray(damagedRaw) ? damagedRaw[0] : damagedRaw
    if (!isEntity(damaged)) return false

    const damageValue = Number(target.params.value)
    const currentHealth = Number(damaged.current?.health?.value ?? 0)

    // 非致命：不处理
    if (damageValue < currentHealth) return true

    // 致命：置零 + 消耗器官充能
    nullifyHurtEffect(target)
    const organ = event.source
    if (isEntity(organ)) {
        const stateModifier = getStateModifier(organ as any)
        stateModifier.removeState("lethalGuardReady", false)
    }
    return true
}
