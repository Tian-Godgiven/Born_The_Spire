import { handleEventEntity } from "@/core/objects/system/ActionEvent";
import { changeCurrentValue, getCurrentValue } from "@/core/objects/system/Current/current";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { changeStatusValue } from "@/core/objects/system/status/Status";
import { newError } from "@/ui/hooks/global/alert";
import { isEntity } from "@/core/utils/typeGuards";

//增加属性基础值
export const addCurrent:EffectFunc = (event,effect)=>{
    //获取目标
    const {target} = event;
    //获取修改的目标属性和修改值
    let {value=0,currentKey} = effect.params
    //任一缺少都不继续
    if(!currentKey){
        newError(["效果缺少目标属性的key"])
    }
    currentKey = String(currentKey)
    value = Number(value)
    handleEventEntity(target,(e)=>{
        if (!isEntity(e)) return;
        //当前值
        const nowValue = getCurrentValue(e,currentKey)
        changeCurrentValue(e,currentKey,value+nowValue,event)
    })

}

//同时改变属性值和对应的当前值
export const addStatusBaseCurrentValue:EffectFunc = (event,effect)=>{
    //获取目标
    const {target,source} = event;
    //获取修改的目标属性和修改值
    let {value=0,currentKey,statusKey} = effect.params
    //任一缺少都不继续
    if(!currentKey || !statusKey){
        newError(["效果缺少目标属性的key"])
    }
    statusKey = String(statusKey)
    currentKey = String(currentKey)
    value = Number(value)
    handleEventEntity(target,(e)=>{
        if (!isEntity(e)) return;
        //属性值
        changeStatusValue(e,statusKey,source,{
            "target":"base",
            "type":"additive",
            "value":value
        })
        //当前值
        const nowValue = getCurrentValue(e,currentKey)
        changeCurrentValue(e,currentKey,value+nowValue,event)
    })

}

