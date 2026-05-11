import _ from "lodash"
import {damageTo, reduceDamageFor, modifyDamageValue, modifyDamageByPercent} from "@/core/effects/health/damage"
import { healTo } from "@/core/effects/health/heal"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent"
import { drawCard, drawFromDrawPile } from "@/core/effects/card/drawCard"
import { costEnergy, emptyEnergy, getEnergy, pay_costEnergy } from "@/core/effects/energy"
import { newError } from "@/ui/hooks/global/alert"
import { discardCard, pay_discardCard, pay_exhaustCard, pay_removePower, discardAllCard } from "@/core/effects/card/discard"
import { voidExhaust, moveInherentToHand } from "@/core/effects/card/entryEffects"
import { fragileBreak, regenerateMass } from "@/core/effects/organ/organEntryEffects"
import { applyState, removeState, changeStateStack } from "@/core/effects/state/stateControl"
import { addStatusBase, addStatusCurrent, multiplyStatusBase, setCurrentToMax, setBaseStatus, decrementStatus, resetCooldown } from "@/core/effects/status/changeStatus"
import { addCurrent, addStatusBaseCurrentValue } from "@/core/effects/current/changeCurrent"
import { gainReserve, spendReserve } from "@/core/effects/reserve/reserve"
import { killTarget, reviveTarget } from "@/core/effects/life/lifeControl"
import { replaceOrgan, chooseOrganRemove, damageOrgan, healOrgan } from "@/core/effects/organ/organEffects"
import { removeOrganEffect } from "@/core/effects/organ/organRemoveEffect"
import { upgradeCardEffect } from "@/core/effects/card/cardUpgradeEffect"
import { removeCardEffect } from "@/core/effects/card/cardRemoveEffect"
import { gainCard, gainPotion, gainRelic, gainOrgan } from "@/core/effects/item/gainItem"
import { isEntity } from "@/core/utils/typeGuards"
import { discoverCard, chooseRandomCard, chooseCardUpgrade, chooseCardRemove, chooseCardDuplicate, customCardChoice } from "@/core/effects/card/cardChoice"
import { cancelEvent, cancelCurrentEvent } from "@/core/effects/event/cancelEvent"
import { gainArmor } from "@/core/effects/gainArmor"
import { addFirstTurnDraw } from "@/core/effects/card/addFirstTurnDraw"
import { enableOrganRewardAction, disableOrganRewardAction } from "@/core/effects/organReward/organRewardActionEffects"
import { enablePoolAction, disablePoolAction } from "@/core/effects/pool/poolActionEffects"
import { addTemporaryCardEffect, addTemporaryOrganEffect, markCardTemporaryEffect, markOrganTemporaryEffect } from "@/core/effects/temporary/temporaryEffects"
import { addTemporaryEffect } from "@/core/effects/card/addTemporaryEffect"
import { addAbilityChargesEffect, reduceAbilityCooldownEffect, setAbilityToggleEffect, resetAbilityUsesEffect, setAbilityEnabledEffect, modifyAbilityCostEffect } from "@/core/effects/ability/abilityEffects"
import { addStatusModifier, addMaxHealthAndHeal } from "@/core/effects/modifier/addModifier"
import { accumulateAndTrigger } from "@/core/effects/relic/accumulateAndTrigger"
import { exhaustRandomCardByTag } from "@/core/effects/card/exhaustRandomCardByTag"
import { card_wasteHeatRecovery } from "@/core/effects/card/cardSpecificEffects"
import { addCardToHand } from "@/core/effects/card/addCardToHand"
import { countAndTrigger } from "@/core/effects/status/countAndTrigger"
import { toggleStatus } from "@/core/effects/status/toggleStatus"
import { disableOrgan, disableRandomOrgans, cleanupAllDisabledOrgans, isOrganDisabled } from "@/core/effects/organ/disableOrgan"
import { giveTemporaryEffectToRandomCards } from "@/core/effects/card/giveTemporaryEffectToRandomCards"
import { repeatEffects } from "@/core/effects/composite/repeatEffects"
import { chooseHandCardDiscard } from "@/core/effects/card/chooseHandCard"
import { retrieveCardsToHand } from "@/core/effects/card/retrieveCards"
import { artifactBlockDebuff } from "@/core/effects/state/artifactBlock"
import { previewValue, previewModifyValue, previewModifyByPercent } from "@/core/utils/effectPreview"
import { loseHealthTo } from "@/core/effects/health/loseHealth"
import { emptyChest } from "@/core/effects/chest/emptyChest"
import type { EffectParamsSchema } from "@/core/effects/validateEffectParams"

