import { Card } from "@/objects/Card";
import { nowPlayer } from "./run";

type defaultCardGroupName = "draw"//抽牌堆
|"discard"//弃牌堆
|"hand"//手牌
|"exhaust"//消耗堆

//显示卡组弹窗
export function showCardGroup(cardGroup?:Card[]|defaultCardGroupName){
    let _cardList :Card[] =[]
    //默认情况显示角色持有的卡牌
    if(!cardGroup){
        _cardList = nowPlayer.value.getCardGroup()
    }
    else{
        //如果是名称
        switch(cardGroup){
            case "draw":
                _cardList = nowPlayer.value.cardPiles.drawPile;
                break;
            case "hand":
                _cardList = nowPlayer.value.cardPiles.handPile;
                break;
            case "discard":
                _cardList = nowPlayer.value.cardPiles.discardPile;
                break;
            case "exhaust":
                _cardList = nowPlayer.value.cardPiles.exhaustPile;
                break;
            default:
                _cardList = cardGroup
        }
    }

    // TODO: 实现弹窗显示逻辑
    void _cardList  // 抑制未使用警告
}