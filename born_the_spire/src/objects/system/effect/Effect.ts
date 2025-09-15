import { isArray, random } from "lodash";
import { ActionEvent } from "../ActionEvent";
import { Entity } from "../Entity";
import { EffectUnit } from "./EffectUnit";
import { EffectFunc, EffectParams } from "./EffectFunc";

//效果对象
export type Effect = {
    label:string,//效果名称
    key:string//效果关键词
    targetType:"player"|"enemy"|"all"|"self"|"any"//效果作用对象
    //效果事件
    effect:(event:ActionEvent,effect:Effect)=>void,
    params:Record<string,any>,
    describe?:string[]
}

export class Effect{
    public key:string;//关键字
    public effectFunc:EffectFunc;
    public params:GamepadEffectParameters;
    public label?:string = "";//效果的名称
    public describe?:string[] = []
    constructor({label="",key,effect,params,describe=[]}:{label:?string,key:string,effect:EffectFunc,params:EffectParams,describe?:string[]}){
        this.label = label;
        this.key = key;
        this.effect = effect;
        this.params = params;
        this.describe = describe
    }
}

//通过效果unit创建效果对象
export function createEffectByUnit(unit:EffectUnit,effectFunc:EffectFunc,effectLabel?:string):Effect{
    //组合得到效果对象
    const {key,params,describe} = unit
    const effectObj = new Effect(effectLabel,key,effectFunc,params,describe)
}

//通过map创建一个effect
export function createEffectByMap(effectMap:EffectMap):Effect{
    const value = effectMap.value
    const info = effectMap.info??{}
    if(typeof value == "number"){
        return {
            ...effectMap,
            info,
            value:{
                now:value
            },
            valueType:"number"
        }
    }
    else if(isArray(value)){
        return {
            ...effectMap,
            info,
            valueType:"range",
            value:{
                min:value[0],
                now:0,
                max:value[1]
            },
        }
    }
    return{
        ...effectMap,
        info,
        value:{
            now:value
        },
        valueType:"number"
    }
}

//执行一个效果
export function doEffect(source: Entity, medium: Entity, target: Entity, effect: Effect) {
    //效果函数
    const effectFunc = effect.effect;
    //获取效果的值
    getEffectValue(effect);
    event.happen(()=>{
        //执行效果函数
        effectFunc(event, effect);
    })
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