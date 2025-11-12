import { handleEventEntity } from "@/core/objects/system/ActionEvent";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { changeStatusValue } from "@/core/objects/system/status/Status";
import { newError } from "@/ui/hooks/global/alert";

//增加属性基础值
export const addStatusBase:EffectFunc = (event,effect)=>{
    //获取目标
    const {source,medium,target} = event;
    //获取修改的目标属性和修改值
    let {value=0,statusKey} = effect.params
    //任一缺少都不继续
    if(!statusKey){
        newError(["效果缺少目标属性的key"])
    }
    statusKey = String(statusKey)
    value = Number(value)
    handleEventEntity(target,(e)=>{
        changeStatusValue(e,statusKey,{source,medium},{
            "target":"base",
            "type":"additive",
            "value":value
        })
    })
    
}