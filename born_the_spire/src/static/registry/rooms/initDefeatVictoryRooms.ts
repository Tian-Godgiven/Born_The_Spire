import { roomRegistry } from "../roomRegistry"
import { DefeatRoom } from "@/core/objects/room/DefeatRoom"
import { VictoryRoom } from "@/core/objects/room/VictoryRoom"
import DefeatRoomComponent from "@/ui/page/Scene/running/DefeatRoom.vue"
import VictoryRoomComponent from "@/ui/page/Scene/running/VictoryRoom.vue"

export async function initDefeatVictoryRooms(): Promise<void> {
    roomRegistry.registerRoomType("defeat", DefeatRoom, DefeatRoomComponent)
    roomRegistry.registerRoomType("victory", VictoryRoom, VictoryRoomComponent)
}
