import { Card, discardCard, exhaustCard } from "../item/Card";
import { Player } from "../target/Player";
import { Entity } from "./Entity";

type TurnEnd = {
    discard:{
        type:"all"
    }|{
        type:"choose"|"random",//选择或随机选择丢弃卡牌
        number:number
    }
}

//回合对象，回合对象是回合行为的媒介
//包括：回合开始时抽牌和回复能量，回合结束时弃掉所有手牌
//每场战斗都会创建一个回合对象
export class Turn extends Entity{
    public turnEnd:TurnEnd = {
        discard:{type:"all"}//弃牌数量
    }
    public turnStart = {
        getEnergy:"max",//获得能量数量
        draw:5//抽牌数量
    }
    end(player:Player){
        const handPile = player.cardPiles.handPile
        switch(this.turnEnd.discard.type){
            //丢弃所有手牌
            case "all":{
                handPile.forEach(card=>{
                    turnEndDiscardCard(handPile,card,player,this)
                })
                break;
            }
            case "choose":{
                //未完成
                break
            }
            case "random":{
                //未完成
                break
            }
        }
    }
}

//因回合结束而丢弃卡牌
function turnEndDiscardCard(pile:Card[],card:Card,player:Player,turn:Turn){
    //如果卡牌具备虚无词条，则会进入消耗堆
    if(card.haveEntry("void")){
        exhaustCard(pile,card,player,card)
    }
    //否则进入弃牌堆
    else{
        discardCard(pile,card,player,turn)
    }
}