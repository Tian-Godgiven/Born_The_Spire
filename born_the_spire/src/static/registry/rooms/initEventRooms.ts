/**
 * 事件房间注册模块
 * 负责注册事件房间类型和配置
 */

import { roomRegistry } from "../roomRegistry"
import { EventRoom } from "@/core/objects/room/EventRoom"
import { getLazyModule } from "@/core/utils/lazyLoader"

/**
 * 初始化事件房间
 * 注册事件房间类型和所有事件房间配置
 */
export async function initEventRooms(): Promise<void> {
    console.log('[initEventRooms] 开始注册事件房间...')

    // 注册事件房间类型
    roomRegistry.registerRoomType("event", EventRoom)
    console.log('[initEventRooms] 事件房间类型注册完成')

    // 获取事件列表
    const eventList = getLazyModule<any[]>('eventList')

    // 注册事件房间配置
    eventList.forEach((event: any) => {
        roomRegistry.registerRoomConfig({
            key: event.key,
            type: "event",
            name: event.title,
            description: event.description,
            customData: {
                eventKey: event.key
            }
        })
    })

    console.log(`[initEventRooms] 已注册 ${eventList.length} 个事件房间配置`)
}
