import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent";
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { isEntity } from "@/core/utils/typeGuards";
import { newError } from "@/ui/hooks/global/alert";
import { getCurrentValue, changeCurrentValue } from "@/core/objects/system/Current/current";

//对单个目标进行治疗
// params:
//   value: 固定回血量
//   percent: 按目标 max-health 的百分比回血（例如 0.1 = 回 10% max），Math.floor 取整
//            传了 percent 时以 percent 结果为准，忽略 value
export const healTo:EffectFunc = (event:ActionEvent,effect)=>{
    const { value = 0, percent } = effect.params
    const {target} = event
    const percentProvided = percent !== undefined && percent !== null
    handleEventEntity(target,(t)=>{
        // 治疗只能作用于实体对象
        if (!isEntity(t)) {
            newError(["治疗效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }
        let healAmount: number
        if (percentProvided) {
            const maxHealth = Number((t as any).status?.["max-health"]?.value ?? 0)
            healAmount = Math.floor(maxHealth * Number(percent))
        } else {
            healAmount = Number(value)
        }
        if (healAmount === 0) return
        const oldValue = getCurrentValue(t,"health",0)
        changeCurrentValue(t,"health",oldValue + healAmount,event)  // Current系统会自动处理最大值限制
    })
    return true
}

