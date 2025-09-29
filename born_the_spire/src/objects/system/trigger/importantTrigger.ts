import { TriggerObj } from "@/types/object/trigger"
import { Trigger } from "./Trigger"

export type ImportantTrigger = {
    importantKey:string,
    onlyKey?:string
    triggerWay:string,//例如 after_via_useCard
    id:string,
    remove:()=>void,
    info?:string
}

export function getImportantTrigger(trigger:Trigger,triggerObj:TriggerObj,importantKey:string,id:string,remove:()=>void,info?:string,onlyKey?:string){
    const importantTrigger:ImportantTrigger = {
        importantKey,
        onlyKey,
        triggerWay:`${triggerObj.when}_${triggerObj.how}_${triggerObj.key}`,
        id,
        remove,
        info
    }
    trigger._importantTriggr.push(importantTrigger)
}

//替换唯一关键触发器中的信息
export function swapImportantTrigger(important:ImportantTrigger,id:string,remove:()=>any){
    important.remove = remove;
    important.id = id
}