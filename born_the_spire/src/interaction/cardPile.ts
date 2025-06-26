import { Card } from "@/objects/item/Card";
import { nowPlayer } from "../objects/game/run";
import { showPopUp } from "../hooks/global/popUp";
import { shallowRef } from "vue";
import CardPile from "@/page/popUp/CardPile.vue";

type defaultCardPileName = "draw"//抽牌堆
|"discard"//弃牌堆
|"hand"//手牌
|"exhaust"//消耗堆

//显示卡组弹窗
export function showCardPile(cardPile?:Card[]|defaultCardPileName){
    if(!nowPlayer){
        console.error("当前没有玩家")
        return false
    }
    let cardList:Card[] =[]
    let pileName:string
    //默认情况显示角色的卡组
    if(!cardPile){
        cardList = nowPlayer?.getCardGroup()??[]
        pileName = "卡组"
    }
    //其他情况显示对应的牌堆
    else{
        switch(cardPile){
            case "draw":
                pileName = "抽牌堆"
                cardList = nowPlayer.cardPiles.drawPile;
                break;
            case "hand":
                pileName = "手牌堆"
                cardList = nowPlayer.cardPiles.handPile;
                break;
            case "discard":
                pileName = "弃牌堆"
                cardList = nowPlayer.cardPiles.discardPile;
                break;
            case "exhaust":
                pileName = "消耗堆"
                cardList = nowPlayer.cardPiles.exhaustPile;
                break;
            default:
                pileName = "牌堆"
                cardList = cardPile
                break;
        }
    }
    
    //显示牌堆弹窗
    showPopUp({
        mask:true,
        vue:shallowRef(CardPile),
        props:{
            cardPile:cardList,
            pileName
        }
    })
    
}