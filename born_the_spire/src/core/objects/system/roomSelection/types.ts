/**
 * 房间选择系统 - 核心类型定义
 */

import type { RoomType } from "@/core/objects/room/Room"
import type { Player } from "@/core/objects/target/Player"
import type { Room } from "@/core/objects/room/Room"

/**
 * 房间池配置
 */
export interface RoomPools {
    battles: string[]
    eliteBattles: string[]
    events: string[]
    blackStores: string[]
    pools: string[]
}

/**
 * 选择上下文
 */
export interface SelectionContext {
    floorKey: string
    floorOrder: number
    step: number
    player: Player
    roomHistory: Room[]
}

/**
 * 选择意图
 */
export interface SelectionIntent {
    // 必须包含的房间
    mustHave?: Array<{
        type?: RoomType        // 房间类型（可选）
        key?: string           // 具体房间key（可选）
        pool?: string[]        // 候选池（可选）
        count: number          // 数量
    }>

    // 偏好包含的房间
    prefer?: Array<{
        type?: RoomType
        key?: string
        pool?: string[]
        count: number
        weight?: number        // 权重（用于多个prefer之间的优先级）
    }>

    // 数量限制
    maxCount?: {
        [roomType: string]: number  // 某类房间最多出现的数量
    }

    // 排除的房间
    exclude?: string[]       // 排除的具体房间key

    // 兜底策略
    fallback?: 'random' | 'weighted' | ((roomPools: RoomPools) => string[])
}

/**
 * 选择规则接口
 */
export interface SelectionRule {
    /**
     * 获取选择意图
     */
    getIntent(
        roomPools: RoomPools,
        count: number,
        context: SelectionContext
    ): SelectionIntent

    /**
     * 选择完成后更新状态
     * @param selectedRooms 本次选择的房间列表
     * @param enteredRoom 玩家实际进入的房间（可能为null）
     */
    updateAfterSelection(selectedRooms: string[], enteredRoom: string | null): void

    /**
     * 序列化状态（可选）
     */
    serialize?(): any

    /**
     * 反序列化状态（可选）
     */
    deserialize?(state: any): void
}

/**
 * 选择规则配置
 */
export interface SelectionRuleConfig {
    id?: string  // 唯一标识符
    type: 'pool-frequency' | 'incremental-probability' | 'deduplication' | 'layout' | 'custom'
    config?: any
    customRule?: SelectionRule
}

/**
 * 池耗尽策略
 */
export interface ExhaustionStrategy {
    type: 'reset' | 'allow-repeat' | 'borrow' | 'skip' | 'error'

    // borrow 策略的配置
    borrowFrom?: string[]  // 可以借用的类型列表
}
