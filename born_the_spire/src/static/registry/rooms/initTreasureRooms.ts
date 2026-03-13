import { roomRegistry } from "../roomRegistry"
import { TreasureRoom } from "@/core/objects/room/TreasureRoom"
import TreasureRoomComponent from "@/ui/page/Scene/running/TreasureRoom.vue"
import { treasureList } from "@/static/list/room/treasure/treasureList"

export async function initTreasureRooms(): Promise<void> {
    roomRegistry.registerRoomType("treasure", TreasureRoom, TreasureRoomComponent)

    for (const config of treasureList) {
        roomRegistry.registerRoomConfig({
            key: config.key!,
            type: config.type,
            name: config.name,
            description: config.description,
            customData: {
                baseGoldAmount: config.baseGoldAmount,
                goldPerLayer: config.goldPerLayer,
                goldVariance: config.goldVariance,
                relicFilter: config.relicFilter,
                markKey: config.markKey
            }
        })
    }

    console.log(`[TreasureRooms] 已注册 ${treasureList.length} 个宝箱房间`)
}
