import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";

//对单个目标造成伤害
export const damageTo:EffectFunc = (event:ActionEvent,effect)=>{
    const value = effect.params.value
    const {source,target,medium} = event
    handleEventEntity(target,(t)=>{
        // const oldValue = t.status.getStatusValue("health")
        // changeStatusValue(source,medium,t,"health",oldValue - value,"now")
    })  
    
}

//使得某个伤害事件的值减少
export const reduceDamageFor:EffectFunc = (event,effect)=>{
    const value = effect.params.value
    //使得触发其的伤害效果减少本效果的值
    if(event.effects){
        //获取其中的“damage"效果
        const damageEffect = event.effects.find(e=>e.key == "damage")
        if(damageEffect){
            // damageEffect.params.value -= value//未完成
        }
    }
}


