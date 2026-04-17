import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent";
import { changeCurrentValue, getCurrentValue } from "@/core/objects/system/Current/current";
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { isEntity } from "@/core/utils/typeGuards";
import { newError } from "@/ui/hooks/global/alert";

/**
 * 直接失去生命（绕过伤害流水线）
 * 不会被格挡、易伤、触发器等影响
 *
 * params:
 * - value: number - 失去的生命值
 */
export const loseHealthTo: EffectFunc = (event: ActionEvent, effect) => {
    const value = Number(effect.params.value)
    const { target } = event
    handleEventEntity(target, (t) => {
        if (!isEntity(t)) {
            newError(["失去生命效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }
        const oldValue = getCurrentValue(t, "health", 0)
        changeCurrentValue(t, "health", oldValue - value, event)
    })
    return true
}
