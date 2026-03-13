import _ from "lodash"
import {damageTo, reduceDamageFor, modifyDamageValue, modifyDamageByPercent} from "@/core/effects/health/damage"
import { healTo } from "@/core/effects/health/heal"
import { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent"
import { drawFromDrawPile } from "@/core/effects/card/drawCard"
import { costEnergy, emptyEnergy, getEnergy, pay_costEnergy } from "@/core/effects/energy"
import { newError } from "@/ui/hooks/global/alert"
import { discardCard, pay_discardCard, pay_exhaustCard, discardAllCard } from "@/core/effects/card/discard"
import { voidExhaust, moveInherentToHand } from "@/core/effects/card/entryEffects"
import { fragileBreak, regenerateMass } from "@/core/effects/organ/organEntryEffects"
import { applyState, removeState, changeStateStack } from "@/core/effects/state/stateControl"
import { addStatusBase, multiplyStatusBase, setCurrentToMax } from "@/core/effects/status/changeStatus"
import { addCurrent, addStatusBaseCurrentValue } from "@/core/effects/current/changeCurrent"
import { gainReserve, spendReserve } from "@/core/effects/reserve/reserve"
import { killTarget, reviveTarget } from "@/core/effects/life/lifeControl"
import { replaceOrgan, chooseOrganRemove, damageOrgan, healOrgan } from "@/core/effects/organ/organEffects"
import { removeOrganEffect } from "@/core/effects/organ/organRemoveEffect"
import { upgradeCardEffect } from "@/core/effects/card/cardUpgradeEffect"
import { removeCardEffect } from "@/core/effects/card/cardRemoveEffect"
import { gainCard, gainPotion, gainRelic, gainOrgan } from "@/core/effects/item/gainItem"
import { gainMaxHealth } from "@/core/effects/health/heal"
import { isEntity } from "@/core/utils/typeGuards"
import { discoverCard, chooseRandomCard, chooseCardUpgrade, chooseCardRemove, chooseCardDuplicate, customCardChoice } from "@/core/effects/card/cardChoice"
import { cancelEvent, cancelCurrentEvent } from "@/core/effects/event/cancelEvent"
import { gainArmor } from "@/core/effects/gainArmor"
import { addFirstTurnDraw } from "@/core/effects/card/addFirstTurnDraw"
import { enableOrganRewardAction, disableOrganRewardAction } from "@/core/effects/organReward/organRewardActionEffects"
import { enablePoolAction, disablePoolAction } from "@/core/effects/pool/poolActionEffects"
import { addTemporaryCardEffect, addTemporaryOrganEffect, markCardTemporaryEffect, markOrganTemporaryEffect } from "@/core/effects/temporary/temporaryEffects"
import { addAbilityChargesEffect, reduceAbilityCooldownEffect, setAbilityToggleEffect, resetAbilityUsesEffect, setAbilityEnabledEffect, modifyAbilityCostEffect } from "@/core/effects/ability/abilityEffects"
import { addStatusModifier } from "@/core/effects/modifier/addModifier"

type EffectData = {
    label?:string,
    key:string,
    effect:EffectFunc,//告知其对应的效果函数
    preview?:(event: any, effect: any) => number | null  // 预览函数（可选）
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
    effect:damageTo,
    preview:(event, effect) => {
        // 预览时只返回伤害值，不真正扣血
        return Number(effect.params.value)
    }
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
    effect:modifyDamageValue,
    preview:(event, effect) => {
        // 预览时应用修改到目标效果的 params.value
        const delta = Number(effect.params.delta)
        const targetEffect = event.effects[0]
        if (targetEffect && targetEffect.key === "damage") {
            const oldValue = Number(targetEffect.params.value)
            const newValue = Math.max(0, oldValue + delta)
            targetEffect.params.value = newValue
            return newValue
        }
        return null
    }
},
//按百分比修改伤害值
{
    label:"按百分比修改伤害值",
    key:"modifyDamageByPercent",
    effect:modifyDamageByPercent,
    preview:(event, effect) => {
        // 预览时应用百分比修改
        const percent = Number(effect.params.percent)
        const targetEffect = event.effects[0]
        if (targetEffect && targetEffect.key === "damage") {
            const oldValue = Number(targetEffect.params.value)
            const delta = Math.round(oldValue * percent)
            const newValue = Math.max(0, oldValue + delta)
            targetEffect.params.value = newValue
            return newValue
        }
        return null
    }
},
//收到伤害时，减少受到的伤害
{
    label:"受到伤害时，减少受到的伤害",
    key:"take_reduce_damage",
    effect:(event,effect)=>{
        handleEventEntity(event.target,(e)=>{
            if (isEntity(e)) {
                e.appendTrigger({
                    when:"before",
                    how:"take",
                    key:"damage",
                    callback:async (event:ActionEvent)=>{
                        reduceDamageFor(event,effect)
                    }
                })
            }
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
    },
    preview:(event, effect) => {
        return Number(effect.params.value)
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
    label:"弃掉所有卡牌",
    key:"discardAllCard",
    effect:discardAllCard
},{
    label:"基础属性改变：加减",
    key:"addStatusBase",
    effect:addStatusBase
},{
    label:"基础属性改变：乘法",
    key:"multiplyStatusBase",
    effect:multiplyStatusBase
},{
    label:"设置当前值为最大值",
    key:"setCurrentToMax",
    effect:setCurrentToMax
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
    label:"脆弱：50%概率损坏器官",
    key:"fragileBreak",
    effect:fragileBreak
},{
    label:"再生：恢复器官质量",
    key:"regenerateMass",
    effect:regenerateMass
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
},{
    label:"发现卡牌",
    key:"discoverCard",
    effect:discoverCard
},{
    label:"从随机卡牌中选择",
    key:"chooseRandomCard",
    effect:chooseRandomCard
},{
    label:"选择卡牌升级",
    key:"chooseCardUpgrade",
    effect:chooseCardUpgrade
},{
    label:"升级卡牌",
    key:"upgradeCard",
    effect:upgradeCardEffect
},{
    label:"选择卡牌移除",
    key:"chooseCardRemove",
    effect:chooseCardRemove
},{
    label:"移除卡牌",
    key:"removeCard",
    effect:removeCardEffect
},{
    label:"选择卡牌复制",
    key:"chooseCardDuplicate",
    effect:chooseCardDuplicate
},{
    label:"自定义卡牌选择",
    key:"customCardChoice",
    effect:customCardChoice
},{
    label:"取消事件",
    key:"cancelEvent",
    effect:cancelEvent
},{
    label:"取消当前事件",
    key:"cancelCurrentEvent",
    effect:cancelCurrentEvent
},{
    label:"获得护甲",
    key:"gainArmor",
    effect:gainArmor,
    preview:(event, effect) => {
        return Number(effect.params.value)
    }
},{
    label:"第一回合额外抽牌",
    key:"addFirstTurnDraw",
    effect:addFirstTurnDraw
},{
    label:"获得卡牌",
    key:"gainCard",
    effect:gainCard
},{
    label:"获得药水",
    key:"gainPotion",
    effect:gainPotion
},{
    label:"获得遗物",
    key:"gainRelic",
    effect:gainRelic
},{
    label:"获得器官",
    key:"gainOrgan",
    effect:gainOrgan
},{
    label:"选择器官移除",
    key:"chooseOrganRemove",
    effect:chooseOrganRemove
},{
    label:"移除器官",
    key:"removeOrgan",
    effect:removeOrganEffect
},{
    label:"增加最大生命",
    key:"gainMaxHealth",
    effect:gainMaxHealth
},{
    label:"对器官造成质量伤害",
    key:"damageOrgan",
    effect:damageOrgan
},{
    label:"恢复器官质量",
    key:"healOrgan",
    effect:healOrgan
},{
    label:"启用器官奖励动作",
    key:"enableOrganRewardAction",
    effect:enableOrganRewardAction
},{
    label:"禁用器官奖励动作",
    key:"disableOrganRewardAction",
    effect:disableOrganRewardAction
},{
    label:"启用水池行动",
    key:"enablePoolAction",
    effect:enablePoolAction
},{
    label:"禁用水池行动",
    key:"disablePoolAction",
    effect:disablePoolAction
},{
    label:"添加临时卡牌",
    key:"addTemporaryCard",
    effect:addTemporaryCardEffect
},{
    label:"添加临时器官",
    key:"addTemporaryOrgan",
    effect:addTemporaryOrganEffect
},{
    label:"标记卡牌为临时",
    key:"markCardTemporary",
    effect:markCardTemporaryEffect
},{
    label:"标记器官为临时",
    key:"markOrganTemporary",
    effect:markOrganTemporaryEffect
},{
    label:"为能力添加充能",
    key:"addAbilityCharges",
    effect:addAbilityChargesEffect
},{
    label:"减少能力冷却",
    key:"reduceAbilityCooldown",
    effect:reduceAbilityCooldownEffect
},{
    label:"设置能力开关状态",
    key:"setAbilityToggle",
    effect:setAbilityToggleEffect
},{
    label:"重置能力使用次数",
    key:"resetAbilityUses",
    effect:resetAbilityUsesEffect
},{
    label:"启用/禁用能力",
    key:"setAbilityEnabled",
    effect:setAbilityEnabledEffect
},{
    label:"修改能力消耗",
    key:"modifyAbilityCost",
    effect:modifyAbilityCostEffect
},{
    label:"添加属性修饰器",
    key:"addStatusModifier",
    effect:addStatusModifier
}]

