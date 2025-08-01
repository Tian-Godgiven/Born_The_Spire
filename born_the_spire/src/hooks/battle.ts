import { Enemy } from "@/objects/target/Enemy"
import { Player } from "@/objects/target/Player"
import { Chara } from "@/objects/target/Target"
import { nanoid } from "nanoid"
import { ref } from "vue"
import { nowPlayer } from "./run"
import { endCharaTurn, startCharaTurn } from "@/effects/turn"

export class Battle {
    public readonly __key:string = nanoid()
    constructor(
        public turnNumber:number,
        private playerTeam:Chara[],
        private enemyTeam:Chara[]
    ){}
    getTeam(name:"player"|"enemey"){
        if(name == "player")
        return this.playerTeam
        else if(name == "enemey")
        return this.enemyTeam
    }
    getSelf(){
        return this
    }
    startTurn(team:"player"|"enemy"){
        const theTeam = team=="player"?this.playerTeam:this.enemyTeam
        theTeam.forEach(chara=>{
            //开始对象的回合
            startCharaTurn(chara,this)
        })
    }
    endTurn(team:"player"|"enemy"){
        const theTeam = team=="player"?this.playerTeam:this.enemyTeam
        theTeam.forEach(chara=>{
            endCharaTurn(chara,this)
        })
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
export function startNewBattle(playerTeam:(Player|Chara)[],enemyTeam:(Enemy|Chara)[]):Battle{
    const battle = new Battle(1,playerTeam,enemyTeam)
    nowBattle.value = battle   
    nowPlayer.startBattle()
    //玩家阵容开始回合
    battle.startTurn("player")
    return battle
}