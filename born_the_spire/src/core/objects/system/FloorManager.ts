/**
 * 楼层管理器
 * 负责追踪层级、房间历史，并根据层级配置和规则生成房间选项
 */

import { RoomType } from "@/core/objects/room/Room"
import {
    RoomWeightConfig,
    RoomGenerationContext,
    defaultRoomWeights,
    getAllRoomGenerationRules,
    RoomGenerationRule
} from "./RoomGenerationRules"
import { roomRegistry } from "@/static/registry/roomRegistry"
import { floorRegistry } from "@/static/registry/floorRegistry"
import type { FloorConfig } from "@/core/types/FloorConfig"

/**
 * 楼层管理器类
 */
export class FloorManager {
    private currentFloor: number = 0
    private currentFloorKey: string | null = null  // 当前层级key
    private roomHistory: RoomType[] = []

    /**
     * 获取当前楼层数
     */
    getCurrentFloor(): number {
        return this.currentFloor
    }

    /**
     * 获取当前层级key
     */
    getCurrentFloorKey(): string | null {
        return this.currentFloorKey
    }

    /**
     * 获取当前层级配置
     */
    getCurrentFloorConfig(): FloorConfig | null {
        if (!this.currentFloorKey) {
            return null
        }
        return floorRegistry.getFloor(this.currentFloorKey) || null
    }

    /**
     * 设置当前层级
     * @param floorKey 层级key
     */
    setCurrentFloor(floorKey: string): void {
        const floor = floorRegistry.getFloor(floorKey)
        if (!floor) {
            console.error(`[FloorManager] 未找到层级: ${floorKey}`)
            return
        }

        this.currentFloorKey = floorKey
        this.roomHistory = []  // 切换层级时重置房间历史
        console.log(`[FloorManager] 切换到层级: ${floorKey} (${floor.name})`)
    }

    /**
     * 前进到下一层房间
     */
    advanceFloor(): void {
        this.currentFloor++
        console.log(`[FloorManager] 前进到第 ${this.currentFloor} 层房间`)
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
     * 根据规则计算房间权重或固定房间列表
     * @param customRules 自定义规则（可选，来自层级配置）
     */
    private calculateRoomWeights(customRules?: RoomGenerationRule[]): RoomWeightConfig | RoomType | string[] {
        const context = this.generateContext()

        // 使用自定义规则或全局规则
        const rules = customRules || getAllRoomGenerationRules()

        let weights: RoomWeightConfig = { ...defaultRoomWeights }

        // 按优先级应用规则
        for (const rule of rules) {
            if (rule.condition(context)) {
                console.log(`[FloorManager] 应用规则: ${rule.name}`)
                const result = rule.effect(weights)

                // 如果规则返回固定房间列表（string[]）
                if (Array.isArray(result)) {
                    console.log(`[FloorManager] 固定房间列表:`, result)
                    return result
                }

                // 如果规则返回强制类型（string）
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
     * 生成下一层的房间选项
     * @param count 房间数量（默认3个）
     */
    generateNextFloorRoomOptions(count: number = 3): string[] {
        // 获取当前层级配置
        const floorConfig = this.getCurrentFloorConfig()

        // 使用层级特定的规则（如果有）
        const customRules = floorConfig?.roomGenerationRules
        const weightsOrTypeOrList = this.calculateRoomWeights(customRules)

        // 如果返回固定房间列表
        if (Array.isArray(weightsOrTypeOrList)) {
            return weightsOrTypeOrList
        }

        // 如果是强制类型，生成该类型的房间
        if (typeof weightsOrTypeOrList === "string") {
            const forcedType = weightsOrTypeOrList as RoomType
            return this.selectRoomsByType(forcedType, count, floorConfig)
        }

        // 否则根据权重随机生成
        const weights = weightsOrTypeOrList as RoomWeightConfig
        const selectedTypes: RoomType[] = []

        for (let i = 0; i < count; i++) {
            const roomType = this.selectRoomTypeByWeight(weights)
            selectedTypes.push(roomType)
        }

        // 为每个类型选择具体的房间配置
        const roomKeys: string[] = []
        for (const type of selectedTypes) {
            const roomKey = this.selectRandomRoomByType(type, floorConfig)
            if (roomKey) {
                roomKeys.push(roomKey)
            }
        }

        return roomKeys
    }

    /**
     * 根据类型选择多个房间
     * @param roomType 房间类型
     * @param count 数量
     * @param floorConfig 层级配置（可选，用于从层级房间池选择）
     */
    private selectRoomsByType(roomType: RoomType, count: number, floorConfig?: FloorConfig | null): string[] {
        let availableRooms: string[] = []

        // 优先从层级房间池选择
        if (floorConfig) {
            switch (roomType) {
                case "battle":
                    availableRooms = floorConfig.roomPools.battles
                    break
                case "event":
                    availableRooms = floorConfig.roomPools.events
                    break
                case "pool":
                    availableRooms = floorConfig.roomPools.pools
                    break
                case "blackStore":
                    availableRooms = floorConfig.roomPools.blackStores
                    break
            }
        }

        // 如果层级房间池为空，从全局房间注册表选择
        if (availableRooms.length === 0) {
            const roomConfigs = roomRegistry.getRoomConfigsByType(roomType)
            availableRooms = roomConfigs.map(config => config.key)
        }

        const selectedKeys: string[] = []
        for (let i = 0; i < count; i++) {
            if (availableRooms.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableRooms.length)
                selectedKeys.push(availableRooms[randomIndex])
            }
        }

        return selectedKeys
    }

    /**
     * 根据类型随机选择一个房间配置
     * @param roomType 房间类型
     * @param floorConfig 层级配置（可选，用于从层级房间池选择）
     */
    private selectRandomRoomByType(roomType: RoomType, floorConfig?: FloorConfig | null): string | null {
        let availableRooms: string[] = []

        // 优先从层级房间池选择
        if (floorConfig) {
            switch (roomType) {
                case "battle":
                    availableRooms = floorConfig.roomPools.battles
                    break
                case "event":
                    availableRooms = floorConfig.roomPools.events
                    break
                case "pool":
                    availableRooms = floorConfig.roomPools.pools
                    break
                case "blackStore":
                    availableRooms = floorConfig.roomPools.blackStores
                    break
            }
        }

        // 如果层级房间池为空，从全局房间注册表选择
        if (availableRooms.length === 0) {
            const roomConfigs = roomRegistry.getRoomConfigsByType(roomType)
            availableRooms = roomConfigs.map(config => config.key)
        }

        if (availableRooms.length === 0) {
            console.warn(`[FloorManager] 没有可用的 ${roomType} 类型房间`)
            return null
        }

        const randomIndex = Math.floor(Math.random() * availableRooms.length)
        return availableRooms[randomIndex]
    }

    /**
     * 重置楼层管理器
     */
    reset(): void {
        this.currentFloor = 0
        this.currentFloorKey = null
        this.roomHistory = []
        console.log("[FloorManager] 楼层管理器已重置")
    }
}

// 导出单例
export const floorManager = new FloorManager()
