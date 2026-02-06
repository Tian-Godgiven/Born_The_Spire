/**
 * 层级配置类型定义
 * 层级是游戏的主要结构单元，每个层级有独立的房间池和生成规则
 */

import type { RoomGenerationRule } from "@/core/objects/system/RoomGenerationRules"
import type { Player } from "@/core/objects/target/Player"
import type { Room } from "@/core/objects/room/Room"
import type { RoomType } from "@/core/objects/room/Room"
import type { SelectionRuleConfig, ExhaustionStrategy } from "@/core/objects/system/roomSelection/types"

// 重新导出这些类型，以便其他模块可以从 FloorConfig 导入
export type { SelectionRuleConfig, ExhaustionStrategy }

/**
 * 房间槽位配置
 * 用于精确控制层级中特定步数的房间
 */
export interface RoomSlotConfig {
    step: number | number[] | "any"  // 步数：1, [1,2,3], "any"

    // 模式1：固定房间
    roomKey?: string

    // 模式2：候选列表（从n个中选m个）
    candidates?: {
        roomKeys: string[]          // 候选房间key列表
        selectCount?: number        // 选择数量（默认1）
        selectMode?: "random" | "all" | "weighted" | "sequential"
        weights?: number[]          // 权重数组（用于 weighted 模式）
        allowDuplicates?: boolean   // 是否允许重复（默认false）
    }

    // 模式3：按类型从池子选择
    type?: RoomType
    pool?: string[]                 // 指定池子（可选，不填则用 roomPools）
    count?: number                  // 选择数量（默认1）

    // 模式4：自定义生成器
    generator?: (context: {
        floorKey: string,
        floorOrder: number,
        step: number,
        player: Player,
        roomHistory: Room[]
    }) => string | string[]

    // 优先级（数字越大优先级越高，默认0）
    priority?: number
}

/**
 * 层级配置接口
 */
export interface FloorConfig {
    key: string                    // 层级唯一标识，如 "floor_1"
    name: string                   // 层级名称，如 "底层"
    order: number                  // 层级顺序（用于排序）
    description?: string           // 层级描述（用于楼层选择界面）

    // 房间池配置
    roomPools: {
        battles: string[]          // 普通战斗房间key列表
        eliteBattles: string[]     // 精英战斗房间key列表
        bossBattles: string[]      // Boss战斗房间key列表
        events: string[]           // 事件房间key列表
        blackStores: string[]      // 黑市房间key列表
        pools: string[]            // 休息房间key列表
    }

    // 地图配置（新系统）
    mapConfig?: import("./FloorMapConfig").FloorMapConfig

    // 楼层入口事件（可选，进入楼层时触发的事件）
    entranceEvent?: string

    // 房间选择规则配置（新系统）
    selectionRules?: SelectionRuleConfig[]

    // 池耗尽策略配置（新系统）
    exhaustionStrategies?: {
        [roomType: string]: ExhaustionStrategy
    }

    // Boss步数（可选，用于 Boss 前必定水池等规则）
    bossStep?: number

    // 房间布局规划（可选，旧系统，优先级高于 roomPools）
    roomLayout?: RoomSlotConfig[]

    // 下一层级配置
    nextFloors?: string[]          // 可进入的下一层级key列表
    nextFloorSelectionMode?: "auto" | "random" | "manual"
    // - "auto"（默认）: 只有1个自动进入，多个显示选择界面
    // - "random": 从列表中随机选择一个自动进入
    // - "manual": 必须手动选择（即使只有1个也显示选择界面）

    // 解锁条件（可选）
    unlockCondition?: (player: Player) => {
        unlocked: boolean          // 是否解锁
        reason?: string            // 未解锁的原因（显示给玩家）
    }

    // 层级专属的房间生成规则（可选）
    roomGenerationRules?: RoomGenerationRule[]

    // 层级特性（可选）
    modifiers?: {
        enemyHealthMultiplier?: number   // 敌人生命倍率
        enemyDamageMultiplier?: number   // 敌人伤害倍率
        rewardMultiplier?: number        // 奖励倍率
    }
}
