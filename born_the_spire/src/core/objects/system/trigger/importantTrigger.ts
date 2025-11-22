import { TriggerObj } from "@/core/types/object/trigger"
import { Trigger } from "./Trigger"
import { newError } from "@/ui/hooks/global/alert"

export type ImportantTrigger = {
    importantKey:string,
    onlyKey?:string//是否唯一存在
    triggerWay:string,//例如 after_via_useCard
    id:string,
    remove:()=>void,
    info?:string
}

//创建关键触发器
export function createImportantTrigger(item:TriggerObj & {importantKey:string}):TriggerObj{
    return {
        ...item
    }
}

type AppendOption = {
    id:string,
    remove:()=>void,
    info?:string
}

//添加关键触发器信息，如果唯一则会进行替换
export function appendImportantTrigger(trigger:Trigger,triggerObj:TriggerObj&{importantKey:string},option:AppendOption){
    const {importantKey,onlyKey} = triggerObj
    const importantTrigger:ImportantTrigger = {
        importantKey,
        onlyKey,
        triggerWay:`${triggerObj.when}_${triggerObj.how}_${triggerObj.key}`,
        ...option
    }
    
    //如果是唯一的，则检查是否需要替换
    if(onlyKey && ifHaveOnlyImportantTrigger(trigger,importantKey)){
        //替换该唯一关键触发器
        swapOnlyImportantTrigger(trigger,importantTrigger)
    }
    //直接添加
    else{
        trigger._importantTrigger.push(importantTrigger)
    }
}
    

//是否具备某个唯一触发器
function ifHaveOnlyImportantTrigger(trigger:Trigger,importantKey:string){
    const res = trigger.getImportantTrigger(importantKey)
    return res.length > 0 ? true:false
}

//替换唯一关键触发器，主要是把旧的触发器移除
export function swapOnlyImportantTrigger(trigger:Trigger,newTrigger:ImportantTrigger,overwrite:"alone"|"multi" = "alone"){
    //移除旧的触发器
    const res = trigger.getImportantTrigger(newTrigger.importantKey)
    //旧的触发器并非唯一
    if(res.length > 1){
        //单独覆盖模式下报错
        if(overwrite == "alone"){
            newError(["替换唯一关键触发器时，之前的关键触发器为不唯一，且覆盖模式设置为alone"])
        }
        //复数覆盖模式下，将之前的全部移除
        else{
            for(let i of res){
                i.remove()
            }
        }
    }
    else{
        //将之前的触发器移除
        const old = res[0]
        old.remove()
    }
    //新的关键触发器添加到属性中
    trigger._importantTrigger.push(newTrigger)
    
}