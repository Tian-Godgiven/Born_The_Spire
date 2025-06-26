import { Battle } from "@/objects/game/battle";
import { turnEndDiscardCard } from "@/objects/item/Card";
import { doBehavior } from "@/objects/system/Behavior";
import { emptyEnergy, getEnergy } from "@/static/list/system/behavior/energy";
import { Player } from "@/objects/target/player/Player";
import { Chara } from "@/objects/target/Target";

//角色开始回合
export function startCharaTurn(chara:Chara,battle:Battle){
    //如果是玩家
    if(chara instanceof Player){
        startPlayerTurn(chara,battle)
        return;
    }
    startTurn(chara,battle)
}
//角色结束回合
export function endCharaTurn(chara:Chara,battle:Battle){
    //如果是玩家
    if(chara instanceof Player){
        endPlayerTurn(chara,battle)
        return;
    }
    endTurn(chara,battle)
}

//玩家开始回合
export function startPlayerTurn(player:Player,battle:Battle){
    startTurn(player,battle,()=>{
        const start = player.turn.status.start
        //恢复能量
        getEnergy(player,player,player,start.getEnergy)
        //抽牌
        player.drawCard(start.drawCard,player)
    })
}
//结束玩家的回合
export function endPlayerTurn(player:Player,battle:Battle){
    endTurn(player,battle,()=>{
        const end = player.turn.status.end
        //清空能量
        emptyEnergy(player,player,player)
        //丢弃手牌
        const handPile = player.cardPiles.handPile
        switch(end.discard.type){
            //丢弃所有手牌
            case "all":{
                for (let i = handPile.length - 1; i >= 0; i--) {
                    const card = handPile[i];
                    turnEndDiscardCard(handPile,card,player)
                }
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
    })
}

//开始回合行为
export function startTurn(chara:Chara,battle:Battle,doWhat?:()=>void){
    doBehavior("turnStart",chara,chara,chara,{turn:battle.turnNumber},doWhat)
}
//结束回合行为
export function endTurn(chara:Chara,battle:Battle,doWhat?:()=>void){
    doBehavior("turnEnd",chara,chara,chara,{turn:battle.turnNumber},doWhat)
}

