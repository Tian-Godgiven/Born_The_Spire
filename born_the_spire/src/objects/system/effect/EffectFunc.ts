import { newLog } from "@/hooks/global/log";
import { ActionEvent } from "../ActionEvent";
import { Effect } from "./Effect";

//效果参数
export type EffectParams = Record<string,{
    [key:string]:any
}|any>

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
    //通过事件的onCall返回效果结果
    event.call(effect.key,res)
    return res
}

function countEffectValue(_effect:Effect){

}