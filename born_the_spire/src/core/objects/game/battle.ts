import { Enemy } from "@/core/objects/target/Enemy"
import { Player } from "@/core/objects/target/Player"
import { Chara } from "@/core/objects/target/Target"
import { nanoid } from "nanoid"
import { ref } from "vue"
import { nowPlayer } from "./run"
import { endCharaTurn, startCharaTurn } from "@/core/effects/turn"
import { nextTick } from "vue"
import { doEvent } from "../system/ActionEvent"
import { prepareEnemyIntents, executeAllEnemiesTurn } from "./enemyTurn"
import { newLog } from "@/ui/hooks/global/log"
import { showDisplayMessage } from "@/ui/hooks/global/displayMessage"

export class Battle {
    public readonly __key:string = nanoid()
    public isEnded: boolean = false  // 战斗是否已结束

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

    /**
     * 获取存活的敌人列表
     */
    getAliveEnemies(): Enemy[] {
        return this.enemyTeam.filter(chara =>
            chara instanceof Enemy && chara.current.isAlive?.value === 1
        ) as Enemy[]
    }

    /**
     * 获取存活的玩家列表
     */
    getAlivePlayers(): Player[] {
        return this.playerTeam.filter(chara =>
            chara instanceof Player && chara.current.isAlive?.value === 1
        ) as Player[]
    }

    /**
     * 检查战斗是否应该结束
     * @returns "player_win" | "player_lose" | null
     */
    checkBattleEnd(): "player_win" | "player_lose" | null {
        const alivePlayers = this.getAlivePlayers()
        const aliveEnemies = this.getAliveEnemies()

        if (alivePlayers.length === 0) {
            return "player_lose"
        }

        if (aliveEnemies.length === 0) {
            return "player_win"
        }

        return null
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

    /**
     * 结束玩家回合，开始敌人回合
     */
    async endPlayerTurnAndStartEnemyTurn() {
        if (this.isEnded) return

        newLog(["===== 玩家回合结束 ====="])

        // 1. 结束玩家回合
        await this.endTurn("player")

        // 2. 检查玩家是否死亡
        const battleResult = this.checkBattleEnd()
        if (battleResult === "player_lose") {
            this.endBattle("player_lose")
            return
        }

        // 3. 敌人回合
        newLog(["===== 敌人回合开始 ====="])
        const aliveEnemies = this.getAliveEnemies()
        const player = this.getAlivePlayers()[0]  // 假设单个玩家

        if (player && aliveEnemies.length > 0) {
            // 显示"敌人行动"提示（1.5秒），然后等待1.5秒
            showDisplayMessage("敌人行动", 1500)
            await new Promise(resolve => setTimeout(resolve, 3000))

            // 按行动顺序排序敌人
            const sortedEnemies = this.sortEnemiesByActionOrder(aliveEnemies)

            // 执行所有敌人的回合
            await executeAllEnemiesTurn(sortedEnemies, player, this.turnNumber)

            // 4. 检查战斗是否结束
            const afterEnemyResult = this.checkBattleEnd()
            if (afterEnemyResult) {
                this.endBattle(afterEnemyResult)
                return
            }

            // 显示"敌人回合结束"提示（1.5秒），然后等待1.5秒
            showDisplayMessage("敌人回合结束", 1500)
            await new Promise(resolve => setTimeout(resolve, 3000))
        }

        // 5. 回合数+1
        this.turnNumber++

        // 6. 准备下回合敌人意图
        if (player && aliveEnemies.length > 0) {
            prepareEnemyIntents(aliveEnemies, player, this.turnNumber)
        }

        // 7. 开始新的玩家回合
        newLog(["===== 玩家回合开始 =====", `回合 ${this.turnNumber}`])

        // 显示"回合开始"提示（1.5秒），然后等待1.5秒
        showDisplayMessage("回合开始", 1500)
        await new Promise(resolve => setTimeout(resolve, 3000))

        await this.startTurn("player")
    }

    /**
     * 按行动顺序排序敌人
     */
    private sortEnemiesByActionOrder(enemies: Enemy[]): Enemy[] {
        return [...enemies].sort((a, b) => {
            const orderA = a.status["action-order"]?.value ?? 0
            const orderB = b.status["action-order"]?.value ?? 0
            return orderA - orderB  // 数字小的先行动
        })
    }

    /**
     * 结束战斗
     */
    private endBattle(result: "player_win" | "player_lose") {
        if (this.isEnded) return

        this.isEnded = true

        if (result === "player_win") {
            newLog(["===== 战斗胜利 ====="])
            doEvent({
                key: "battleEnd",
                source: nowPlayer,
                medium: nowPlayer,
                target: nowPlayer,
                info: { result: "win" },
                effectUnits: []
            })
        } else {
            newLog(["===== 战斗失败 ====="])
            doEvent({
                key: "battleEnd",
                source: nowPlayer,
                medium: nowPlayer,
                target: nowPlayer,
                info: { result: "lose" },
                effectUnits: []
            })
        }

        // TODO: 触发战斗结束的UI和逻辑
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

    nextTick(async ()=>{
        //当前玩家开始战斗（初始化状态）
        nowPlayer.startBattle()

        // 触发 battleStart 事件
        console.log('[startNewBattle] 触发 battleStart 事件')
        doEvent({
            key: "battleStart",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: []
        })

        // 准备敌人意图（第一回合）
        const aliveEnemies = battle.getAliveEnemies()
        const alivePlayers = battle.getAlivePlayers()
        if (aliveEnemies.length > 0 && alivePlayers.length > 0) {
            prepareEnemyIntents(aliveEnemies, alivePlayers[0], battle.turnNumber)
        }

        //玩家阵容开始回合
        await battle.startTurn("player")
    })
    return battle
}
//结束当前战斗
export function endNowBattle(){
    nowBattle.value = null
}