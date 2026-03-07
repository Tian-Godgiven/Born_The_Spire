import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { isEntity } from "@/core/utils/typeGuards";
import { newError } from "@/ui/hooks/global/alert";
import { getCurrentValue, changeCurrentValue } from "@/core/objects/system/Current/current";

//对单个目标进行治疗
export const healTo:EffectFunc = (event:ActionEvent,effect)=>{
    const value = Number(effect.params.value)
    const {target} = event
    handleEventEntity(target,(t)=>{
        // 治疗只能作用于实体对象
        if (!isEntity(t)) {
            newError(["治疗效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }
        const oldValue = getCurrentValue(t,"health",0)
        changeCurrentValue(t,"health",oldValue + value,event)  // Current系统会自动处理最大值限制
    })
    return true
}

/**
 * 增加最大生命值
 *
 * params:
 * - value: 增加的数值
 */
export const gainMaxHealth: EffectFunc = (event, effect) => {
    const value = Number(effect.params.value)
    const { target } = event

    handleEventEntity(target, (t) => {
        if (!isEntity(t)) {
            newError(["增加最大生命效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }

        // 使用 Status 对象的 addByJSON 方法增加最大生命
        const maxHealthStatus = t.status["maxHealth"]
        if (maxHealthStatus) {
            maxHealthStatus.addByJSON(event.source, {
                targetLayer: "base",
                modifierType: "additive",
                applyMode: "absolute",
                modifierValue: value
            })
        }

        // 同时回复等量生命
        const oldValue = getCurrentValue(t, "health", 0)
        changeCurrentValue(t, "health", oldValue + value, event)
    })

    return true
}