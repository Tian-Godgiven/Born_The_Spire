//抽牌相关

import { Card } from "@/objects/item/Card";
import { handleEventEntity } from "@/objects/system/ActionEvent";
import { EffectFunc } from "@/objects/system/effect/EffectFunc"
import { CardPiles, Player } from "@/objects/target/Player"
import { cardMove } from ".";

//从抽牌堆里抽取卡牌到手牌中
export const drawCard:EffectFunc = (event,effect)=>{
    const {target} = event
    //只有玩家对象具备卡牌
    if(target instanceof Player == false) return;
    //来源的牌堆存储在params中
    const pileName = effect.params.sourcePileName as keyof CardPiles
    const sourcePile = target.cardPiles[pileName]
    //丢弃的目标存储在params中
    const card = effect.params.card as Card|Card[]
    handleEventEntity(card,(e)=>{
        //移动到手牌堆
        cardMove(sourcePile,e,target.cardPiles.handPile)
    })
}

//从任意牌堆中抽取卡牌到手牌中