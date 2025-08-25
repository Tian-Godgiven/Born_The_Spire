import { newError } from "@/hooks/global/alert"
import { ActionEvent } from "@/objects/system/ActionEvent"
import { Entity } from "@/objects/system/Entity"
import _, { isArray } from "lodash"
import { doEffect, Effect } from "@/objects/system/Effect"
import {damageTo, reduceDamageFor} from "@/effects/health/damage"
import { Target } from "@/objects/target/Target"
import { getStateByEffect } from "@/effects/stateControl"
import { healTo } from "@/effects/health/heal"

//这里存储的是效果映射表，将json中存储的效果map转化成效果对象

//用来产生一个效果的map
export type EffectKeyMap = {
    key:string,
    info?:Record<string,any>,//用来存储其他信息
    value:number|[number,number],
    targetType:"player"|"enemy"|"all"|"self"
}

//通过effectMap获取effect对象
export function getEffectByKey(map:EffectKeyMap):Effect{
    const data = effectList.find(tmp=>tmp.key == map.key)
    if(!data)throw new Error("没有找到目标效果")
    let value:Effect["value"] = {now:0}
    let valueType:Effect["valueType"] = "number"
    const info = map.info??{}
    if(typeof map.value == "number"){
        return numberType(data,map.value)
    }
    else if(isArray(map.value)){
        return rangeType(data,map.value)
    }
    return {
        ...data,
        ...map,
        info,
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
            info,
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
            info,
            value,
            valueType
        }
    }
    
}

//通过map来产生并触发一个效果
export async function doEffectByKey(source:Entity,medium:Entity,target:Entity,effectMap:EffectKeyMap){
    //获取效果
    const effect = getEffectByKey(effectMap)
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
const effectList:EffectData[] = [
//对目标造成伤害
{
    label:"造成伤害",
    key:"damage",
    effect:(event,effect)=>{
        damageTo(event,effect.value.now)
    },
},
//收到伤害时，减少受到的伤害
{
    label:"受到伤害时，减少受到的伤害",
    key:"take_reduce_damage",   
    effect:(event,effect)=>{
        //为事件的效果目标添加受伤触发器
        event.target.getTrigger({
            when:"before",
            how:"take",
            key:"damage",
            callback:async (event)=>{
                reduceDamageFor(event,effect.value.now)
            }
        })
    }
},
//获得状态
{
    label:"获得状态",
    key:"getState",
    effect:(event,effect)=>{
        getStateByEffect(event,effect)
    }
},
//回复生命
{
    label:"回复生命",
    key:"heal",
    effect:(event,effect)=>{
        healTo(event,effect.value.now)
    }
}]

