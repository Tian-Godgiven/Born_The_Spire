import { CardMap } from "@/static/list/item/cardList";
import { Target } from "@/core/objects/target/Target";
import { Item } from "../Item";
import { doEvent } from "@/core/objects/system/ActionEvent";
import { CardPiles, Player } from "../target/Player";
import { Entity } from "../system/Entity";
import { EffectUnit } from "../system/effect/EffectUnit";
import { newError } from "@/ui/hooks/global/alert";
import { getStatusValue } from "../system/status/Status";

// 卡牌对象
export class Card extends Item{
    public entry:string[] = []
    constructor(map:CardMap){
        super(map)
        this.entry.push(...map.entry??[])
    }
    haveEntry(entry:string){
        if(this.entry.includes(entry)){
            return true
        }
        return false
    }
}

//对目标使用卡牌
export async function useCard(card:Card,fromPile:Card[],source:Player,targets:Target[]){
    const cardCost = getStatusValue(card,"cost")
    //支付能量
    const costEffect:EffectUnit = {
        key:"pay_costEnergy",
        describe:[`支付${cardCost}点能量`],
        params:{cost:cardCost},
        resultStoreAs:"costEnergyResult"
    }
    //卡牌效果
    const cardUse = card.getInteraction("use")
    if(!cardUse){
        newError(["该卡牌没有使用效果，无法使用该卡牌"])//未完成：不完善，应该是取消选择
        return
    }
    const cardEffects = cardUse.effects
    //移入弃牌堆
    const discardEffect = {
        key:"pay_discard",
        describe:["将卡牌移入弃牌堆"],
        params:{sourcePile:fromPile,card}
    }
    //消耗卡牌对应的费用，事件成功时才会触发卡牌效果
    doEvent({
        key:"useCard",
        source,
        medium:card,
        target:targets,
        phase:[{
            entityMap:{
                target:"source"//消耗自身的能量
            },
            effectUnits:[costEffect],
        },{
            effectUnits:[...cardEffects],
            condition:(e)=>{
                if(e.getEventResult("costEnergyResult")!=true){
                    //卡牌需要的费用不足，取消这个卡牌使用事件
                    return "break"
                }
                return e.getEventResult("costEnergyResult") == true
            }
        },{
            effectUnits:[discardEffect],
            entityMap:{
                target:"medium"
            }
        }]
    })
}

//从抽牌堆中抽取n张卡牌,这是一个事件
export async function drawCardFromDrawPile(player:Player,number:number,medium:Entity){
    doEvent({
        key:"drawFromDrawPile",
        source:player,
        medium,
        target:player,
        effectUnits:[{
            key:"drawFromDrawPile",
            describe:[`从抽牌堆抽取${number}张卡牌`],
            params:{value:number},
        }]
    })
}

//抽取指定卡牌到手牌中
export async function drawCard(sourcePileName:keyof CardPiles,card:Card,player:Player,medium:Entity){
    doEvent({
        key:"drawCard",
        source:player,
        medium,
        target:card,
        effectUnits:[{
            key:"drawCard",
            params:{sourcePileName,card},
        }]
    })
}

//丢弃卡牌，使得一张卡牌进入玩家的弃牌堆
export async function discardCard(sourcePileName:keyof CardPiles,card:Card,player:Player,medium:Entity){
    doEvent({
        key:"discard",
        source:player,medium,
        target:card,
        effectUnits:[{
            key:"discard",
            params:{sourcePileName,card},
        }]
    })
}
//丢弃玩家指定的牌堆中的所有牌
export async function discardAllPile(player:Player,pileName:keyof CardPiles,medium:Entity){
    const pile = player.cardPiles[pileName]
    //创建一个事件，效果是丢弃所有卡牌
    doEvent({
        key:"discardAllPile",
        source:player,medium,
        target:pile,
        effectUnits:[{
            key:"discardAll",
            describe:["丢弃所有卡牌"],
            params:{pileName},
        }]
    })
}
