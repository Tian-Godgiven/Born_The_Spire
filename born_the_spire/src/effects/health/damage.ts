import { ActionEvent } from "@/objects/system/ActionEvent";
import { EffectFunc } from "@/objects/system/effect/EffectFunc";
import { changeStatusValue, getStatusValue } from "@/objects/system/Status";

//对目标造成伤害
export const damageTo:EffectFunc = (event:ActionEvent,effect)=>{
    const value = effect.params.value
    const {source,target,medium} = event
    const newValue = getStatusValue(target,"health","now") - value;
    changeStatusValue(source,medium,target,"health",newValue,"now")
}

//使得某个伤害事件的值减少
export const reduceDamageFor:EffectFunc = (event,effect)=>{
    const value = effect.params.value
    //使得触发其的伤害效果减少本效果的值
    if(event.effect)
    event.effect.params.value.now -= value
}


