/**
 * 获得护甲效果
 */

import type { EffectFunc } from "@/core/objects/system/effect/Effect"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { Target } from "@/core/objects/target/Target"
import { isEffect } from "@/core/utils/typeGuards"
import { newError } from "@/ui/hooks/global/alert"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 获得护甲
 * @param effect.params.value - 获得的护甲值
 */
export const gainArmor: EffectFunc = (event, effect) => {
    const amount = Number(effect.params.value ?? 0)

    if (amount <= 0) {
        return
    }

    handleEventEntity(event.target, (target) => {
        const t = target as Target

        // 增加护甲值
        if (!t.current.armor) {
            console.warn(`[gainArmor] ${t.label} 没有护甲机制`)
            return
        }

        t.current.armor.value += amount

        // 记录日志
        newLog([`${t.label} 获得了 ${amount} 点护甲`])
    })
}

/**
 * 修改护甲效果的值
 *
 * params:
 * - delta: number - 变化量（正数增加，负数减少）
 *
 * 用于 reaction 系统：event.target 是 gainArmor Effect
 */
export const modifyArmorValue: EffectFunc = (event, effect) => {
    const delta = Number(effect.params.delta)
    const target = event.target

    if (Array.isArray(target)) {
        newError(["modifyArmorValue 效果不支持多目标", target])
        return false
    }

    if (!isEffect(target)) {
        newError(["modifyArmorValue 的目标必须是 Effect 类型，当前类型:", target.participantType])
        return false
    }

    if (target.key !== "gainArmor") {
        newError(["modifyArmorValue 只能作用于 gainArmor 效果，当前效果:", target.key])
        return false
    }

    const oldValue = Number(target.params.value)
    const newValue = Math.max(0, oldValue + delta)
    target.params.value = newValue

    return true
}
