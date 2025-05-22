import { Card } from "@/objects/item/Card";
import { nowPlayer } from "./run";

type defaultCardGroupName = "draw"//抽牌堆
|"discard"//弃牌堆
|"hand"//手牌
|"exhaust"//消耗堆

//显示卡组弹窗
export function showCardGroup(cardGroup?:Card[]|defaultCardGroupName){
    if(!nowPlayer.value){
        console.error("当前没有玩家")
        return false
    }
    let cardList:Card[] =[]
    //默认情况显示角色的卡组
    if(!cardGroup){
        cardList = nowPlayer.value?.getCardGroup()??[]
    }
    //其他情况显示对应的牌堆
    else{
        switch(cardGroup){
            case "draw":
                cardList = nowPlayer.value.cardPiles.drawPile;
                break;
            case "hand":
                cardList = nowPlayer.value.cardPiles.handPile;
                break;
            case "discard":
                cardList = nowPlayer.value.cardPiles.discardPile;
                break;
            case "exhaust":
                cardList = nowPlayer.value.cardPiles.exhaustPile;
                break;
            default:
                cardList = cardGroup
                break;
        }
    }
    
}