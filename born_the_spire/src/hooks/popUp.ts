import { Card } from "@/class/Card";
import { nowPlayer } from "./run";

type defaultCardGroupName = "draw"//抽牌堆
|"discard"//弃牌堆
|"hand"//手牌
|"exhaust"//消耗堆

//显示卡组弹窗
export function showCardGroup(cardGroup?:Card[]|defaultCardGroupName){
    let cardList :Card[] =[]
    //默认情况显示角色持有的卡牌
    if(!cardGroup){
        cardList = nowPlayer.value.getCardGroup()
    }
    else{
        //如果是名称
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
        }
    }
    
}