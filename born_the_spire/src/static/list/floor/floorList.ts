/**
 * 层级列表
 * 定义游戏中所有的层级配置
 */

import type { FloorConfig } from "@/core/types/FloorConfig"
import { countPlayerMarks } from "@/core/hooks/mark"

/**
 * 所有层级配置
 */
export const floorList: FloorConfig[] = [
    // 第1层：底层
    {
        key: "floor_1",
        name: "底层",
        order: 1,
        roomPools: {
            battles: ["battle_normal_rocker"],
            eliteBattles: ["battle_elite_berserker", "battle_elite_hydra"],
            bossBattles: [],       // TODO: 添加Boss战斗
            events: [],            // 事件池（不包含苏生事件）
            blackStores: [],       // TODO: 添加黑市房间
            pools: ["pool_default"]
        },
        // 房间布局：第1步固定为苏生初始化房间
        roomLayout: [
            {
                step: 1,           // 第1步
                roomKey: "init_game_start",  // 固定为苏生初始化房间
                priority: 100      // 高优先级确保生效
            }
            // 第2步及之后使用默认的权重随机生成
        ],
        nextFloors: ["floor_2"],
        nextFloorSelectionMode: "auto"
    },

    // 第2层：中层
    {
        key: "floor_2",
        name: "中层",
        order: 2,
        roomPools: {
            battles: ["battle_normal_rocker"],
            eliteBattles: ["battle_elite_berserker", "battle_elite_hydra"],
            bossBattles: [],
            events: [],
            blackStores: [],
            pools: ["pool_default"]
        },
        nextFloors: ["floor_3"],
        nextFloorSelectionMode: "auto",
        modifiers: {
            enemyHealthMultiplier: 1.2,
            enemyDamageMultiplier: 1.1
        }
    },

    // 第3层：高层
    {
        key: "floor_3",
        name: "高层",
        order: 3,
        roomPools: {
            battles: ["battle_normal_rocker"],
            eliteBattles: ["battle_elite_berserker", "battle_elite_hydra"],
            bossBattles: [],
            events: [],
            blackStores: [],
            pools: ["pool_default"]
        },
        nextFloors: ["floor_4"],
        nextFloorSelectionMode: "auto",
        modifiers: {
            enemyHealthMultiplier: 1.5,
            enemyDamageMultiplier: 1.3
        }
    },

    // 第4层：终层（需要3个印记解锁）
    {
        key: "floor_4",
        name: "终层",
        order: 4,
        roomPools: {
            battles: ["battle_normal_rocker"],
            eliteBattles: ["battle_elite_berserker", "battle_elite_hydra"],
            bossBattles: [],
            events: [],
            blackStores: [],
            pools: ["pool_default"]
        },
        nextFloors: [],  // 最后一层，没有下一层
        unlockCondition: (player) => {
            const markCount = countPlayerMarks(player)
            return {
                unlocked: markCount >= 3,
                reason: markCount < 3 ? `需要3个印记才能进入终层（当前：${markCount}/3）` : undefined
            }
        },
        modifiers: {
            enemyHealthMultiplier: 2.0,
            enemyDamageMultiplier: 1.5,
            rewardMultiplier: 1.5
        }
    }
]
