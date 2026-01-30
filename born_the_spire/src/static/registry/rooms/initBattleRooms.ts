/**
 * 战斗房间注册模块
 * 负责注册战斗房间类型和配置
 */

import { roomRegistry } from "../roomRegistry"
import { BattleRoom } from "@/core/objects/room/BattleRoom"
import { battleList } from "@/static/list/room/battle/battleList"

/**
 * 初始化战斗房间
 * 注册战斗房间类型和所有战斗房间配置
 */
export async function initBattleRooms(): Promise<void> {

    // 注册战斗房间类型
    roomRegistry.registerRoomType("battle", BattleRoom)

    // 注册战斗房间配置
    battleList.forEach(battle => {
        roomRegistry.registerRoomConfig({
            key: battle.key,
            type: "battle",
            name: battle.name,
            description: battle.description,
            customData: {
                battleType: battle.battleType,
                enemyConfigs: battle.enemyConfigs
            }
        })
    })

}
