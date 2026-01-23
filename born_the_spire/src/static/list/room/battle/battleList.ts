/**
 * 战斗房间配置列表
 * 定义所有预设的战斗房间
 */

import { BattleRoomType } from "@/core/objects/room/Room"

export interface BattleRoomConfig {
    key: string
    name: string
    description: string
    battleType: BattleRoomType
    enemyConfigs: string[]  // 敌人 key 列表
}

export const battleList: BattleRoomConfig[] = [
    {
        key: "battle_normal_slime",
        name: "史莱姆巢穴",
        description: "一群史莱姆聚集的地方",
        battleType: "normal",
        enemyConfigs: ["test_enemy_slime","test_enemy_slime","test_enemy_slime"]
    },
    {
        key: "battle_normal_rocker",
        name: "小石块",
        description: "坚硬的硅基生物",
        battleType: "normal",
        enemyConfigs: ["original_enemy_00001"]
    },
    {
        key: "battle_elite_berserker",
        name: "狂战士领地",
        description: "强大的狂战士守护着这里",
        battleType: "elite",
        enemyConfigs: ["test_enemy_berserker"]
    }
]
