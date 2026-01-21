/**
 * 初始化事件注册表
 * 注册所有基础事件类型
 */

import { gameEventRegistry } from "./gameEventRegistry"
import { ChoiceEvent } from "@/core/objects/system/GameEvent"
import { RoomSelectEvent } from "@/core/objects/system/RoomSelectEvent"

/**
 * 初始化事件注册表
 * 在应用启动时调用
 */
export function initGameEventRegistry(): void {
    console.log("[initGameEventRegistry] 开始初始化事件注册表")

    // 注册基础事件类型
    gameEventRegistry.registerEventType("choice", ChoiceEvent)
    gameEventRegistry.registerEventType("roomSelect", RoomSelectEvent)

    // TODO: 注册其他事件类型
    // gameEventRegistry.registerEventType("poolEvent", PoolEvent)
    // gameEventRegistry.registerEventType("storeEvent", StoreEvent)
    // gameEventRegistry.registerEventType("randomEvent", RandomEvent)

    console.log("[initGameEventRegistry] 事件注册表初始化完成")
}

/**
 * 为 mod 制作者提供的扩展接口
 * Mod 可以调用此函数注册自定义事件类型
 */
export function registerCustomEventType(
    type: string,
    eventClass: Parameters<typeof gameEventRegistry.registerEventType>[1]
): void {
    gameEventRegistry.registerEventType(type, eventClass)
}
