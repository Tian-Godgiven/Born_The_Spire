import { ActionEvent } from "../ActionEvent";
import { Effect } from "./Effect";

//效果参数
export type EffectParams = {
    value:any,
    [key:string]:any
}

export type EffectFunc = (
    event:ActionEvent,//引发这个效果的事件对象
    effectObj:Effect,//效果对象
)=>any

//执行一个效果函数
export function doEffect(effect:Effect){

}