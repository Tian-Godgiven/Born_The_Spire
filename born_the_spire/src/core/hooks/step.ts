//提供一些在房间之间进行操作的制式函数

import { newError } from "@/ui/hooks/global/alert";
import { nowGameRun } from "../objects/game/run";
import type { RoomType } from "../objects/room/Room";

/**
 * 显示地图UI的回调（由UI层设置）
 * 这样可以避免核心逻辑依赖UI组件
 */
let showMapCallback: (() => void) | null = null

/**
 * 设置显示地图的回调
 * 在UI层（例如 running.vue）调用此函数注册回调
 */
export function setShowMapCallback(callback: () => void) {
    showMapCallback = callback
}

/**
 * 获取显示地图的回调
 * 用于在其他地方（如Top组件）调用地图显示
 */
export function getShowMapCallback(): (() => void) | null {
    return showMapCallback
}

//前往下一层的房间选择
export async function goToNextStep(){
    //当前房间
    const currentRoom = nowGameRun.currentRoom;
    if(!currentRoom){
        newError(["当前不在一个有效房间中"])
        return
    }

    // 检查是否有地图
    const hasMap = nowGameRun.floorManager.getCurrentMap() !== null

    if (!hasMap) {
        newError(["当前楼层没有地图，无法前往下一步"])
        return
    }

    // 检查是否有显示地图的回调
    if (!showMapCallback) {
        newError(["地图UI未初始化，请检查 Running.vue 是否正确注册回调"])
        return
    }

    // 显示地图UI让玩家选择下一个房间
    showMapCallback()
}

//完成当前房间并前往下一步（最常用的组合）
export async function completeAndGoNext(){
    await nowGameRun.completeCurrentRoom()
    await goToNextStep()
}

//直接进入指定类型的房间（跳过房间选择）
export async function goToRoomType(roomType: RoomType, config?: any){
    const currentRoom = nowGameRun.currentRoom;
    const layer = currentRoom ? currentRoom.layer + 1 : 1

    let room
    switch(roomType){
        case "battle":
            const { BattleRoom } = await import("@/core/objects/room/BattleRoom")
            room = new BattleRoom({ type: "battle", layer, ...config })
            break
        case "event":
            const { EventRoom } = await import("@/core/objects/room/EventRoom")
            room = new EventRoom({ type: "event", layer, ...config })
            break
        case "pool":
            const { PoolRoom } = await import("@/core/objects/room/PoolRoom")
            room = new PoolRoom({ type: "pool", layer, ...config })
            break
        case "blackStore":
            const { BlackStoreRoom } = await import("@/core/objects/room/BlackStoreRoom")
            room = new BlackStoreRoom({ type: "blackStore", layer, ...config })
            break
        case "roomSelect":
            const { RoomSelectRoom } = await import("@/core/objects/room/RoomSelectRoom")
            room = new RoomSelectRoom({ type: "roomSelect", layer, roomCount: 3, ...config })
            break
        default:
            newError(["未知的房间类型", roomType])
            return
    }

    await nowGameRun.enterRoom(room)
}

//完成当前房间并直接进入指定类型的房间
export async function completeAndGoToRoomType(roomType: RoomType, config?: any){
    await nowGameRun.completeCurrentRoom()
    await goToRoomType(roomType, config)
}