import { newError } from "@/hooks/global/alert"
import { ActionEvent } from "@/objects/system/ActionEvent"
import { Entity } from "@/objects/system/Entity"
import { getStatusByKey } from "@/objects/system/Status"
import _, { isArray } from "lodash"
import { doEffect, Effect } from "@/objects/system/Effect"

//用来产生一个效果的map
export type EffectKeyMap = {
    key:string,
    value:number|[number,number],
    targetType:"player"|"enemy"|"all"|"self"
}

//通过effectMap获取effect
export function getEffectByKey(map:EffectKeyMap):Effect{
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

//通过map来产生并触发一个效果
export function doEffectByKey(source:Entity,medium:Entity,target:Entity,effectMap:EffectKeyMap){
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
{
    //造成伤害
    label:"造成伤害",
    key:"damage",
    effect:({target},effect)=>{
        //目标的当前生命值减少value值
        const health = getStatusByKey(target,"health","max")
        health.value.now -= effect.value.now
    },
},
//收到伤害时，减少受到的伤害
{
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
                //使得触发其的伤害效果减少本效果的值
                if(damage.effect)
                damage.effect.value.now -= effect.value.now
            }
        })
    }
}]

