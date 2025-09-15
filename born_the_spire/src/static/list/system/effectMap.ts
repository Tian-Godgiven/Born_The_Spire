import _ from "lodash"
import {damageTo, reduceDamageFor} from "@/effects/health/damage"
import { getStateByEffect } from "@/effects/stateControl"
import { healTo } from "@/effects/health/heal"
import { EffectUnit } from "@/objects/system/effect/EffectUnit"
import { newLog } from "@/hooks/global/log"
import { EffectFunc } from "@/objects/system/effect/EffectFunc"

type EffectData = {
    label?:string,
    key:string,
    effect:EffectFunc,//告知其对应的效果函数
}

export function getFromEffectMap(unit:EffectUnit){
    const data = effectMap.find(tmp=>tmp.key == unit.key)
    if(!data){
        newLog(["错误:没有找到目标效果",unit.key]);
        throw new Error()
    ;}
    return data
}

//效果映射表，将json中存储的效果map转化成效果对象
const effectMap:EffectData[] = [
//对target造成伤害
{
    label:"造成伤害",
    key:"damage",
    effect:damageTo
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
                reduceDamageFor(event,effect)
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
        healTo(event,effect)
    }
}]

