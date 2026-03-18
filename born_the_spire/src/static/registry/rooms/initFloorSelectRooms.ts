import { roomRegistry } from "../roomRegistry"
import { FloorSelectRoom } from "@/core/objects/room/FloorSelectRoom"
import FloorSelectRoomComponent from "@/ui/page/Scene/running/FloorSelectRoom.vue"

export async function initFloorSelectRooms(): Promise<void> {
    roomRegistry.registerRoomType("floorSelect", FloorSelectRoom, FloorSelectRoomComponent)
}
