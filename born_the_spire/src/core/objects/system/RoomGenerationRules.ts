/**
 * 房间生成规则配置
 * 定义房间生成的概率和规则
 */

import { RoomType } from "@/core/objects/room/Room"

/**
 * 房间权重配置
 */
export interface RoomWeightConfig {
    battle: number          // 战斗房间权重
    event: number           // 事件房间权重
    pool: number            // 水池房间权重
    blackStore: number      // 黑市房间权重
}

/**
 * 房间生成规则
 */
export interface RoomGenerationRule {
    name: string                    // 规则名称
    description?: string            // 规则描述
    priority: number                // 优先级（数字越大越优先）
    condition: (context: RoomGenerationContext) => boolean  // 触发条件
    effect: (weights: RoomWeightConfig) => RoomWeightConfig | RoomType | string[]  // 效果（修改权重、强制类型、或固定房间列表）
}

/**
 * 房间生成上下文
 * 提供给规则判断的信息
 */
export interface RoomGenerationContext {
    currentFloor: number                // 当前楼层
    roomHistory: RoomType[]             // 房间历史（按顺序）
    lastRoomType: RoomType | null       // 上一个房间类型
    consecutiveBattles: number          // 连续战斗次数
    consecutiveNonBattles: number       // 连续非战斗次数
    floorsSinceLastPool: number         // 距离上次水池的楼层数
    floorsSinceLastBlackStore: number   // 距离上次黑市的楼层数
    floorsSinceLastEvent: number        // 距离上次事件的楼层数
}

/**
 * 默认房间权重配置
 */
export const defaultRoomWeights: RoomWeightConfig = {
    battle: 50,
    event: 20,
    pool: 15,
    blackStore: 15
}

/**
 * 默认房间生成规则列表
 */
export const defaultRoomGenerationRules: RoomGenerationRule[] = [
    // 规则1：连续3次非战斗后，必定战斗
    {
        name: "force_battle_after_3_non_battles",
        description: "连续3次非战斗后，强制进入战斗",
        priority: 100,
        condition: (context) => context.consecutiveNonBattles >= 3,
        effect: () => "battle"  // 返回强制类型
    },

    // 规则2：连续5次战斗后，必定非战斗
    {
        name: "force_non_battle_after_5_battles",
        description: "连续5次战斗后，强制进入非战斗房间",
        priority: 90,
        condition: (context) => context.consecutiveBattles >= 5,
        effect: (weights) => ({
            battle: 0,
            event: weights.event * 2,
            pool: weights.pool * 2,
            blackStore: weights.blackStore * 2
        })
    },

    // 规则3：每10层必定出现水池
    {
        name: "force_pool_every_10_floors",
        description: "每10层必定出现水池",
        priority: 80,
        condition: (context) => context.currentFloor % 10 === 0,
        effect: () => "pool"
    },

    // 规则4：距离上次水池超过8层，增加水池权重
    {
        name: "increase_pool_weight_after_8_floors",
        description: "距离上次水池超过8层，大幅增加水池权重",
        priority: 70,
        condition: (context) => context.floorsSinceLastPool >= 8,
        effect: (weights) => ({
            ...weights,
            pool: weights.pool * 3
        })
    },

    // 规则5：前3层不出现黑市
    {
        name: "no_blackStore_in_first_3_floors",
        description: "前3层不出现黑市",
        priority: 60,
        condition: (context) => context.currentFloor <= 3,
        effect: (weights) => ({
            ...weights,
            blackStore: 0
        })
    },

    // 规则6：后半段增加黑市权重
    {
        name: "increase_blackStore_weight_in_late_game",
        description: "楼层超过15后，增加黑市权重",
        priority: 50,
        condition: (context) => context.currentFloor > 15,
        effect: (weights) => ({
            ...weights,
            blackStore: weights.blackStore * 2
        })
    },

    // 规则7：距离上次黑市超过10层，增加黑市权重
    {
        name: "increase_blackStore_weight_after_10_floors",
        description: "距离上次黑市超过10层，增加黑市权重",
        priority: 40,
        condition: (context) => context.floorsSinceLastBlackStore >= 10,
        effect: (weights) => ({
            ...weights,
            blackStore: weights.blackStore * 2.5
        })
    },

    // 规则8：连续2次相同类型房间后，降低该类型权重
    {
        name: "reduce_weight_after_2_same_type",
        description: "连续2次相同类型房间后，降低该类型权重",
        priority: 30,
        condition: (context) => {
            if (context.roomHistory.length < 2) return false
            const last = context.roomHistory[context.roomHistory.length - 1]
            const secondLast = context.roomHistory[context.roomHistory.length - 2]
            return last === secondLast
        },
        effect: (weights) => {
            // const _lastType = weights as any
            // 这里需要获取上一个房间类型，然后降低其权重
            // 简化实现：降低所有权重，增加多样性
            return {
                battle: weights.battle * 0.8,
                event: weights.event * 1.2,
                pool: weights.pool * 1.2,
                blackStore: weights.blackStore * 1.2
            }
        }
    }
]

/**
 * 自定义规则注册表
 * Mod 可以添加自定义规则
 */
export const customRoomGenerationRules: RoomGenerationRule[] = []

/**
 * 注册自定义房间生成规则
 */
export function registerRoomGenerationRule(rule: RoomGenerationRule): void {
    customRoomGenerationRules.push(rule)
    console.log(`[RoomGeneration] 注册自定义规则: ${rule.name}`)
}

/**
 * 获取所有房间生成规则
 */
export function getAllRoomGenerationRules(): RoomGenerationRule[] {
    return [...defaultRoomGenerationRules, ...customRoomGenerationRules]
        .sort((a, b) => b.priority - a.priority)  // 按优先级排序
}
