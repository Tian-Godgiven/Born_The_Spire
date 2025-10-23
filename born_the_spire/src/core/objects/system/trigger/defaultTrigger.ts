//默认触发器相关
import { TriggerObj } from "@/core/types/object/trigger";
import { Trigger } from "./Trigger";

export type DefaultTrigger = {
    triggerWay:string,//例如 after_via_useCard
    id:string,
    remove:()=>void,
    info?:string
}

export function getDefaultTrigger(triggerManager:Trigger,triggerObj:TriggerObj,id:string,remove:()=>void,info?:string){
    const defaultTrigger:DefaultTrigger = {
        triggerWay:`${triggerObj.when}_${triggerObj.how}_${triggerObj.key}`,
        id,
        remove,
        info
    } 
    triggerManager._defaultTrigger.push(defaultTrigger)
}