/**
 * 楼层管理器
 * 负责追踪楼层、房间历史，并根据规则生成房间选项
 */

import { RoomType } from "@/core/objects/room/Room"
import {
    RoomWeightConfig,
    RoomGenerationContext,
    defaultRoomWeights,
    getAllRoomGenerationRules
} from "./RoomGenerationRules"
import { roomRegistry } from "@/static/registry/roomRegistry"
import { allRoomConfigs } from "@/static/list/room/roomList"

/**
 * 楼层管理器类
 */
export class FloorManager {
    private currentFloor: number = 0
    private roomHistory: RoomType[] = []

    /**
     * 获取当前楼层
     */
    getCurrentFloor(): number {
        return this.currentFloor
    }

    /**
     * 前进到下一层
     */
    advanceFloor(): void {
        this.currentFloor++
        console.log(`[FloorManager] 前进到第 ${this.currentFloor} 层`)
    }

    /**
     * 记录进入的房间
     */
    recordRoom(roomType: RoomType): void {
        this.roomHistory.push(roomType)
        console.log(`[FloorManager] 记录房间: ${roomType}`)
    }

    /**
     * 获取房间历史
     */
    getRoomHistory(): RoomType[] {
        return [...this.roomHistory]
    }

    /**
     * 生成房间生成上下文
     */
    private generateContext(): RoomGenerationContext {
        const lastRoomType = this.roomHistory.length > 0
            ? this.roomHistory[this.roomHistory.length - 1]
            : null

        // 计算连续战斗次数
        let consecutiveBattles = 0
        for (let i = this.roomHistory.length - 1; i >= 0; i--) {
            if (this.roomHistory[i] === "battle") {
                consecutiveBattles++
            } else {
                break
            }
        }

        // 计算连续非战斗次数
        let consecutiveNonBattles = 0
        for (let i = this.roomHistory.length - 1; i >= 0; i--) {
            if (this.roomHistory[i] !== "battle") {
                consecutiveNonBattles++
            } else {
                break
            }
        }

        // 计算距离上次特定房间的楼层数
        const floorsSinceLastPool = this.getFloorsSinceLastRoomType("pool")
        const floorsSinceLastBlackStore = this.getFloorsSinceLastRoomType("blackStore")
        const floorsSinceLastEvent = this.getFloorsSinceLastRoomType("event")

        return {
            currentFloor: this.currentFloor,
            roomHistory: this.getRoomHistory(),
            lastRoomType,
            consecutiveBattles,
            consecutiveNonBattles,
            floorsSinceLastPool,
            floorsSinceLastBlackStore,
            floorsSinceLastEvent
        }
    }

    /**
     * 获取距离上次特定房间类型的楼层数
     */
    private getFloorsSinceLastRoomType(roomType: RoomType): number {
        for (let i = this.roomHistory.length - 1; i >= 0; i--) {
            if (this.roomHistory[i] === roomType) {
                return this.roomHistory.length - 1 - i
            }
        }
        return this.roomHistory.length  // 从未出现过
    }

    /**
     * 根据规则计算房间权重
     */
    private calculateRoomWeights(): RoomWeightConfig | RoomType {
        const context = this.generateContext()
        const rules = getAllRoomGenerationRules()

        let weights: RoomWeightConfig = { ...defaultRoomWeights }

        // 按优先级应用规则
        for (const rule of rules) {
            if (rule.condition(context)) {
                console.log(`[FloorManager] 应用规则: ${rule.name}`)
                const result = rule.effect(weights)

                // 如果规则返回强制类型，直接返回
                if (typeof result === "string") {
                    console.log(`[FloorManager] 强制房间类型: ${result}`)
                    return result as RoomType
                }

                // 否则更新权重
                weights = result
            }
        }

        return weights
    }

    /**
     * 根据权重随机选择房间类型
     */
    private selectRoomTypeByWeight(weights: RoomWeightConfig): RoomType {
        const totalWeight = weights.battle + weights.event + weights.pool + weights.blackStore
        let random = Math.random() * totalWeight

        if (random < weights.battle) {
            return "battle"
        }
        random -= weights.battle

        if (random < weights.event) {
            return "event"
        }
        random -= weights.event

        if (random < weights.pool) {
            return "pool"
        }

        return "blackStore"
    }

    /**
     * 生成下一层的房间选项（3个）
     */
    generateNextFloorRoomOptions(count: number = 3): string[] {
        const weightsOrType = this.calculateRoomWeights()

        // 如果是强制类型，生成该类型的房间
        if (typeof weightsOrType === "string") {
            const forcedType = weightsOrType as RoomType
            return this.selectRoomsByType(forcedType, count)
        }

        // 否则根据权重随机生成
        const weights = weightsOrType as RoomWeightConfig
        const selectedTypes: RoomType[] = []

        for (let i = 0; i < count; i++) {
            const roomType = this.selectRoomTypeByWeight(weights)
            selectedTypes.push(roomType)
        }

        // 为每个类型选择具体的房间配置
        const roomKeys: string[] = []
        for (const type of selectedTypes) {
            const roomKey = this.selectRandomRoomByType(type)
            if (roomKey) {
                roomKeys.push(roomKey)
            }
        }

        return roomKeys
    }

    /**
     * 根据类型选择多个房间
     */
    private selectRoomsByType(roomType: RoomType, count: number): string[] {
        const availableRooms = allRoomConfigs.filter(config => config.type === roomType)
        const selectedKeys: string[] = []

        for (let i = 0; i < count; i++) {
            if (availableRooms.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableRooms.length)
                selectedKeys.push(availableRooms[randomIndex].key)
            }
        }

        return selectedKeys
    }

    /**
     * 根据类型随机选择一个房间配置
     */
    private selectRandomRoomByType(roomType: RoomType): string | null {
        const availableRooms = allRoomConfigs.filter(config => config.type === roomType)

        if (availableRooms.length === 0) {
            console.warn(`[FloorManager] 没有可用的 ${roomType} 类型房间`)
            return null
        }

        const randomIndex = Math.floor(Math.random() * availableRooms.length)
        return availableRooms[randomIndex].key
    }

    /**
     * 重置楼层管理器
     */
    reset(): void {
        this.currentFloor = 0
        this.roomHistory = []
        console.log("[FloorManager] 楼层管理器已重置")
    }
}

// 导出单例
export const floorManager = new FloorManager()
