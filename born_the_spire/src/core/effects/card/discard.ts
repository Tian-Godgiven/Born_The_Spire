//弃牌相关
import { Card } from "@/core/objects/item/Subclass/Card";
import { doEvent, handleEventEntity } from "@/core/objects/system/ActionEvent";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { CardPiles, Player } from "@/core/objects/target/Player";
import { cardMove } from ".";

//从指定牌堆丢弃指定的卡牌到弃牌堆
export const discardCard:EffectFunc = (event,effect)=>{
    const {target} = event
    //只有玩家对象具备卡牌
    if(target instanceof Player == false) return;
    //来源的牌堆存储在params中
    const pileName = effect.params.sourcePileName as keyof CardPiles
    const pile = effect.params.sourcePile as Card[]
    const sourcePile = pile??target.cardPiles[pileName]
    //丢弃的目标存储在params中
    const card = effect.params.card as Card|Card[]
    handleEventEntity(card,(e)=>{
        //移动到弃牌堆
        cardMove(sourcePile,e,target.cardPiles.discardPile)
    })
}

//指定的卡牌使用完毕
export const pay_discardCard:EffectFunc = (event,effect)=>{
    const {source} = event
    //只有玩家对象具备卡牌
    if(source instanceof Player == false) return;
    //来源的牌堆存储在params中
    const pileName = effect.params.sourcePileName as keyof CardPiles
    const pile = effect.params.sourcePile as Card[]
    const sourcePile = pile??source.cardPiles[pileName]
    //丢弃的目标存储在params中
    const card = effect.params.card as Card|Card[]
    handleEventEntity(card,(e)=>{
        //移动到弃牌堆
        cardMove(sourcePile,e,source.cardPiles.discardPile)
    })
}


//丢弃目标的所有卡牌
export const discardAllCard:EffectFunc = async(event,effect)=>{
    const {source,medium,target} = event
    //只有玩家对象具备卡牌
    if(target instanceof Player == false) return;
    const player = target
    const pileName = effect.params.pileName as keyof CardPiles
    const pile = player.cardPiles[pileName]
    if(pile.length == 0) return;
    //丢弃这些卡牌,每一张卡牌都会响应一次触发器
    doEvent({
        key:"discardAllCard",
        source,medium,target,
        effectUnits:[{
            "key":"discard",
            "describe":[`丢弃卡牌`],
            "params":{sourcePileName:pileName,card:pile}
        }]
    })
}