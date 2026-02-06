/**
 * 房间池管理器
 * 管理消耗性房间池，追踪已使用的房间
 */

import type { RoomPools } from "./types"

export class RoomPoolManager {
    private availablePools: RoomPools
    private originalPools: RoomPools
    private usedRooms: Set<string> = new Set()

    constructor(roomPools: RoomPools) {
        // 深拷贝原始池
        this.originalPools = this.deepCopyPools(roomPools)
        this.availablePools = this.deepCopyPools(roomPools)
    }

    /**
     * 获取当前可用的房间池
     */
    getAvailablePools(): RoomPools {
        return { ...this.availablePools }
    }

    /**
     * 标记房间已使用
     */
    markAsUsed(roomKey: string): void {
        this.usedRooms.add(roomKey)

        // 从所有池中移除
        for (const type in this.availablePools) {
            const pool = this.availablePools[type as keyof RoomPools]
            const index = pool.indexOf(roomKey)
            if (index !== -1) {
                pool.splice(index, 1)
            }
        }
    }

    /**
     * 检查某类型池是否耗尽
     */
    isPoolExhausted(type: keyof RoomPools): boolean {
        return this.availablePools[type]?.length === 0
    }

    /**
     * 获取某类型池的剩余数量
     */
    getRemainingCount(type: keyof RoomPools): number {
        return this.availablePools[type]?.length || 0
    }

    /**
     * 重置某类型的池
     */
    resetPool(type: keyof RoomPools): void {
        this.availablePools[type] = [...this.originalPools[type]]
        console.log(`[RoomPoolManager] 重置池: ${type}`)
    }

    /**
     * 完全重置所有池
     */
    resetAllPools(): void {
        this.availablePools = this.deepCopyPools(this.originalPools)
        this.usedRooms.clear()
        console.log(`[RoomPoolManager] 重置所有池`)
    }

    /**
     * 获取原始池（用于 allow-repeat 策略）
     */
    getOriginalPool(type: keyof RoomPools): string[] {
        return [...this.originalPools[type]]
    }

    /**
     * 序列化
     */
    serialize(): any {
        return {
            usedRooms: Array.from(this.usedRooms),
            availablePools: this.availablePools
        }
    }

    /**
     * 反序列化
     */
    deserialize(data: any): void {
        if (data.usedRooms) {
            this.usedRooms = new Set(data.usedRooms)
        }
        if (data.availablePools) {
            this.availablePools = data.availablePools
        }
    }

    /**
     * 深拷贝房间池
     */
    private deepCopyPools(pools: RoomPools): RoomPools {
        return {
            battles: [...pools.battles],
            eliteBattles: [...pools.eliteBattles],
            events: [...pools.events],
            blackStores: [...pools.blackStores],
            pools: [...pools.pools]
        }
    }
}
