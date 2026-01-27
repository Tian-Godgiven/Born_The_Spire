import { Battle } from "@/core/objects/game/battle";
import { doEvent } from "@/core/objects/system/ActionEvent";
import { Player } from "@/core/objects/target/Player";
import { Chara } from "@/core/objects/target/Target";
import { EffectUnit } from "../objects/system/effect/EffectUnit";

//角色开始回合
export async function startCharaTurn(chara:Chara,battle:Battle){
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
export async function startPlayerTurn(player:Player,battle:Battle){
    startTurn(player,battle)
}
//结束玩家的回合
export function endPlayerTurn(player:Player,battle:Battle){
    // 弃牌逻辑已通过触发器系统实现（在 Player.startBattle 中添加）
    endTurn(player,battle)
}

//开始回合行为
export async function startTurn(chara:Chara,battle:Battle,effectUnits:EffectUnit[]=[],doWhat?:()=>void){
    doEvent({
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
    doEvent({
        key:"turnEnd",
        source:chara,
        medium:chara,
        target:chara,
        info:{turn:battle.turnNumber},  
        doWhat,
        effectUnits
    })
}


