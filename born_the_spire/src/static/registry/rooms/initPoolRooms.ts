/**
 * 水池房间注册模块
 * 负责注册水池房间类型和配置
 */

import { roomRegistry } from "../roomRegistry"
import { PoolRoom } from "@/core/objects/room/PoolRoom"

/**
 * 初始化水池房间
 * 注册水池房间类型和默认配置
 */
export async function initPoolRooms(): Promise<void> {
    console.log('[initPoolRooms] 开始注册水池房间...')

    // 注册水池房间类型
    roomRegistry.registerRoomType("pool", PoolRoom)
    console.log('[initPoolRooms] 水池房间类型注册完成')

    // 注册默认水池房间配置
    roomRegistry.registerRoomConfig({
        key: "pool_default",
        type: "pool",
        name: "水池",
        description: "可以休息和提升的地方"
    })

    console.log('[initPoolRooms] 水池房间配置注册完成')
}
