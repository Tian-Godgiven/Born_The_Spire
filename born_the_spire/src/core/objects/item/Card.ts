import { CardMap } from "@/static/list/item/cardList";
import { Target } from "@/core/objects/target/Target";
import { Item } from "./Item";
import { doEvent } from "@/core/objects/system/ActionEvent";
import { CardPiles, Player } from "../target/Player";
import { costEnergy } from "../../effects/energy";
import { getStatusValue } from "../system/Status";
import { Entity } from "../system/Entity";

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
export function useCard(card:Card,fromPile:Card[],source:Player,target:Target){
    const cardCost = getStatusValue(card,"cost")
    //消耗卡牌对应的费用，事件成功时才会触发卡牌效果
    doEvent("costEnergy",source,card,source,{},[{
            key:"costEnergy",
            describe:[`消耗${getStatusValue(card,"cost")}点能量`],
            params:{value:cardCost},
    },],()=>{},{
        effectKey:"costEnergy",
        onCall:(res:any)=>{
            //能量不足
            if(res == false){
                console.log("能量不足，无法使用卡牌")
                return;
            }
            //能量消耗成功,触发卡牌效果
            else{
                const effectUnits = card.onUse
                doEvent("useCard",source,card,target,{},effectUnits,()=>{})
            }
        }
    })
}

//从抽牌堆中抽取n张卡牌,这是一个行为
export function drawCardFromDrawPile(player:Player,number:number,medium:Entity){
    doEvent("drawFromDrawPile",player,medium,player,{},[{
        key:"drawFromDrawPile",
        describe:[`从抽牌堆抽取${number}张卡牌`],
        params:{value:number},
    }])
}

//抽取指定卡牌到手牌中
export function drawCard(sourcePileName:keyof CardPiles,card:Card,player:Player,medium:Entity){
    doEvent("drawCard",player,medium,card,{},[{
        key:"drawCard",
        params:{sourcePileName,card},
    }])
}

//丢弃卡牌，使得一张卡牌进入玩家的弃牌堆
export function discardCard(sourcePileName:keyof CardPiles,card:Card,player:Player,medium:Entity){
    doEvent("discard",player,medium,card,{},[{
        key:"discard",
        params:{sourcePileName,card},
    }])
}
//丢弃玩家指定的牌堆中的所有牌
export function discardAllPile(player:Player,pileName:keyof CardPiles,medium:Entity){
    const pile = player.cardPiles[pileName]
    //创建一个事件，效果是丢弃所有卡牌
    doEvent("discardAllPile",player,medium,pile,{},[{
            key:"discardAll",
            describe:["丢弃所有卡牌"],
            params:{pileName},
        }
    ])
}
