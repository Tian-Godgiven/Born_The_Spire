import type { Enemy } from "@/core/objects/target/Enemy"
import type { Player } from "@/core/objects/target/Player"
import type { Chara } from "@/core/objects/target/Target"
import { nanoid } from "nanoid"
import { ref, shallowRef } from "vue"
import { showDisplayMessage } from "@/ui/hooks/global/displayMessage"
import { showBattleDefeat } from "@/ui/hooks/interaction/battleDefeat"
import { isEnemy, isPlayer } from "@/core/utils/typeGuards"
import { nextTick } from "vue"
import { newLog } from "@/ui/hooks/global/log"
import { doEvent } from "../system/ActionEvent"
import { nowPlayer } from "./run"
import { endCharaTurn, startCharaTurn } from "@/core/effects/turn"

import { prepareEnemyIntents, executeAllEnemiesTurn } from "./enemyTurn"
import { cleanupAllDisabledOrgans } from "@/core/effects/organ/disableOrgan"



/** Battle 用于管理战斗流程，但不作为事件参与者参与事件系统 */
export class Battle {
    public readonly __key:string = nanoid()
    public readonly __id: string = nanoid()
    public readonly label: string = "Battle"
    public isEnded: boolean = false  // 战斗是否已结束
    public nowTurn: "player" | "enemy" = "player"  // 当前回合归属

    constructor(
        public turnNumber:number,
        private playerTeam:Chara[],
        private enemyTeam:Chara[]
    ){}

    getTeam(name:"player"|"enemy"): Chara[] {
        if(name == "player")
        return this.playerTeam
        else if(name == "enemy")
        return this.enemyTeam
        return []
    }

    getSelf(){
        return this
    }

    /**
     * 获取存活的敌人列表
     */
    getAliveEnemies(): Enemy[] {
        return this.enemyTeam.filter(chara =>{
            return isEnemy(chara) && chara.current.isAlive?.value === 1
        }) as Enemy[]
    }

    /**
     * 获取存活的玩家列表
     */
    getAlivePlayers(): Player[] {
        return this.playerTeam.filter(chara =>
            isPlayer(chara) && chara.current.isAlive?.value === 1
        ) as Player[]
    }

    /**
     * 通过实体 ID 获取实体对象
     * @param entityId 实体的 __id
     * @returns Entity 对象，如果未找到则返回 undefined
     */
    getEntityById(entityId: string): Chara | undefined {
        const allCharas = [...this.playerTeam, ...this.enemyTeam]
        return allCharas.find(chara => chara.__id === entityId)
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
            await startCharaTurn(chara,this)
        }
    }

    async endTurn(team:"player"|"enemy"){
        const theTeam = team=="player"?this.playerTeam:this.enemyTeam
        for(let chara of theTeam){
            await endCharaTurn(chara,this)
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

        // 3. 切换到敌人回合
        this.nowTurn = "enemy"
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
            await executeAllEnemiesTurn(sortedEnemies, player, this.turnNumber, this)

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
            await prepareEnemyIntents(aliveEnemies, player, this.turnNumber)
        }

        // 7. 切换到玩家回合
        this.nowTurn = "player"
        newLog(["===== 玩家回合开始 =====", `回合 ${this.turnNumber}`])

        // 直接开始回合，抽牌动画会自然展示
        await this.startTurn("player")
    }

    /**
     * 按行动顺序排序敌人
     */
    private sortEnemiesByActionOrder(enemies: Enemy[]): Enemy[] {
        return [...enemies].sort((a, b) => {
            const orderA = Number(a.status["action-order"]?.value ?? 0)
            const orderB = Number(b.status["action-order"]?.value ?? 0)
            return orderA - orderB  // 数字小的先行动
        })
    }

    /**
     * 结束战斗
     */
    endBattle(result: "player_win" | "player_lose") {
        if (this.isEnded) return

        this.isEnded = true

        // 处理主动能力系统的战斗结束
        this.handleActiveAbilitiesBattleEnd()

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

            // 显示战斗失败弹窗
            showBattleDefeat()
        }
    }

    /**
     * 处理主动能力系统的战斗结束
     */
    private async handleActiveAbilitiesBattleEnd() {
        // 处理玩家的主动能力战斗结束
        const alivePlayers = this.getAlivePlayers()
        for (const player of alivePlayers) {
            await player.handleActiveAbilitiesBattleEnd()
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
    if (playerTeam[0] && isPlayer(playerTeam[0])) {
        const player = playerTeam[0] as Player
    }

    const battle = new Battle(1,playerTeam,enemyTeam)
    nowBattle.value = battle

    nextTick(async ()=>{
        //当前玩家开始战斗（初始化状态）
        await nowPlayer.startBattle()

        // 触发 battleStart 事件
        // player 是 source 和 target，所以同时触发 make 和 take
        doEvent({
            key: "battleStart",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: []
        })

        // 给所有敌人也发送 battleStart（让敌人能收到 take battleStart）
        for (const enemy of enemyTeam) {
            doEvent({
                key: "battleStart",
                source: nowPlayer,
                medium: nowPlayer,  // medium 改为 nowPlayer，因为 battle 不再是 EventParticipant
                target: enemy,
                effectUnits: []
            })
        }

        // 准备敌人意图（第一回合）
        const aliveEnemies = battle.getAliveEnemies()
        const alivePlayers = battle.getAlivePlayers()
        if (aliveEnemies.length > 0 && alivePlayers.length > 0) {
            await prepareEnemyIntents(aliveEnemies, alivePlayers[0], battle.turnNumber)
        }

        //玩家阵容开始回合
        await battle.startTurn("player")
    })
    return battle
}
//结束当前战斗
export function endNowBattle(){
    // 清理所有禁用器官状态
    cleanupAllDisabledOrgans()
    nowBattle.value = null
}