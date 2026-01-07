import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent";
import { changeCurrentValue, getCurrentValue } from "@/core/objects/system/Current/current";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { isEntity } from "@/core/utils/typeGuards";
import { newError } from "@/ui/hooks/global/alert";

//对单个目标造成伤害
export const damageTo:EffectFunc = (event:ActionEvent,effect)=>{
    const value = Number(effect.params.value)
    const {target} = event
    handleEventEntity(target,(t)=>{
        // 伤害只能作用于实体对象
        if (!isEntity(t)) {
            newError(["伤害效果只能作用于实体对象，当前目标类型:", t.participantType])
            return
        }
        const oldValue = getCurrentValue(t,"health",0)
        changeCurrentValue(t,"health",oldValue-value,event)
    })
    return true
}

//使得某个伤害事件的值减少
export const reduceDamageFor:EffectFunc = (event,effect)=>{
    const value = Number(effect.params.value)
    //使得触发其的伤害效果减少本效果的值
    if(event.effects){
        //获取其中的“damage"效果
        const damageEffect = event.effects.find(e=>e.key == "damage")
        if(damageEffect){
            const oldValue = Number(damageEffect.params.value)
            damageEffect.params.value = oldValue - value
            return true
        }
    }
    return false
}


