import _ from "lodash"
import {damageTo, reduceDamageFor, modifyDamageValue, modifyDamageByPercent} from "@/core/effects/health/damage"
import { healTo } from "@/core/effects/health/heal"
import { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent"
import { drawFromDrawPile } from "@/core/effects/card/drawCard"
import { costEnergy, emptyEnergy, getEnergy, pay_costEnergy } from "@/core/effects/energy"
import { newError } from "@/ui/hooks/global/alert"
import { discardCard, pay_discardCard, pay_exhaustCard } from "@/core/effects/card/discard"
import { voidExhaust, moveInherentToHand } from "@/core/effects/card/entryEffects"
import { applyState, removeState, changeStateStack } from "@/core/effects/state/stateControl"
import { addStatusBase } from "@/core/effects/status/changeStatus"
import { addCurrent, addStatusBaseCurrentValue } from "@/core/effects/current/changeCurrent"
import { gainReserve, spendReserve } from "@/core/effects/reserve/reserve"
import { killTarget, reviveTarget } from "@/core/effects/life/lifeControl"
import { replaceOrgan } from "@/core/effects/organ/organEffects"

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
export const effectMap:EffectData[] = [
//对target造成伤害
{
    label:"造成伤害",
    key:"damage",
    effect:damageTo
},
//减少伤害值
{
    label:"减少伤害值",
    key:"reduceDamageValue",
    effect:reduceDamageFor
},
//修改伤害值
{
    label:"修改伤害值",
    key:"modifyDamageValue",
    effect:modifyDamageValue
},
//按百分比修改伤害值
{
    label:"按百分比修改伤害值",
    key:"modifyDamageByPercent",
    effect:modifyDamageByPercent
},
//收到伤害时，减少受到的伤害
{
    label:"受到伤害时，减少受到的伤害",
    key:"take_reduce_damage",   
    effect:(event,effect)=>{
        handleEventEntity(event.target,(e)=>{
            e.appendTrigger({
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
//附加状态
{
    label:"添加状态",
    key:"applyState",
    effect:applyState
},
//移除状态
{
    label:"移除状态",
    key:"removeState",
    effect:removeState
},
//修改状态层数
{
    label:"修改状态层数",
    key:"changeStateStack",
    effect:changeStateStack
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
    label:"支付能量",
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
    label:"用完卡牌",
    key:"pay_discard",
    effect:pay_discardCard
},{
    label:"消耗卡牌",
    key:"pay_exhaust",
    effect:pay_exhaustCard
},{
    label:"基础属性改变：加减",
    key:"addStatusBase",
    effect:addStatusBase
},{
    label:"当前值改变：加减",
    key:"addCurrent",
    effect:addCurrent
},{
    label:"改变属性+对应的当前值：加减",
    key:"addStatusBaseCurrentValue",
    effect:addStatusBaseCurrentValue
},{
    label:"获得储备",
    key:"gainReserve",
    effect:gainReserve
},{
    label:"消耗储备",
    key:"spendReserve",
    effect:spendReserve
},{
    label:"虚无：若在手牌则消耗",
    key:"voidExhaust",
    effect:voidExhaust
},{
    label:"固有：将固有卡牌移入手牌",
    key:"moveInherentToHand",
    effect:moveInherentToHand
},{
    label:"杀死目标",
    key:"kill",
    effect:killTarget
},{
    label:"复活目标",
    key:"revive",
    effect:reviveTarget
},{
    label:"替换器官",
    key:"replaceOrgan",
    effect:replaceOrgan
}]

