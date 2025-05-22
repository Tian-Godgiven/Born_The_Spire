import { Enemy } from "@/objects/target/Enemy"
import { Player } from "@/objects/target/Player"
import { Chara, Target } from "@/objects/target/Target"
import { nanoid } from "nanoid"
import { ref } from "vue"
import { nowPlayer } from "./run"

export class Battle {
    public readonly __key:string = nanoid()
    
    constructor(
        public turn:number,
        private playerTeam:Chara[],
        private enemyTeam:Chara[]
    ){}
    getTeam(name:"player"|"enemey"){
        if(name == "player")
        return this.playerTeam
        else if(name == "enemey")
        return this.enemyTeam
    }
}

//当前的玩家队伍
export const nowPlayerTeam:(Player|Target)[] = []
export function addToPlayerTeam(Target:Player|Target){
    nowPlayerTeam.push(Target)
}
//当前的敌方队伍
export const nowEnemyTeam:(Enemy|Target)[] = []
export function addToEnemyTeam(target:Enemy|Target){
    nowEnemyTeam.push(target)
}

//当前的战斗
export const nowBattle = ref<Battle|null>(null)
//开始新的战斗
export function startNewBattle(playerTeam:(Player|Chara)[],enemyTeam:(Enemy|Chara)[]):Battle{
    const battle = new Battle(1,playerTeam,enemyTeam)
    nowBattle.value = battle   
    nowPlayer.value.startBattle()
    startTurn()
    return battle
}
//玩家回合开始
export function startTurn(){
    //抽牌
    nowPlayer.value.startTurn()
}
//回合结束
export function endTurn(){

}