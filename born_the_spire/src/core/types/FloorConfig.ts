/**
 * 层级配置类型定义
 * 层级是游戏的主要结构单元，每个层级有独立的房间池和生成规则
 */

import type { RoomGenerationRule } from "@/core/objects/system/RoomGenerationRules"
import type { Player } from "@/core/objects/target/Player"

/**
 * 层级配置接口
 */
export interface FloorConfig {
    key: string                    // 层级唯一标识，如 "floor_1"
    name: string                   // 层级名称，如 "底层"
    order: number                  // 层级顺序（用于排序）

    // 房间池配置
    roomPools: {
        battles: string[]          // 普通战斗房间key列表
        bossBattles: string[]      // Boss战斗房间key列表
        events: string[]           // 事件房间key列表
        blackStores: string[]      // 黑市房间key列表
        pools: string[]            // 休息房间key列表
    }

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
