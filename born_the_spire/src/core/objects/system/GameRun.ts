import { nanoid } from "nanoid"
import { Room } from "../room/Room"
import { floorManager } from "./FloorManager"
import { cloneDeep } from "lodash"
import { SeededRandom } from "@/core/utils/SeededRandom"

/**
 * 玩家状态快照
 * 用于房间重试时恢复玩家状态
 */
interface PlayerSnapshot {
    // Current 值
    currentValues: Record<string, any>
    // 卡牌堆
    cardPiles: {
        drawPile: any[]
        handPile: any[]
        discardPile: any[]
        exhaustPile: any[]
    }
    // 其他需要保存的状态可以在这里添加
}

//每一局游戏
export class GameRun{
    public towerLevel:number = 0 //当前层数
    public towerStage:string = "bottom"//当前阶层
    public towerFire:number = 0//当前进阶
    public __key:string = nanoid()

    // 种子系统
    public seed: string  // 游戏种子
    public rng: SeededRandom  // 全局随机数生成器

    // 房间相关
    public roomHistory: Room[] = []  // 已完成的房间历史
    public currentRoom: Room | null = null  // 当前所在房间（不使用 ref，由外层 reactive 提供响应式）

    // 玩家状态快照（用于房间重试）
    private playerSnapshot: PlayerSnapshot | null = null

    // 楼层管理器
    public floorManager = floorManager

    constructor(seed?: string){
        // 初始化种子系统
        this.seed = seed || Date.now().toString()
        this.rng = new SeededRandom(this.seed)

        // 重置楼层管理器
        this.floorManager.reset()
        this.floorManager.resetMap()
    }

    /**
     * 进入一个房间
     */
    async enterRoom(room: Room) {
        this.currentRoom = room
        room.state = "active"

        // 记录房间类型到楼层管理器
        this.floorManager.recordRoom(room.type)

        // 前进楼层
        this.floorManager.advanceFloor()
        this.towerLevel = this.floorManager.getCurrentFloor()

        // 保存玩家状态快照（在进入房间前）
        await this.savePlayerSnapshot()

        await room.enter()
    }

    /**
     * 完成当前房间
     */
    async completeCurrentRoom() {
        const room = this.currentRoom
        if (!room) {
            console.warn("[GameRun] 没有正在进行的房间")
            return
        }

        // 防止重复完成
        if (room.state === "completed") {
            console.warn("[GameRun] 房间已完成，跳过重复完成")
            return
        }

        room.state = "completed"
        await room.complete()

        // 将房间加入历史记录
        this.roomHistory.push(room)

        // 完成地图节点（解锁下一层）
        const currentMap = this.floorManager.getCurrentMap()
        if (currentMap) {
            currentMap.completeCurrentNode()
        }

        await room.exit()

        // 清除快照（房间完成后不再需要）
        this.playerSnapshot = null
    }

    /**
     * 离开当前房间（不完成）
     */
    async exitCurrentRoom() {
        const room = this.currentRoom
        if (!room) {
            return
        }

        await room.exit()
        this.currentRoom = null
    }

    /**
     * 保存玩家状态快照
     */
    private async savePlayerSnapshot() {
        // 动态导入避免循环依赖
        const { nowPlayer } = await import("../game/run")

        if (!nowPlayer) {
            console.warn("[GameRun] 无法保存快照：玩家不存在")
            return
        }

        // 保存 Current 值
        const currentValues: Record<string, any> = {}
        for (const key in nowPlayer.current) {
            const current = nowPlayer.current[key]
            if (current && typeof current.value !== 'undefined') {
                currentValues[key] = current.value
            }
        }

        // 深拷贝卡牌堆（避免引用问题）
        const cardPiles = cloneDeep({
            drawPile: nowPlayer.cardPiles?.drawPile || [],
            handPile: nowPlayer.cardPiles?.handPile || [],
            discardPile: nowPlayer.cardPiles?.discardPile || [],
            exhaustPile: nowPlayer.cardPiles?.exhaustPile || []
        })

        this.playerSnapshot = {
            currentValues,
            cardPiles
        }

    }

    /**
     * 恢复玩家状态快照
     */
    public async restorePlayerSnapshot() {
        if (!this.playerSnapshot) {
            console.warn("[GameRun] 没有可用的玩家状态快照")
            return false
        }

        // 动态导入避免循环依赖
        const { nowPlayer } = await import("../game/run")

        if (!nowPlayer) {
            console.warn("[GameRun] 无法恢复快照：玩家不存在")
            return false
        }

        // 恢复 Current 值（直接设置，不触发回调）
        for (const key in this.playerSnapshot.currentValues) {
            const value = this.playerSnapshot.currentValues[key]
            const current = nowPlayer.current[key]
            if (current) {
                // 直接设置 value，绕过 changeCurrentValue 的回调机制
                current.value = value
            }
        }

        // 恢复卡牌堆（深拷贝避免引用问题）
        if (nowPlayer.cardPiles) {
            nowPlayer.cardPiles.drawPile = cloneDeep(this.playerSnapshot.cardPiles.drawPile)
            nowPlayer.cardPiles.handPile = cloneDeep(this.playerSnapshot.cardPiles.handPile)
            nowPlayer.cardPiles.discardPile = cloneDeep(this.playerSnapshot.cardPiles.discardPile)
            nowPlayer.cardPiles.exhaustPile = cloneDeep(this.playerSnapshot.cardPiles.exhaustPile)
        }

        return true
    }

    /**
     * 获取已完成的房间数量
     */
    getCompletedRoomCount(): number {
        return this.roomHistory.length
    }

    /**
     * 获取当前层级
     */
    getCurrentLayer(): number {
        return this.towerLevel
    }

    /**
     * 前进到下一层
     */
    advanceToNextLayer() {
        // 楼层管理器会在 enterRoom 时自动前进
        // 这个方法保留用于兼容性
    }

    /**
     * 生成下一层的房间选项
     */
    generateNextFloorRoomOptions(count: number = 3): string[] {
        return this.floorManager.generateNextFloorRoomOptions(count)
    }
}

