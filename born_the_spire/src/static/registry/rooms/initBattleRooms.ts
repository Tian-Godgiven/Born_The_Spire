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
    roomRegistry.registerRoomType("eliteBattle", BattleRoom)
    roomRegistry.registerRoomType("bossBattle", BattleRoom)

    // 注册战斗房间配置
    battleList.forEach(battle => {
        // 根据 battleType 确定房间类型
        let roomType: string
        switch (battle.battleType) {
            case "elite":
                roomType = "eliteBattle"
                break
            case "boss":
                roomType = "bossBattle"
                break
            case "normal":
            default:
                roomType = "battle"
                break
        }

        roomRegistry.registerRoomConfig({
            key: battle.key,
            type: roomType,
            name: battle.name,
            description: battle.description,
            customData: {
                battleType: battle.battleType,
                enemyConfigs: battle.enemyConfigs
            }
        })
    })

}
