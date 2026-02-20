/* 
 * 房间选择注册模块
 * 负责注册房间选择类型和配置
 */

import { roomRegistry } from "../roomRegistry"
import { RoomSelectRoom } from "@/core/objects/room/RoomSelectRoom"

/**
 * 初始化房间选择
 * 注册房间选择类型和默认配置
 */
export async function initRoomSelectRooms(): Promise<void> {

    // 注册房间选择类型
    roomRegistry.registerRoomType("roomSelect", RoomSelectRoom)

    // 注册默认房间选择配置
    roomRegistry.registerRoomConfig({
        key: "room_select_default",
        type: "roomSelect",
        name: "选择房间",
        description: "选择下一个要进入的房间"
    })

}
