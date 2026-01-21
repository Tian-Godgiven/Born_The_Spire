/**
 * 房间列表
 * 定义游戏中的所有房间配置
 */

import { RoomMap } from "@/static/registry/roomRegistry"

/**
 * 战斗房间配置列表
 */
export const battleRoomList: RoomMap[] = [
    {
        key: "battle_normal_slime",
        type: "battle",
        name: "史莱姆巢穴",
        description: "一群史莱姆聚集的地方",
        customData: {
            battleType: "normal",
            enemyConfigs: ["test_enemy_slime"]  // 敌人 key 列表
        }
    },
    {
        key: "battle_elite_berserker",
        type: "battle",
        name: "狂战士领地",
        description: "强大的狂战士守护着这里",
        customData: {
            battleType: "elite",
            enemyConfigs: ["test_enemy_berserker"]
        }
    }
]

/**
 * 事件房间配置列表
 */
export const eventRoomList: RoomMap[] = [
    {
        key: "event_mysterious_merchant",
        type: "event",
        name: "神秘商人",
        description: "遇到了一个神秘的商人",
        customData: {
            eventKey: "event_mysterious_merchant"  // 从 eventList 中加载
        }
    },
    {
        key: "event_treasure_chest",
        type: "event",
        name: "宝箱",
        description: "发现了一个宝箱",
        customData: {
            eventKey: "event_treasure_chest"
        }
    },
    {
        key: "event_healing_spring",
        type: "event",
        name: "治疗泉水",
        description: "发现了治疗泉水",
        customData: {
            eventKey: "event_healing_spring"
        }
    },
    {
        key: "event_gambling",
        type: "event",
        name: "赌博",
        description: "遇到了赌徒",
        customData: {
            eventKey: "event_gambling"
        }
    },
    {
        key: "event_card_matching",
        type: "event",
        name: "记忆游戏",
        description: "参与记忆配对游戏",
        customData: {
            eventKey: "event_card_matching"
        }
    }
]

/**
 * 水池房间配置列表
 */
export const poolRoomList: RoomMap[] = [
    {
        key: "pool_default",
        type: "pool",
        name: "宁静水池",
        description: "一个可以休息和提升的地方"
    }
]

/**
 * 黑市房间配置列表
 */
export const blackStoreRoomList: RoomMap[] = [
    {
        key: "blackStore_default",
        type: "blackStore",
        name: "黑市",
        description: "进行着可疑交易的窝点"
    }
]

/**
 * 所有房间配置
 */
export const allRoomConfigs: RoomMap[] = [
    ...battleRoomList,
    ...eventRoomList,
    ...poolRoomList,
    ...blackStoreRoomList
]
