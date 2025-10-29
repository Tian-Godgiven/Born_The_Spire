import { Battle } from "@/core/objects/game/battle";
import { doEvent } from "@/core/objects/system/ActionEvent";
import { Player } from "@/core/objects/target/Player";
import { Chara } from "@/core/objects/target/Target";
import { EffectUnit } from "../objects/system/effect/EffectUnit";

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
    const getEnergyEffect:EffectUnit = {
        key:"getEnergy",
        describe:["恢复3点能量"],
        params:{value:3}
    }
    const drawCardEffect:EffectUnit = {
        key:"drawFromDrawPile",
        describe:["抽5张手牌"],
        params:{value:5}
    }
    startTurn(player,battle,[getEnergyEffect,drawCardEffect])
}
//结束玩家的回合
export function endPlayerTurn(player:Player,battle:Battle){
    //清空能量
    const emptyEnergyEffect:EffectUnit = {
        key:"emptyEnergy",
        describe:["清空能量"],
        params:{}
    }
    //丢弃手牌
        // const handPile = player.cardPiles.handPile
        // switch(end.discard.type){
        //     //丢弃所有手牌
        //     case "all":{
        //         for (let i = handPile.length - 1; i >= 0; i--) {
        //             const card = handPile[i];
        //             turnEndDiscardCard(handPile,card,player)
        //         }
        //         break;
        //     }
        //     case "choose":{
        //         //未完成
        //         break
        //     }
        //     case "random":{
        //         //未完成
        //         break
        //     }
        // }
    endTurn(player,battle,[emptyEnergyEffect],()=>{
    })
}

//开始回合行为
export async function startTurn(chara:Chara,battle:Battle,effectUnits:EffectUnit[]=[],doWhat?:()=>void){
    await doEvent({
        key:"turnStart",
        source:chara,
        medium:chara,
        target:chara,
        info:{turn:battle.turnNumber},  
        doWhat,
        effectUnits
    })
}
//结束回合行为
export async function endTurn(chara:Chara,battle:Battle,effectUnits:EffectUnit[]=[],doWhat?:()=>void){
    await doEvent({
        key:"turnEnd",
        source:chara,
        medium:chara,
        target:chara,
        info:{turn:battle.turnNumber},  
        doWhat,
        effectUnits
    })
}


