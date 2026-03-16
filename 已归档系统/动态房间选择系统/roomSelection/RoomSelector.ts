/**
 * 房间选择器
 * 协调多个规则，处理意图合并、冲突解决、耗尽策略等
 */

import type { RoomPools, SelectionIntent, SelectionRule, SelectionContext, ExhaustionStrategy } from "./types"
import { RoomPoolManager } from "./RoomPoolManager"

interface RoomSelectorConfig {
    pools: RoomPools
    exhaustionStrategies?: Record<string, ExhaustionStrategy>
}

export class RoomSelector {
    private poolManager: RoomPoolManager
    private exhaustionStrategies: Record<string, ExhaustionStrategy>
    private warnedConflicts: Set<string> = new Set()

    constructor(config: RoomSelectorConfig) {
        this.poolManager = new RoomPoolManager(config.pools)
        this.exhaustionStrategies = config.exhaustionStrategies || {}
    }

    /**
     * 选择房间
     */
    select(
        rules: SelectionRule[],
        count: number,
        context: SelectionContext
    ): string[] {
        // 使用当前可用的池
        const availablePools = this.poolManager.getAvailablePools()

        // 合并规则意图
        const intents = rules.map(rule => rule.getIntent(availablePools, count, context))
        const mergedIntent = this.mergeIntents(intents)

        const selected: string[] = []
        const typeCount: Record<string, number> = {}

        // 1. 处理 mustHave
        if (mergedIntent.mustHave) {
            for (const requirement of mergedIntent.mustHave) {
                const rooms = this.pickRoomsWithExhaustion(
                    requirement,
                    availablePools,
                    selected
                )
                selected.push(...rooms)
                this.updateTypeCount(typeCount, rooms, availablePools)
            }
        }

        // 2. 处理 prefer
        if (mergedIntent.prefer && selected.length < count) {
            for (const preference of mergedIntent.prefer) {
                // 检查数量限制
                const type = preference.type
                if (type && mergedIntent.maxCount?.[type]) {
                    const currentCount = typeCount[type] || 0
                    if (currentCount >= mergedIntent.maxCount[type]) {
                        continue
                    }
                }

                if (Math.random() < (preference.weight || 1)) {
                    const rooms = this.pickRoomsWithExhaustion(
                        preference,
                        availablePools,
                        selected
                    )
                    selected.push(...rooms)
                    this.updateTypeCount(typeCount, rooms, availablePools)
                }
            }
        }

        // 3. 填充剩余
        const remaining = count - selected.length
        if (remaining > 0) {
            let availableRooms = this.getAllRooms(availablePools)

            // 应用排除规则
            if (mergedIntent.exclude) {
                availableRooms = availableRooms.filter(key => !mergedIntent.exclude!.includes(key))
            }

            // 去重
            availableRooms = availableRooms.filter(key => !selected.includes(key))

            // 应用 maxCount 限制
            if (mergedIntent.maxCount) {
                availableRooms = availableRooms.filter(key => {
                    const type = this.getRoomType(key, availablePools)
                    const currentCount = typeCount[type] || 0
                    const maxAllowed = mergedIntent.maxCount![type]
                    return !maxAllowed || currentCount < maxAllowed
                })
            }

            selected.push(...this.randomPick(availableRooms, remaining))
        }

        return selected
    }

    /**
     * 通知房间已进入
     */
    notifyRoomEntered(roomKey: string): void {
        this.poolManager.markAsUsed(roomKey)
    }

    /**
     * 序列化
     */
    serialize(): any {
        return this.poolManager.serialize()
    }

    /**
     * 反序列化
     */
    deserialize(data: any): void {
        this.poolManager.deserialize(data)
    }

    /**
     * 合并多个意图
     */
    private mergeIntents(intents: SelectionIntent[]): SelectionIntent {
        const merged: SelectionIntent = {
            mustHave: [],
            prefer: [],
            exclude: [],
            maxCount: {},
            fallback: 'random'
        }

        // 收集所有意图
        for (const intent of intents) {
            if (intent.mustHave) merged.mustHave!.push(...intent.mustHave)
            if (intent.prefer) merged.prefer!.push(...intent.prefer)
            if (intent.exclude) merged.exclude!.push(...intent.exclude)
            if (intent.maxCount && merged.maxCount) {
                Object.assign(merged.maxCount, intent.maxCount)
            }
        }

        // 检测并解决冲突
        this.resolveConflicts(merged)

        return merged
    }

    /**
     * 解决冲突
     */
    private resolveConflicts(intent: SelectionIntent): void {
        // 冲突1：mustHave vs exclude
        // 优先级：mustHave > exclude
        if (intent.mustHave && intent.exclude) {
            const mustHaveKeys = this.extractKeysFromRequirements(intent.mustHave)
            const conflicts = mustHaveKeys.filter(key => intent.exclude!.includes(key))

            if (conflicts.length > 0) {
                const conflictKey = conflicts.join(', ')
                if (!this.warnedConflicts.has(conflictKey)) {
                    console.warn(
                        `[RoomSelector] 规则冲突：房间 [${conflictKey}] 同时在 mustHave 和 exclude 中。` +
                        `优先级：mustHave > exclude，将从 exclude 中移除。`
                    )
                    this.warnedConflicts.add(conflictKey)
                }

                // 从 exclude 中移除冲突的房间
                intent.exclude = intent.exclude!.filter(key => !conflicts.includes(key))
            }
        }

        // 冲突2：prefer vs exclude
        // 优先级：exclude > prefer
        if (intent.prefer && intent.exclude) {
            const preferKeys = this.extractKeysFromRequirements(intent.prefer)
            const conflicts = preferKeys.filter(key => intent.exclude!.includes(key))

            if (conflicts.length > 0) {
                const conflictKey = conflicts.join(', ')
                if (!this.warnedConflicts.has(conflictKey)) {
                    console.warn(
                        `[RoomSelector] 规则冲突：房间 [${conflictKey}] 同时在 prefer 和 exclude 中。` +
                        `优先级：exclude > prefer，将从 prefer 中移除。`
                    )
                    this.warnedConflicts.add(conflictKey)
                }

                // 从 prefer 中移除冲突的房间
                intent.prefer = intent.prefer!.filter(req => {
                    const keys = this.extractKeysFromRequirements([req])
                    return !keys.some(key => conflicts.includes(key))
                })
            }
        }
    }

