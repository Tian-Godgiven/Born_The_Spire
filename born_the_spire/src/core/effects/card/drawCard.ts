//抽牌相关

import { Card } from "@/core/objects/item/Card";
import { handleEventEntity } from "@/core/objects/system/ActionEvent";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { CardPiles, Player } from "@/core/objects/target/Player"
import { cardMove } from ".";

//从任意牌堆中抽取卡牌到手牌中
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
        cardMove(sourcePile,e,target.cardPiles.handPile)
    })
}

//从抽牌堆抽取指定数量的卡牌
export const drawFromDrawPile:EffectFunc = (event,effect)=>{
    const {target} = event
    //只有玩家对象具备卡牌
    if(target instanceof Player == false) return;
    const player = target
    const sourcePile = target.cardPiles['drawPile']
    const length = sourcePile.length//还剩多少牌
    //抽取数量
    const number = effect.params.value as number;
    //牌堆数量不足：先洗牌
    if(length < number){
        if(length>0){
            //先抽足够的数量，将抽牌堆清空
            drawBehavior(length)
        }
        //用弃牌堆填充抽牌堆
        player.fullDrawPile()
        //如果填充后还是不足，报一个信息
        if(sourcePile.length < number-length){
        }
        //再抽剩余数量
        drawBehavior(number-length)
    }
    //直接抽对应数量的卡牌
    else{
        drawBehavior(number)
    }

    function drawBehavior(num:number){
        const cards = sourcePile.slice(0,num)
        console.log(sourcePile === player.hand)
        handleEventEntity(cards,(card)=>{
            //移动到手牌堆
            cardMove(sourcePile,card,player.cardPiles.handPile)
        })
        console.log("抽牌后的来源牌堆和要抽的卡牌",sourcePile,cards)
    }
}

