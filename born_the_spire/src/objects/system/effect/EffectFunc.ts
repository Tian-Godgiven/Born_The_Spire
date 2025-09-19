import { newLog } from "@/hooks/global/log";
import { ActionEvent } from "../ActionEvent";
import { Effect } from "./Effect";

//效果参数
export type EffectParams = Record<string,{
    value:any,
    [key:string]:any
}>

export type EffectFunc = (
    event:ActionEvent,//引发这个效果的事件对象
    effectObj:Effect,//效果对象
)=>any

//执行一个效果函数
export async function doEffectFunc(effect: Effect) {
    //效果所属的事件
    const event = effect.actionEvent;
    //效果函数
    const effectFunc = effect.effectFunc;
    //计算效果此时的参数应用值
    countEffectValue(effect);
    const res = await effectFunc(event, effect);
    //打印日志
    newLog({main:["执行效果",effect],detail:["所属事件",event]})
    return res
}

function countEffectValue(_effect:Effect){

}