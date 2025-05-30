import { newError } from "@/hooks/global/alert"
import { ActionEvent } from "@/objects/system/ActionEvent"
import { Entity } from "@/objects/system/Entity"
import { getStatusByKey } from "@/objects/system/Status"
import _, { isArray } from "lodash"

//用来产生一个效果的map
export type EffectMap = {
    key:string,
    value:number|[number,number],
    targetType:"player"|"enemy"|"all"|"self"
}

//执行一个效果
function doEffect(source:Entity,medium:Entity,target:Entity,effect:Effect){
    //创建效果事件
    const event = new ActionEvent(effect.key,source,medium,target,{},effect)
    //效果函数
    const effectFunc = effect.effect
    //获取效果的值
    getEffectValue(effect)
    event.triggerEvent("before")
    //执行效果函数
    effectFunc(event,effect)
    event.triggerEvent("after")
}

//通过effectMap获取effect
export function getEffectByMap(map:EffectMap):Effect{
    const data = effectList.find(tmp=>tmp.key == map.key)
    if(!data)throw new Error("没有找到目标效果")
    let value:Effect["value"] = {now:0}
    let valueType:Effect["valueType"] = "number"
    if(typeof map.value == "number"){
        return numberType(data,map.value)
    }
    else if(isArray(map.value)){
        return rangeType(data,map.value)
    }
    return {
        ...data,
        ...map,
        value,
        valueType
    }

    function numberType(data:EffectData,mapValue:number):Effect{
        valueType = "number"
        value = {
            now:mapValue
        }
        return {
            ...data,
            ...map,
            value,
            valueType
        }
    }
    function rangeType(data:EffectData,mapValue:[number,number]){
        valueType = "range"
        value = {
            min:mapValue[0],
            max:mapValue[1],
            now:0
        }
        return {
            ...data,
            ...map,
            value,
            valueType
        }
    }
    
}

export type Effect = {
    label:string,//效果名称
    key:string//效果关键词
    targetType:"player"|"enemy"|"all"|"self"//效果作用对象
    //效果事件
    effect:(event:ActionEvent,effect:Effect)=>void
}&({
    valueType:"range"//范围型
    value:{
        min:number,
        now:number
        max:number
    }//效果值
}|{
    valueType:"number"//数值型
    value:{now:any}//效果值
})
//通过map来创建一个效果
export function makeEffectByMap(source:Entity,medium:Entity,target:Entity,effectMap:EffectMap){
    //获取效果
    const effect = getEffectByMap(effectMap)
    if(!effect){
        newError(["不存在指定的效果map",effectMap,effectList])
    }
    //触发效果
    doEffect(source,medium,target,effect)
}

type EffectData = {
    label:string,
    key:string,
    effect:(event:ActionEvent,effect:Effect)=>void
}
//效果表
const effectList:EffectData[] = [{
    //造成伤害
    label:"造成伤害",
    key:"damage",
    effect:({target},effect)=>{
        //目标的当前生命值减少value值
        const health = getStatusByKey(target,"health","max")
        health.value.now -= effect.value.now
    },
},{
    //收到伤害时，减少受到的伤害
    label:"减少受到的伤害",
    key:"take_reduce_damage",   
    effect:(event,effect)=>{
        //为事件的效果目标添加受伤触发器
        event.target.getTrigger({
            when:"before",
            how:"take",
            key:"damage",
            callBack:(damage)=>{
                console.log("减少了造成的伤害",damage.effect)
                //使得触发其的伤害效果减少本效果的值
                if(damage.effect)
                damage.effect.value.now -= effect.value.now
                console.log("减少效果值",effect)
            }
        })
    }
}]

//获取效果值
function getEffectValue(effect:Effect){
    //获取range类型的当前value
    let value:number
    if(effect.valueType=="range"){
        value = _.random(effect.value.min,effect.value.max)
        effect.value.now = value
    }
    return effect
}