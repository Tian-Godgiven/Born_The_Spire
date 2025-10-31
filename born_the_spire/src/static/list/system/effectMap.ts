import _ from "lodash"
import {damageTo, reduceDamageFor} from "@/core/effects/health/damage"
import { healTo } from "@/core/effects/health/heal"
import { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent"
import { drawFromDrawPile } from "@/core/effects/card/drawCard"
import { costEnergy, emptyEnergy, getEnergy, pay_costEnergy } from "@/core/effects/energy"
import { newError } from "@/ui/hooks/global/alert"
import { discardCard, pay_discardCard } from "@/core/effects/card/discard"
import { getState } from "@/core/effects/state/stateControl"

type EffectData = {
    label?:string,
    key:string,
    effect:EffectFunc,//告知其对应的效果函数
}

export function getFromEffectMap(unit:EffectUnit){
    const data = effectMap.find(tmp=>tmp.key == unit.key)
    if(!data){
        newError(["错误:没有找到目标效果",unit.key])
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
        handleEventEntity(event.target,(e)=>{
            e.getTrigger({
                when:"before",
                how:"take",
                key:"damage",
                callback:async (event:ActionEvent)=>{
                    reduceDamageFor(event,effect)
                }
            })
        })
    }
},
//获得状态
{
    label:"获得状态",
    key:"getState",
    effect:(event,effect)=>{
        getState(event,effect)
    }
},
//回复生命
{
    label:"回复生命",
    key:"heal",
    effect:(event,effect)=>{
        healTo(event,effect)
    }
},{
    label:"从牌堆中抽牌",
    key:"drawFromDrawPile",
    effect:drawFromDrawPile
},{
    label:"削减能量",
    key:"costEnergy",
    effect:costEnergy
},{
    label:"消耗能量",
    key:"pay_costEnergy",
    effect:pay_costEnergy
},{
    label:"获得能量",
    key:"getEnergy",
    effect:getEnergy,
},{
    label:"清空能量",
    key:"emptyEnergy",
    effect:emptyEnergy
},{
    label:"丢弃卡牌",
    key:"discard",
    effect:discardCard
},{
    label:"用尽卡牌",
    key:"pay_discard",
    effect:pay_discardCard
}]

