import { handleEventEntity } from "@/core/objects/system/ActionEvent";
import { doEffectFunc, EffectFunc } from "@/core/objects/system/effect/EffectFunc";

export const healTo:EffectFunc = (event,effect)=>{
    const value = effect.params.value
    const {source,target,medium} = event
    //修改生命值+value 未完成
    handleEventEntity(target,(e)=>{
        // const value = e.getStatusValue("health")
        // changeStatusValue(source,medium,target,"health",value+=,"now")
    })
    
}