/**
 * 初始化房间注册表
 * 注册所有基础房间类型和配置
 */

import { roomRegistry } from "./roomRegistry"
import { BattleRoom } from "@/core/objects/room/BattleRoom"
import { RoomSelectRoom } from "@/core/objects/room/RoomSelectRoom"
import { PoolRoom } from "@/core/objects/room/PoolRoom"
import { EventRoom } from "@/core/objects/room/EventRoom"
import { BlackStoreRoom } from "@/core/objects/room/BlackStoreRoom"
import { allRoomConfigs } from "@/static/list/room/roomList"

/**
 * 初始化房间注册表
 * 在应用启动时调用
 */
export function initRoomRegistry(): void {
    console.log("[initRoomRegistry] 开始初始化房间注册表")

    // 1. 注册基础房间类型
    registerBaseRoomTypes()

    // 2. 注册房间配置
    registerRoomConfigs()

    console.log("[initRoomRegistry] 房间注册表初始化完成")
}

/**
 * 注册基础房间类型
 */
function registerBaseRoomTypes(): void {
    // 注册战斗房间类型
    roomRegistry.registerRoomType("battle", BattleRoom)

    // 注册房间选择房间类型
    roomRegistry.registerRoomType("roomSelect", RoomSelectRoom)

    // 注册水池房间类型
    roomRegistry.registerRoomType("pool", PoolRoom)

    // 注册事件房间类型
    roomRegistry.registerRoomType("event", EventRoom)

    // 注册黑市房间类型
    roomRegistry.registerRoomType("blackStore", BlackStoreRoom)

    console.log("[initRoomRegistry] 基础房间类型注册完成")
}

/**
 * 注册房间配置
 */
function registerRoomConfigs(): void {
    roomRegistry.registerRoomConfigs(allRoomConfigs)
    console.log(`[initRoomRegistry] 注册了 ${allRoomConfigs.length} 个房间配置`)
}

/**
 * 为 mod 制作者提供的扩展接口
 * Mod 可以调用此函数注册自定义房间
 */
export function registerCustomRoom(config: Parameters<typeof roomRegistry.registerRoomConfig>[0]): void {
    roomRegistry.registerRoomConfig(config)
}

/**
 * 为 mod 制作者提供的扩展接口
 * Mod 可以调用此函数注册自定义房间类型
 */
export function registerCustomRoomType(
    type: string,
    roomClass: Parameters<typeof roomRegistry.registerRoomType>[1],
    defaultComponent?: Parameters<typeof roomRegistry.registerRoomType>[2]
): void {
    roomRegistry.registerRoomType(type, roomClass, defaultComponent)
}
