import { Enemy } from "@/core/objects/target/Enemy"
import { Player } from "@/core/objects/target/Player"
import { Chara } from "@/core/objects/target/Target"
import { nanoid } from "nanoid"
import { ref } from "vue"
import { nowPlayer } from "./run"
import { endCharaTurn, startCharaTurn } from "@/core/effects/turn"

export class Battle {
    public readonly __key:string = nanoid()
    constructor(
        public turnNumber:number,
        private playerTeam:Chara[],
        private enemyTeam:Chara[]
    ){}
    getTeam(name:"player"|"enemy"){
        if(name == "player")
        return this.playerTeam
        else if(name == "enemy")
        return this.enemyTeam
    }
    getSelf(){
        return this
    }
    async startTurn(team:"player"|"enemy"){
        const theTeam = team=="player"?this.playerTeam:this.enemyTeam
        for(let chara of theTeam){
            startCharaTurn(chara,this)
        }
    }
    async endTurn(team:"player"|"enemy"){
        const theTeam = team=="player"?this.playerTeam:this.enemyTeam
        for(let chara of theTeam){
            endCharaTurn(chara,this)
        }
    }
}

//当前的玩家队伍
export const nowPlayerTeam:(Player|Chara)[] = []
export function addToPlayerTeam(Target:Player|Chara){
    nowPlayerTeam.push(Target)
}
//当前的敌方队伍
export const nowEnemyTeam:(Enemy|Chara)[] = []
export function addToEnemyTeam(target:Enemy|Chara){
    nowEnemyTeam.push(target)
}

//当前的战斗
export const nowBattle = ref<Battle|null>(null)
//开始新的战斗
export async function startNewBattle(playerTeam:(Player|Chara)[],enemyTeam:(Enemy|Chara)[]):Promise<Battle>{
    const battle = new Battle(1,playerTeam,enemyTeam)
    nowBattle.value = battle   
    //当前玩家开始战斗
    nowPlayer.startBattle()
    //玩家阵容开始回合
    battle.startTurn("player")
    return battle
}
//结束当前战斗
export function endNowBattle(){
    nowBattle.value = null
}