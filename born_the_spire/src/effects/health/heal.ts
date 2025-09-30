import { EffectFunc } from "@/objects/system/effect/EffectFunc";
import { changeStatusValue, getStatusValue } from "@/objects/system/Status";

export const healTo:EffectFunc = (event,effect)=>{
    const value = effect.params.value
    const {source,target,medium} = event
    //修改生命值+value
    const newValue = getStatusValue(target,"health","now") + value
    changeStatusValue(source,medium,target,"health",newValue,"now")
}