//抽牌相关

import type { Card } from "@/core/objects/item/Subclass/Card";
import { handleEventEntity } from "@/core/objects/system/ActionEvent";
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Effect } from "@/core/objects/system/effect/Effect"
import type { CardPiles } from "@/core/objects/target/Player"
import { Player } from "@/core/objects/target/Player"
import { cardMove } from ".";
import { getStatusValue } from "@/core/objects/system/status/Status";

/**
 * 原子效果：抽取一张卡牌到手牌中
 * 所有抽牌行为都应经过此效果，以便触发器统一监听 "drawCard"
 *
 * @params {
 *   sourcePileName: keyof CardPiles - 来源牌堆名称
 *   card: Card | Card[] - 要抽取的卡牌
 * }
 */
export const drawCard:EffectFunc = (event,effect)=>{
    const {target} = event
    //只有玩家对象具备卡牌
    if(target instanceof Player == false) return;
    //来源的牌堆存储在params中
    const pileName = effect.params.sourcePileName as keyof CardPiles
    const sourcePile = target.cardPiles[pileName]
    //抽取的目标存储在params中
    const card = effect.params.card as Card|Card[]
    handleEventEntity(card,(e)=>{
        //移动到手牌堆
        cardMove(sourcePile,e,target.cardPiles.handPile,{handPile:target.cardPiles.handPile,owner:target})
    })
}

/**
 * 从抽牌堆抽取指定数量的卡牌
 * 处理牌堆耗尽填充逻辑，然后对每张牌执行 drawCard 原子效果
 *
 * @params {
 *   value: number | { fromStatus: string } - 抽牌数量
 *   _addValue?: number - 额外抽牌数（由其他效果追加）
 * }
 */
export const drawFromDrawPile:EffectFunc = async (event,effect)=>{
    const {target} = event
    //只有玩家对象具备卡牌
    if(target instanceof Player == false) return false;
    const player = target
    const sourcePile = player.cardPiles.drawPile

    //抽取数量 - 支持从属性读取
    let number: number
    const valueParam = effect.params.value

    if (typeof valueParam === 'object' && valueParam !== null && 'fromStatus' in valueParam) {
        const statusKey = valueParam.fromStatus as string
        number = getStatusValue(player, statusKey, 5) as number
    } else {
        number = valueParam as number
    }

    // 支持额外抽牌数（由 addFirstTurnDraw 等效果通过 _addValue 追加）
    if (effect.params._addValue) {
        number += Number(effect.params._addValue)
    }

    const triggerLevel = event.triggerLevel || 0

    // 逐张抽牌，处理牌堆耗尽时自动填充
    for(let i = 0; i < number; i++){
        // 牌堆为空时，从弃牌堆填充
        if(sourcePile.length === 0){
            player.fillDrawPile()
            // 填充后仍为空，无牌可抽
            if(sourcePile.length === 0) break
        }
        // 对当前牌堆顶部的牌执行 drawCard 原子效果
        const card = sourcePile[0]
        const subEffect = new Effect({
            key:"drawCard",
            effectFunc:drawCard,
            params:{ sourcePileName: "drawPile" as keyof CardPiles, card },
            triggerEvent:event
        })
        await subEffect.trigger("before", triggerLevel)
        await subEffect.apply()
        await subEffect.trigger("after", triggerLevel)
    }
}
