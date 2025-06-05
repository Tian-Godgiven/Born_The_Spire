import { isArray, random } from "lodash";
import { ActionEvent } from "./ActionEvent";
import { Entity } from "./Entity";

type EffectType = |
//范围型,效果触发时，会从min到max之间随机生成一个值作为now
{
    valueType:"range"
    value:{
        min:number,
        now:number
        max:number
    }//效果值
}|
//数值型
{
    valueType:"number"
    value:{now:any}//效果值
}

type EffectMap = {  
    label:string,
    key:string,
    //效果作用对象类型
    targetType:"player"|"enemy"|"all"|"self"|"any",
    //效果事件
    effect:(event:ActionEvent,effect:Effect)=>void,
    value:number|[number,number]
}
//效果对象
export type Effect = {
    label:string,//效果名称
    key:string//效果关键词
    targetType:"player"|"enemy"|"all"|"self"|"any"//效果作用对象
    //效果事件
    effect:(event:ActionEvent,effect:Effect)=>void
}&(EffectType)
//通过map创建一个effect
export function createEffectByMap({label,key,targetType,effect,value}:EffectMap):Effect{
    if(typeof value == "number"){
        return {
            label,key,targetType,effect,
            value:{
                now:value
            },
            valueType:"number"
        }
    }
    else if(isArray(value)){
        return {
            label,key,targetType,effect,
            valueType:"range",
            value:{
                min:value[0],
                now:0,
                max:value[1]
            },
        }
    }
    return{
        label,key,targetType,effect,
        value:{
            now:value
        },
        valueType:"number"
    }
}

//执行一个效果
export function doEffect(source: Entity, medium: Entity, target: Entity, effect: Effect) {
    //创建效果事件
    const event = new ActionEvent(effect.key, source, medium, target, {}, effect);
    //效果函数
    const effectFunc = effect.effect;
    //获取效果的值
    getEffectValue(effect);
    event.triggerEvent("before");
    //执行效果函数
    effectFunc(event, effect);
    event.triggerEvent("after");
}

//获取效果值
export function getEffectValue(effect:Effect){
    //获取range类型的当前value
    let value:number
    if(effect.valueType=="range"){
        value = random(effect.value.min,effect.value.max)
        effect.value.now = value
    }
    return effect
}