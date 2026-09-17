//抽牌相关

import type { Card } from "@/core/objects/item/Subclass/Card";
import { handleEventEntity } from "@/core/objects/system/ActionEvent";
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Effect } from "@/core/objects/system/effect/Effect"
import type { CardPiles } from "@/core/objects/target/Player"
import { cardMove } from ".";
import { getStatusValue } from "@/core/objects/system/status/Status";
import { getActingPlayer } from "@/core/utils/typeGuards";

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
    const player = getActingPlayer(event.source, event.target)
    if (!player) return
    const pileName = effect.params.sourcePileName as keyof CardPiles
    const sourcePile = player.cardPiles[pileName]
    const card = effect.params.card as Card|Card[]
    handleEventEntity(card,(e)=>{
        cardMove(sourcePile,e,player.cardPiles.handPile,{handPile:player.cardPiles.handPile,owner:player})
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
    const player = getActingPlayer(event.source, event.target)
    if (!player) return false
    const sourcePile = player.cardPiles.drawPile

    let number: number
    const valueParam = effect.params.value

    if (typeof valueParam === 'object' && valueParam !== null && 'fromStatus' in valueParam) {
        const statusKey = valueParam.fromStatus as string
        number = getStatusValue(player, statusKey, 5) as number
    } else {
        number = valueParam as number
    }

    if (effect.params._addValue) {
        number += Number(effect.params._addValue)
    }

    const triggerLevel = event.triggerLevel || 0

    for(let i = 0; i < number; i++){
        if(sourcePile.length === 0){
            player.fillDrawPile()
            if(sourcePile.length === 0) break
        }
        const card = sourcePile[0]
        const subEffect = new Effect({
            key:"drawCard",
            effectFunc:drawCard,
            params:{ sourcePileName: "drawPile" as keyof CardPiles, card },
            triggerEvent:event
        })
        await subEffect.runCycle(triggerLevel)
        const { flyDrawnCard } = await import("@/ui/animation/cardFlight")
        flyDrawnCard(card)
    }
}
