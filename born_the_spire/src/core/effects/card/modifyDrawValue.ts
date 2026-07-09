import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isEffect } from "@/core/utils/typeGuards"
import { newError } from "@/ui/hooks/global/alert"

/**
 * 修改 drawFromDrawPile 效果的抽牌数
 *
 * params:
 * - delta: number - 变化量（正数增加，负数减少）
 *
 * 用于 reaction 系统：event.target 是 drawFromDrawPile Effect
 * 通过 targetType: "triggerEffect" 传入
 */
export const modifyDrawValue: EffectFunc = (event, effect) => {
    const delta = Number(effect.params.delta)
    const target = event.target

    if (Array.isArray(target)) {
        newError(["modifyDrawValue 效果不支持多目标", target])
        return false
    }

    if (!isEffect(target)) {
        newError(["modifyDrawValue 的目标必须是 Effect 类型，当前类型:", target.participantType])
        return false
    }

    if (target.key !== "drawFromDrawPile") {
        newError(["modifyDrawValue 只能作用于 drawFromDrawPile 效果，当前效果:", target.key])
        return false
    }

    const currentValue = target.params.value
    if (typeof currentValue === 'object' && currentValue !== null && 'fromStatus' in currentValue) {
        target.params._addValue = (Number(target.params._addValue) || 0) + delta
    } else {
        target.params.value = Math.max(0, Number(currentValue) + delta)
    }

    return true
}