type EffectData = {
    label?:string,
    key:string,
    effect:EffectFunc,//告知其对应的效果函数
    preview?:(event: any, effect: any) => number | null,  // 预览函数（可选）
    paramsSchema?: EffectParamsSchema  // 参数校验 schema（可选，声明后会在 Effect 构造时严格校验）
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
    preview: previewValue
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
    preview: previewModifyValue("damage")
},
//按百分比修改伤害值
{
    label:"按百分比修改伤害值",
    key:"modifyDamageByPercent",
    effect:modifyDamageByPercent,
    preview: previewModifyByPercent("damage")
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
    preview: previewValue
},{
    label:"抽牌",
    key:"drawCard",
    effect:drawCard
},{
    label:"从抽牌堆中抽牌",
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
    label:"能力牌移除",
    key:"pay_removePower",
    effect:pay_removePower
},{
    label:"弃掉所有卡牌",
    key:"discardAllCard",
    effect:discardAllCard
},{
    label:"基础属性改变：加减",
    key:"addStatusBase",
    effect:addStatusBase
},{
    label:"当前属性改变：加减",
    key:"addStatusCurrent",
    effect:addStatusCurrent
},{
    label:"基础属性直接设置",
    key:"setBaseStatus",
    effect:setBaseStatus
},{
    label:"基础属性递减",
    key:"decrementStatus",
    effect:decrementStatus
},{
    label:"重置冷却",
    key:"resetCooldown",
    effect:resetCooldown
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
    preview: previewValue
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
},{
    label:"添加最大生命并回复",
    key:"addMaxHealthAndHeal",
    effect:addMaxHealthAndHeal
},{
    label:"积累计数并触发效果",
    key:"accumulateAndTrigger",
    effect:accumulateAndTrigger
},{
    label:"随机消耗指定标签的卡牌",
    key:"exhaustRandomCardByTag",
    effect:exhaustRandomCardByTag
},{
    label:"余热回收：检查牌堆并消耗卡牌获得额外护甲",
    key:"card_wasteHeatRecovery",
    effect:card_wasteHeatRecovery
},{
    label:"向手牌添加卡牌",
    key:"addCardToHand",
    effect:addCardToHand
},{
    label:"计数并触发效果",
    key:"countAndTrigger",
    effect:countAndTrigger
},{
    label:"切换状态值",
    key:"toggleStatus",
    effect:toggleStatus
},{
    label:"给卡牌添加临时效果",
    key:"addTemporaryEffect",
    effect:addTemporaryEffect
},{
    label:"禁用器官",
    key:"disableOrgan",
    effect:disableOrgan
},{
    label:"随机禁用器官",
    key:"disableRandomOrgans",
    effect:disableRandomOrgans
},{
    label:"给随机卡牌添加临时效果",
    key:"giveTemporaryEffectToRandomCards",
    effect:giveTemporaryEffectToRandomCards
},{
    label:"重复执行效果",
    key:"repeatEffects",
    effect:repeatEffects
},{
    label:"从手牌选择卡牌丢弃",
    key:"chooseHandCardDiscard",
    effect:chooseHandCardDiscard
},{
    label:"人工制品抵消负面效果",
    key:"artifactBlockDebuff",
    effect:artifactBlockDebuff
},{
    label:"从牌堆取回卡牌到手牌",
    key:"retrieveCardsToHand",
    effect:retrieveCardsToHand
},{
    label:"直接失去生命（绕过伤害）",
    key:"loseHealth",
    effect:loseHealthTo,
    preview: previewValue
},{
    label:"清空宝箱奖励",
    key:"emptyChest",
    effect:emptyChest
}]

