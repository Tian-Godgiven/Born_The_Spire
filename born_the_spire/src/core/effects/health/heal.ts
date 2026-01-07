import { handleEventEntity } from "@/core/objects/system/ActionEvent";
import { doEffectFunc, EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { isEntity } from "@/core/utils/typeGuards";
import { newError } from "@/ui/hooks/global/alert";

export const healTo:EffectFunc = (event,effect)=>{
    const value = effect.params.value
    const {source,target,medium} = event
    //修改生命值+value 未完成
    handleEventEntity(target,(t)=>{
        // 治疗只能作用于实体对象
        if (!isEntity(t)) {
            newError(["治疗效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }
        // const value = t.getStatusValue("health")
        // changeStatusValue(source,medium,target,"health",value+=,"now")
    })

}