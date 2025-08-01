import { ActionEvent } from "@/objects/system/ActionEvent";
import { changeStatusValue, getStatusValue } from "@/objects/system/Status";

export function damageTo(event:ActionEvent,value:number){
    const {source,target,medium} = event
    const newValue = getStatusValue(target,"health","now") - value;
    changeStatusValue(source,medium,target,"health",newValue,"now")
}

//使得某个伤害事件的值减少
export function reduceDamageFor(damageEvent:ActionEvent,value:number){
    //使得触发其的伤害效果减少本效果的值
    if(damageEvent.effect)
    damageEvent.effect.value.now -= value
}
