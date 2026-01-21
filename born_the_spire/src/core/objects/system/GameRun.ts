import { nanoid } from "nanoid"
import { Room } from "../room/Room"
import { ref } from "vue"
import { floorManager } from "./FloorManager"

//每一局游戏
export class GameRun{
    public towerLevel:number = 0 //当前层数
    public towerStage:string = "bottom"//当前阶层
    public towerFire:number = 0//当前进阶
    public __key:string = nanoid()

    // 房间相关
    public roomHistory: Room[] = []  // 已完成的房间历史
    public currentRoom = ref<Room | null>(null)  // 当前所在房间

    // 楼层管理器
    public floorManager = floorManager

    constructor(

    ){
        // 重置楼层管理器
        this.floorManager.reset()
    }

    /**
     * 进入一个房间
     */
    async enterRoom(room: Room) {
        this.currentRoom.value = room
        room.state = "active"

        // 记录房间类型到楼层管理器
        this.floorManager.recordRoom(room.type)

        // 前进楼层
        this.floorManager.advanceFloor()
        this.towerLevel = this.floorManager.getCurrentFloor()

        await room.enter()
    }

    /**
     * 完成当前房间
     */
    async completeCurrentRoom() {
        const room = this.currentRoom.value
        if (!room) {
            console.warn("[GameRun] 没有正在进行的房间")
            return
        }

        room.state = "completed"
        await room.complete()

        // 将房间加入历史记录
        this.roomHistory.push(room)

        await room.exit()
    }

    /**
     * 离开当前房间（不完成）
     */
    async exitCurrentRoom() {
        const room = this.currentRoom.value
        if (!room) {
            return
        }

        await room.exit()
        this.currentRoom.value = null
    }

    /**
     * 获取已完成的房间数量
     */
    getCompletedRoomCount(): number {
        return this.roomHistory.length
    }

    /**
     * 获取当前层级
     */
    getCurrentLayer(): number {
        return this.towerLevel
    }

    /**
     * 前进到下一层
     */
    advanceToNextLayer() {
        // 楼层管理器会在 enterRoom 时自动前进
        // 这个方法保留用于兼容性
    }

    /**
     * 生成下一层的房间选项
     */
    generateNextFloorRoomOptions(count: number = 3): string[] {
        return this.floorManager.generateNextFloorRoomOptions(count)
    }
}

