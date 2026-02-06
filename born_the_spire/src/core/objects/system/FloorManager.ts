/**
 * 楼层管理器
 * 负责管理楼层地图和房间历史
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
import type { FloorConfig, ExhaustionStrategy } from "@/core/types/FloorConfig"
import { FloorMap, MapGenerator, type MapNode } from "./map"
import type { FloorMapConfig } from "@/core/types/FloorMapConfig"
import { defaultFloorMapConfig } from "@/core/types/FloorMapConfig"

/**
 * 楼层管理器类
 */
export class FloorManager {
    private currentFloor: number = 0
    private currentFloorKey: string | null = null  // 当前层级key
    private roomHistory: RoomType[] = []
    private usedRoomKeys: Set<string> = new Set()  // 已使用的房间key（用于不重复策略）

    // 新增：地图系统
    private currentMap: FloorMap | null = null
    private mapGenerator: MapGenerator | null = null  // 保存生成器实例用于延迟分配

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
    }

    /**
     * 前进到下一层房间
     */
    advanceFloor(): void {
        this.currentFloor++
    }

    /**
     * 记录进入的房间
     */
    recordRoom(roomType: RoomType, roomKey?: string): void {
        this.roomHistory.push(roomType)
        if (roomKey) {
            this.usedRoomKeys.add(roomKey)
        }
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
     * @deprecated 使用地图系统代替。此方法仅用于兼容旧系统。
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
                const result = rule.effect(weights)

                // 如果规则返回固定房间列表（string[]）
                if (Array.isArray(result)) {
                    return result
                }

                // 如果规则返回强制类型（string）
                if (typeof result === "string") {
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
     * @deprecated 使用地图系统代替。此方法仅用于兼容旧系统。
     * @param count 房间数量（默认3个）
     * @param player 玩家对象（用于条件检查）
     */
    generateNextFloorRoomOptions(count: number = 3, player?: any): string[] {
        // 获取当前层级配置
        const floorConfig = this.getCurrentFloorConfig()

        // 优先检查 roomLayout（最高优先级）
        if (floorConfig?.roomLayout) {
            const layoutRooms = this.selectRoomsFromLayout(floorConfig.roomLayout, player)
            if (layoutRooms.length > 0) {
                return layoutRooms.slice(0, count)  // 限制数量
            }
        }

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
            return this.selectRoomsByType(forcedType, count, floorConfig, player)
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
            const roomKey = this.selectRandomRoomByType(type, floorConfig, player)
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
     * @param player 玩家对象（用于条件检查）
     */
    private selectRoomsByType(roomType: RoomType, count: number, floorConfig?: FloorConfig | null, player?: any): string[] {
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

        // 应用 availableCondition 过滤
        if (player) {
            availableRooms = this.filterAvailableRooms(availableRooms, player)
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
     * @param player 玩家对象（用于条件检查）
     */
    private selectRandomRoomByType(roomType: RoomType, floorConfig?: FloorConfig | null, player?: any): string | null {
        // 获取可用房间列表
        let availableRooms = this.getAvailableRooms(roomType, floorConfig || null, player)

        // 检测池是否耗尽
        if (availableRooms.length === 0) {
            // 获取耗尽策略（从 exhaustionStrategies 配置中获取）
            const strategy = floorConfig?.exhaustionStrategies?.[roomType] || { type: "error" as const }

            // 应用耗尽策略
            return this.applyExhaustionStrategy(roomType, strategy, floorConfig || null, player)
        }

        // 随机选择一个房间
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
        this.usedRoomKeys.clear()
    }

    /**
     * 获取当前步数（当前层级已进入的房间数量）
     */
    getCurrentStep(): number {
        return this.roomHistory.length + 1  // +1 因为是下一个要进入的房间
    }

    /**
     * 检查房间是否满足出现条件
     * @param roomKey 房间key
     * @param player 玩家对象
     */
    checkRoomAvailableCondition(roomKey: string, player: any): boolean {
        const roomConfig = roomRegistry.getRoomConfig(roomKey)
        if (!roomConfig || !roomConfig.availableCondition) {
            return true  // 没有条件限制，默认可用
        }

        const condition = roomConfig.availableCondition
        const currentFloorKey = this.currentFloorKey || ""
        const currentFloorConfig = this.getCurrentFloorConfig()
        const currentFloorOrder = currentFloorConfig?.order || 0
        const currentStep = this.getCurrentStep()

        // 检查层级key限制
        if (condition.floorKeys && condition.floorKeys.length > 0) {
            if (!condition.floorKeys.includes(currentFloorKey)) {
                return false
            }
        }

        // 检查层级顺序限制
        if (condition.floorOrders && condition.floorOrders.length > 0) {
            if (!condition.floorOrders.includes(currentFloorOrder)) {
                return false
            }
        }

        // 检查层级顺序范围
        if (condition.floorOrderRange) {
            const { min, max } = condition.floorOrderRange
            if (min !== undefined && currentFloorOrder < min) {
                return false
            }
            if (max !== undefined && currentFloorOrder > max) {
                return false
            }
        }

        // 检查步数限制
        if (condition.steps && condition.steps.length > 0) {
            if (!condition.steps.includes(currentStep)) {
                return false
            }
        }

        // 检查步数范围
        if (condition.stepRange) {
            const { min, max } = condition.stepRange
            if (min !== undefined && currentStep < min) {
                return false
            }
            if (max !== undefined && currentStep > max) {
                return false
            }
        }

        // 检查自定义条件
        if (condition.custom) {
            try {
                return condition.custom({
                    floorKey: currentFloorKey,
                    floorOrder: currentFloorOrder,
                    step: currentStep,
                    player,
                    roomHistory: []  // TODO: 需要传入完整的 Room 对象历史
                })
            } catch (error) {
                console.error(`[FloorManager] 自定义条件检查失败:`, error)
                return false
            }
        }

        return true
    }

    /**
     * 过滤房间列表，只保留满足条件的房间
     * @param roomKeys 房间key列表
     * @param player 玩家对象
     */
    filterAvailableRooms(roomKeys: string[], player: any): string[] {
        return roomKeys.filter(roomKey => this.checkRoomAvailableCondition(roomKey, player))
    }

    /**
     * 从 roomLayout 中选择房间
     * @param roomLayout 房间布局配置
     * @param player 玩家对象
     */
    private selectRoomsFromLayout(roomLayout: any[], player: any): string[] {
        const currentStep = this.getCurrentStep()
        const currentFloorKey = this.currentFloorKey || ""
        const currentFloorConfig = this.getCurrentFloorConfig()
        const currentFloorOrder = currentFloorConfig?.order || 0

        // 找到匹配当前步数的槽位配置（按优先级排序）
        const matchingSlots = roomLayout
            .filter(slot => this.isStepMatch(slot.step, currentStep))
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))

        if (matchingSlots.length === 0) {
            return []  // 没有匹配的槽位，使用默认生成
        }

        // 使用优先级最高的槽位
        const slot = matchingSlots[0]
        const selectedRooms: string[] = []

        // 模式1：固定房间
        if (slot.roomKey) {
            selectedRooms.push(slot.roomKey)
        }
        // 模式2：候选列表
        else if (slot.candidates) {
            const { roomKeys, selectCount = 1, selectMode = "random", weights, allowDuplicates = false } = slot.candidates

            if (selectMode === "all") {
                selectedRooms.push(...roomKeys)
            } else if (selectMode === "random") {
                const selected = this.selectRandomFromCandidates(roomKeys, selectCount, allowDuplicates)
                selectedRooms.push(...selected)
            } else if (selectMode === "weighted" && weights) {
                const selected = this.selectWeightedFromCandidates(roomKeys, weights, selectCount, allowDuplicates)
                selectedRooms.push(...selected)
            } else if (selectMode === "sequential") {
                selectedRooms.push(...roomKeys.slice(0, selectCount))
            }
        }
        // 模式3：按类型从池子选择
        else if (slot.type) {
            const pool = slot.pool || this.getRoomPoolByType(slot.type, currentFloorConfig)
            const count = slot.count || 1
            const selected = this.selectRandomFromCandidates(pool, count, false)
            selectedRooms.push(...selected)
        }
        // 模式4：自定义生成器
        else if (slot.generator) {
            try {
                const result = slot.generator({
                    floorKey: currentFloorKey,
                    floorOrder: currentFloorOrder,
                    step: currentStep,
                    player,
                    roomHistory: []  // TODO: 传入完整的 Room 对象历史
                })
                if (typeof result === "string") {
                    selectedRooms.push(result)
                } else if (Array.isArray(result)) {
                    selectedRooms.push(...result)
                }
            } catch (error) {
                console.error(`[FloorManager] 自定义生成器执行失败:`, error)
            }
        }

        return selectedRooms
    }

    /**
     * 检查步数是否匹配
     */
    private isStepMatch(stepConfig: number | number[] | "any", currentStep: number): boolean {
        if (stepConfig === "any") {
            return true
        }
        if (typeof stepConfig === "number") {
            return stepConfig === currentStep
        }
        if (Array.isArray(stepConfig)) {
            return stepConfig.includes(currentStep)
        }
        return false
    }

    /**
     * 从候选列表中随机选择
     */
    private selectRandomFromCandidates(candidates: string[], count: number, allowDuplicates: boolean): string[] {
        const selected: string[] = []
        const available = [...candidates]

        for (let i = 0; i < count && available.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * available.length)
            selected.push(available[randomIndex])

            if (!allowDuplicates) {
                available.splice(randomIndex, 1)
            }
        }

        return selected
    }

    /**
     * 从候选列表中按权重选择
     */
    private selectWeightedFromCandidates(candidates: string[], weights: number[], count: number, allowDuplicates: boolean): string[] {
        if (candidates.length !== weights.length) {
            console.warn(`[FloorManager] 候选列表和权重数组长度不匹配`)
            return this.selectRandomFromCandidates(candidates, count, allowDuplicates)
        }

        const selected: string[] = []
        const available = candidates.map((key, index) => ({ key, weight: weights[index] }))

        for (let i = 0; i < count && available.length > 0; i++) {
            const totalWeight = available.reduce((sum, item) => sum + item.weight, 0)
            let random = Math.random() * totalWeight
            let selectedItem = available[0]

            for (const item of available) {
                random -= item.weight
                if (random <= 0) {
                    selectedItem = item
                    break
                }
            }

            selected.push(selectedItem.key)

            if (!allowDuplicates) {
                const index = available.indexOf(selectedItem)
                available.splice(index, 1)
            }
        }

        return selected
    }

    /**
     * 根据类型获取房间池
     */
    private getRoomPoolByType(roomType: RoomType, floorConfig: any): string[] {
        if (!floorConfig) return []

        switch (roomType) {
            case "battle":
                return floorConfig.roomPools.battles
            case "event":
                return floorConfig.roomPools.events
            case "pool":
                return floorConfig.roomPools.pools
            case "blackStore":
                return floorConfig.roomPools.blackStores
            default:
                return []
        }
    }

    /**
     * 应用耗尽策略
     * @param roomType 房间类型
     * @param strategy 耗尽策略
     * @param floorConfig 层级配置
     * @param player 玩家对象
     */
    private applyExhaustionStrategy(
        roomType: RoomType,
        strategy: ExhaustionStrategy,
        floorConfig: FloorConfig | null,
        player: any
    ): string | null {
        switch (strategy.type) {
            case "reset":
                // 清空该类型的已使用记录
                const poolRooms = floorConfig ? this.getRoomPoolByType(roomType, floorConfig) : []
                poolRooms.forEach(key => this.usedRoomKeys.delete(key))
                // 重新选择
                return this.selectRandomRoomByType(roomType, floorConfig, player)

            case "allow-repeat":
                // 临时允许重复，从所有房间中选择
                let allRooms: string[] = []
                if (floorConfig) {
                    allRooms = this.getRoomPoolByType(roomType, floorConfig)
                }
                if (allRooms.length === 0) {
                    const roomConfigs = roomRegistry.getRoomConfigsByType(roomType)
                    allRooms = roomConfigs.map(config => config.key)
                }
                if (player) {
                    allRooms = this.filterAvailableRooms(allRooms, player)
                }
                if (allRooms.length === 0) return null
                const randomIndex = Math.floor(Math.random() * allRooms.length)
                return allRooms[randomIndex]

            case "borrow":
                // 从其他类型借用
                if (strategy.borrowFrom && strategy.borrowFrom.length > 0) {
                    for (const borrowType of strategy.borrowFrom) {
                        const borrowed = this.selectRandomRoomByType(borrowType as RoomType, floorConfig, player)
                        if (borrowed) return borrowed
                    }
                }
                return null

            case "skip":
                // 跳过，不生成房间
                return null

            case "error":
                // 抛出错误
                throw new Error(`[FloorManager] 房间池 "${roomType}" 已耗尽，且策略为 error`)

            default:
                console.warn(`[FloorManager] 未知的耗尽策略: ${strategy.type}`)
                return null
        }
    }

    /**
     * 获取可用房间列表（考虑选择规则）
     * @param roomType 房间类型
     * @param floorConfig 层级配置
     * @param player 玩家对象
     */
    private getAvailableRooms(roomType: RoomType, floorConfig: FloorConfig | null, player: any): string[] {
        let availableRooms: string[] = []

        // 从层级房间池获取
        if (floorConfig) {
            availableRooms = this.getRoomPoolByType(roomType, floorConfig)
        }

        // 如果层级房间池为空，从全局房间注册表获取
        if (availableRooms.length === 0) {
            const roomConfigs = roomRegistry.getRoomConfigsByType(roomType)
            availableRooms = roomConfigs.map(config => config.key)
        }

        // 应用 availableCondition 过滤
        if (player) {
            availableRooms = this.filterAvailableRooms(availableRooms, player)
        }

        // 过滤掉已使用的房间（默认不允许重复）
        availableRooms = availableRooms.filter(key => !this.usedRoomKeys.has(key))

        return availableRooms
    }

    // ==================== 新增：地图系统方法 ====================

    /**
     * 生成地图
     * @param config 地图配置（可选，默认使用 defaultFloorMapConfig）
     */
    generateMap(config?: Partial<FloorMapConfig>): FloorMap {
        // 合并配置
        const fullConfig: FloorMapConfig = {
            ...defaultFloorMapConfig,
            ...config
        }

        // 从 roomRegistry 填充房间池（如果配置中没有提供）
        if (fullConfig.roomPools.battles.length === 0) {
            fullConfig.roomPools.battles = roomRegistry
                .getRoomConfigsByType("battle")
                .map(c => c.key)
        }
        if (fullConfig.roomPools.eliteBattles && fullConfig.roomPools.eliteBattles.length === 0) {
            fullConfig.roomPools.eliteBattles = roomRegistry
                .getRoomConfigsByType("eliteBattle")
                .map(c => c.key)
        }
        if (fullConfig.roomPools.events.length === 0) {
            fullConfig.roomPools.events = roomRegistry
                .getRoomConfigsByType("event")
                .map(c => c.key)
        }
        if (fullConfig.roomPools.pools.length === 0) {
            fullConfig.roomPools.pools = roomRegistry
                .getRoomConfigsByType("pool")
                .map(c => c.key)
        }
        if (fullConfig.roomPools.blackStores.length === 0) {
            fullConfig.roomPools.blackStores = roomRegistry
                .getRoomConfigsByType("blackStore")
                .map(c => c.key)
        }

        // 生成地图
        const generator = new MapGenerator(fullConfig)
        this.currentMap = generator.generate()
        this.mapGenerator = generator  // 保存生成器实例

        // 初始化地图（第一层所有节点都可选）
        const firstLayer = this.currentMap.getLayer(0)
        for (const node of firstLayer) {
            node.state = "available"
        }

        return this.currentMap
    }

    /**
     * 获取地图生成器（用于延迟分配房间key）
     */
    getMapGenerator(): MapGenerator | null {
        return this.mapGenerator
    }

    /**
     * 获取当前地图
     */
    getCurrentMap(): FloorMap | null {
        return this.currentMap
    }

    /**
     * 获取当前地图节点
     */
    getCurrentMapNode(): MapNode | null {
        return this.currentMap?.getCurrentNode() || null
    }

    /**
     * 获取可前进的地图节点
     */
    getNextMapNodes(): MapNode[] {
        return this.currentMap?.getNextNodes() || []
    }

    /**
     * 前进到指定地图节点
     */
    moveToMapNode(nodeId: string): boolean {
        if (!this.currentMap) {
            console.error("[FloorManager] 地图未生成")
            return false
        }

        const success = this.currentMap.moveToNode(nodeId)
        if (success) {
            // 更新楼层数
            const node = this.currentMap.getCurrentNode()
            if (node) {
                this.currentFloor = node.layer
                this.recordRoom(node.roomType, node.roomKey)
            }
        }

        return success
    }

    /**
     * 重置地图
     */
    resetMap(): void {
        this.currentMap = null
        this.mapGenerator = null
    }
}

// 导出单例
export const floorManager = new FloorManager()
