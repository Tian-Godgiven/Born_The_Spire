import { newLog } from "@/ui/hooks/global/log";
import { ActionEvent } from "../ActionEvent";
import { Effect } from "./Effect";

//效果参数
export type EffectParams = {
    [paramKey:string]:
        |boolean
        |string
        |number
        |Record<string,any>
        |`$r.${string}` //表示从event._result中取string的值作为该paramKey的值
}

// 解析效果参数
export function resolveEffectParams(param: EffectParams[string],event:ActionEvent,effect:Effect){
    if(typeof param == "string" && param.startsWith("$")){
        const value = param.split(".")[1]
        if(param.startsWith("$r.")){
            return event.getEventResult(value)
        }
    }
}

export type EffectFunc = (
    event:ActionEvent,//引发这个效果的事件对象
    effectObj:Effect,//这个效果的效果对象
)=>any

//执行一个效果函数
export async function doEffectFunc(effect: Effect,override_event?:ActionEvent) {
    //效果所属的事件
    let event = effect.actionEvent;
    if(override_event){
        event = override_event
    }
    //效果函数
    const effectFunc = effect.effectFunc;
    //计算效果此时的参数应用值
    countEffectValue(effect);
    const res = await effectFunc(event,effect);
    //打印日志
    newLog({main:["执行效果",effect],detail:["所属事件:",event,"返回结果:",res]})

    return res
}

function countEffectValue(_effect:Effect){

}