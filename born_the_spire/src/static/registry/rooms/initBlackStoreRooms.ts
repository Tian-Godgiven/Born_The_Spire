/**
 * 黑市房间注册模块
 * 负责注册黑市房间类型和配置
 */

import { roomRegistry } from "../roomRegistry"
import { BlackStoreRoom } from "@/core/objects/room/BlackStoreRoom"

/**
 * 初始化黑市房间
 * 注册黑市房间类型和默认配置
 */
export async function initBlackStoreRooms(): Promise<void> {

    // 注册黑市房间类型
    roomRegistry.registerRoomType("blackStore", BlackStoreRoom)

    // 注册默认黑市房间配置
    roomRegistry.registerRoomConfig({
        key: "blackStore_default",
        type: "blackStore",
        name: "黑市",
        description: "神秘的黑市商人"
    })

}
