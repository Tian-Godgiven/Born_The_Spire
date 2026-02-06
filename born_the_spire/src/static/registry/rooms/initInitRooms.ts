/**
 * 初始化房间注册模块
 * 负责注册初始化房间类型和配置
 */

import { roomRegistry } from "../roomRegistry"
import { InitRoom } from "@/core/objects/room/InitRoom"
import { getLazyModule } from "@/core/utils/lazyLoader"

/**
 * 初始化初始化房间
 * 注册初始化房间类型和所有初始化房间配置
 */
export async function initInitRooms(): Promise<void> {

    // 注册初始化房间类型（使用 InitRoom 类）
    roomRegistry.registerRoomType("init", InitRoom)

    // 获取初始化房间列表
    const initList = getLazyModule<any[]>('initList')

    // 注册初始化房间配置
    initList.forEach((init: any) => {
        roomRegistry.registerRoomConfig({
            key: init.key,
            type: "init",
            name: init.title,
            description: init.description,
            availableCondition: init.availableCondition,
            customData: {
                initKey: init.key
            }
        })
    })

}
