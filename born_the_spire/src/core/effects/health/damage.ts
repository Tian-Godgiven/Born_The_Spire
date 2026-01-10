import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent";
import { changeCurrentValue, getCurrentValue } from "@/core/objects/system/Current/current";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { Effect } from "@/core/objects/system/effect/Effect";
import { isEntity, isEffect } from "@/core/utils/typeGuards";
import { newError } from "@/ui/hooks/global/alert";

//对单个目标造成伤害
export const damageTo:EffectFunc = (event:ActionEvent,effect)=>{
    const value = Number(effect.params.value)
    const {target} = event
    handleEventEntity(target,(t)=>{
        // 伤害只能作用于实体对象
        if (!isEntity(t)) {
            newError(["伤害效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }
        const oldValue = getCurrentValue(t,"health",0)
        changeCurrentValue(t,"health",oldValue-value,event)
    })
    return true
}

//使得某个伤害事件的值减少
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

    // 验证是 damage 效果
    if (target.key !== "damage") {
        newError(["reduceDamageFor 只能作用于 damage 效果，当前效果:", target.key])
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
 */
export const modifyDamageValue: EffectFunc = (event, effect) => {
    const delta = Number(effect.params.delta)
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

    // 验证是 damage 效果
    if (target.key !== "damage") {
        newError(["modifyDamageValue 只能作用于 damage 效果，当前效果:", target.key])
        return false
    }

    // 修改伤害值
    const oldValue = Number(target.params.value)
    const newValue = Math.max(0, oldValue + delta)  // 伤害不能为负
    target.params.value = newValue

    return true
}

/**
 * 按百分比修改伤害效果的值
 *
 * params:
 * - percent: number - 百分比（0.25 表示增加25%，-0.25 表示减少25%）
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

    // 验证是 damage 效果
    if (target.key !== "damage") {
        newError(["modifyDamageByPercent 只能作用于 damage 效果，当前效果:", target.key])
        return false
    }

    // 按百分比修改伤害值
    const oldValue = Number(target.params.value)
    const delta = Math.round(oldValue * percent)  // 四舍五入
    const newValue = Math.max(0, oldValue + delta)  // 伤害不能为负
    target.params.value = newValue

    return true
}