    /**
     * 从需求中提取房间key
     */
    private extractKeysFromRequirements(requirements: any[]): string[] {
        const keys: string[] = []
        for (const req of requirements) {
            if (req.key) {
                keys.push(req.key)
            } else if (req.pool) {
                keys.push(...req.pool)
            }
            // type 的情况无法提前知道具体 key，跳过
        }
        return keys
    }

    /**
     * 选择房间时处理池耗尽情况
     */
    private pickRoomsWithExhaustion(
        requirement: any,
        availablePools: RoomPools,
        alreadySelected: string[]
    ): string[] {
        const type = requirement.type

        // 检查池是否耗尽
        if (type && this.poolManager.isPoolExhausted(type)) {
            return this.handleExhaustion(type, requirement, availablePools, alreadySelected)
        }

        // 正常选择
        return this.pickRooms(requirement, availablePools, alreadySelected)
    }

    /**
     * 选择房间
     */
    private pickRooms(
        requirement: any,
        availablePools: RoomPools,
        alreadySelected: string[]
    ): string[] {
        if (requirement.key) {
            return alreadySelected.includes(requirement.key) ? [] : [requirement.key]
        }

        if (requirement.pool) {
            const available = requirement.pool.filter((key: string) => !alreadySelected.includes(key))
            return this.randomPick(available, Math.min(requirement.count, available.length))
        }

        if (requirement.type) {
            const available = availablePools[requirement.type as keyof RoomPools]?.filter(key => !alreadySelected.includes(key)) || []
            return this.randomPick(available, Math.min(requirement.count, available.length))
        }

        return []
    }

    /**
     * 处理池耗尽
     */
    private handleExhaustion(
        type: string,
        requirement: any,
        availablePools: RoomPools,
        alreadySelected: string[]
    ): string[] {
        const strategy = this.exhaustionStrategies[type] || { type: 'reset' }

        switch (strategy.type) {
            case 'reset':
                // 重置池子
                console.log(`[RoomSelector] ${type} 池耗尽，重置池子`)
                this.poolManager.resetPool(type as keyof RoomPools)
                // 重新尝试选择
                return this.pickRooms(requirement, this.poolManager.getAvailablePools(), alreadySelected)

            case 'allow-repeat':
                // 允许重复，从原始池中选择
                console.log(`[RoomSelector] ${type} 池耗尽，允许重复`)
                const originalPool = this.poolManager.getOriginalPool(type as keyof RoomPools)
                const available = originalPool.filter(key => !alreadySelected.includes(key))
                return this.randomPick(available, Math.min(requirement.count, available.length))

            case 'borrow':
                // 从其他类型借用
                console.log(`[RoomSelector] ${type} 池耗尽，从其他类型借用`)
                const borrowFrom = strategy.borrowFrom || []
                for (const borrowType of borrowFrom) {
                    if (!this.poolManager.isPoolExhausted(borrowType as keyof RoomPools)) {
                        const borrowed = availablePools[borrowType as keyof RoomPools]?.filter(key => !alreadySelected.includes(key)) || []
                        if (borrowed.length > 0) {
                            return this.randomPick(borrowed, Math.min(requirement.count, borrowed.length))
                        }
                    }
                }
                // 如果借用也失败，回退到 reset
                return this.handleExhaustion(type, requirement, availablePools, alreadySelected)

            case 'skip':
                // 跳过，不选择
                console.log(`[RoomSelector] ${type} 池耗尽，跳过`)
                return []

            case 'error':
                throw new Error(`[RoomSelector] ${type} 池耗尽，无法继续`)

            default:
                return []
        }
    }

    /**
     * 获取所有房间
     */
    private getAllRooms(pools: RoomPools): string[] {
        return [
            ...pools.battles,
            ...pools.eliteBattles,
            ...pools.events,
            ...pools.blackStores,
            ...pools.pools
        ]
    }

    /**
     * 获取房间类型
     */
    private getRoomType(roomKey: string, pools: RoomPools): string {
        for (const [type, keys] of Object.entries(pools)) {
            if (keys.includes(roomKey)) return type
        }
        return 'unknown'
    }

    /**
     * 更新类型计数
     */
    private updateTypeCount(
        typeCount: Record<string, number>,
        rooms: string[],
        pools: RoomPools
    ): void {
        for (const room of rooms) {
            const type = this.getRoomType(room, pools)
            typeCount[type] = (typeCount[type] || 0) + 1
        }
    }

    /**
     * 随机选择
     */
    private randomPick(array: string[], count: number): string[] {
        const result: string[] = []
        const available = [...array]

        for (let i = 0; i < count && available.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * available.length)
            result.push(available[randomIndex])
            available.splice(randomIndex, 1)
        }

        return result
    }
}
