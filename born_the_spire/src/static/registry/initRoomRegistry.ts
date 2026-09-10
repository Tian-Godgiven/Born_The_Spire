/**
 * Mod 扩展入口：注册自定义房间类型和配置
 */

import { roomRegistry } from "./roomRegistry"

/**
 * 注册自定义房间配置
 */
export function registerCustomRoom(config: Parameters<typeof roomRegistry.registerRoomConfig>[0]): void {
    roomRegistry.registerRoomConfig(config)
}

/**
 * 注册自定义房间类型（类 + 进房 Vue 页）
 */
export function registerCustomRoomType(
    type: string,
    roomClass: Parameters<typeof roomRegistry.registerRoomType>[1],
    defaultComponent: Parameters<typeof roomRegistry.registerRoomType>[2]
): void {
    roomRegistry.registerRoomType(type, roomClass, defaultComponent)
}
