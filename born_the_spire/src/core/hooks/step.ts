//提供一些在房间之间进行操作的制式函数

import { newError } from "@/ui/hooks/global/alert";
import { nowGameRun } from "../objects/game/run";
import type { RoomType } from "../objects/room/Room";

//前往下一层的房间选择
export async function goToNextStep(){
    //当前房间
    const currentRoom = nowGameRun.currentRoom;
    if(!currentRoom){
        newError(["当前不在一个有效房间中"])
        return
    }
    // 进入房间选择
    const { RoomSelectRoom } = await import("@/core/objects/room/RoomSelectRoom")
    const roomSelectRoom = new RoomSelectRoom({
        type: "roomSelect",
        layer: currentRoom.layer + 1,  // 下一层
        targetLayer: currentRoom.layer + 1,
        roomCount: 3
    })

    await nowGameRun.enterRoom(roomSelectRoom)
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