/**
 * 房间选择事件
 * 用于在每层选择房间
 */

import { ChoiceEvent, ChoiceEventConfig } from "@/core/objects/system/GameEvent"
import { Choice } from "@/core/objects/system/Choice"
import { Room } from "@/core/objects/room/Room"
import { roomRegistry } from "@/static/registry/roomRegistry"
import { nowGameRun } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 房间选择事件配置
 */
export interface RoomSelectEventConfig extends ChoiceEventConfig {
    type: "roomSelect"
    layer: number                   // 层级
    roomKeys: string[]              // 可选房间的 key 列表
}

/**
 * 房间选择事件类
 * 玩家从多个房间中选择一个进入
 */
export class RoomSelectEvent extends ChoiceEvent {
    public readonly layer: number
    private rooms: Room[] = []
    private selectedRoom: Room | null = null

    constructor(config: RoomSelectEventConfig) {
        // 创建房间实例
        const rooms = config.roomKeys
            .map(key => roomRegistry.createRoom(key, config.layer))
            .filter((room): room is Room => room !== null)

        // 创建选项
        const choices = rooms.map(room => {
            return new Choice({
                key: room.__key,
                title: room.getDisplayName(),
                description: room.description,
                icon: room.getIcon(),
                customData: { room }
            })
        })

        // 调用父类构造函数
        super({
            ...config,
            title: config.title || `选择第 ${config.layer} 层的房间`,
            description: config.description || "选择一个房间进入",
            choices,
            minSelect: 1,
            maxSelect: 1
        })

        this.layer = config.layer
        this.rooms = rooms
    }

    /**
     * 开始房间选择事件
     */
    async start(): Promise<void> {
        await super.start()
        newLog([`===== 第 ${this.layer} 层：选择房间 =====`])
    }

    /**
     * 当选择完成时
     */
    protected async onChoicesSelected(selected: Choice[]): Promise<void> {
        const selectedChoice = selected[0]
        this.selectedRoom = selectedChoice.customData?.room as Room

        if (this.selectedRoom) {
            newLog([`选择了房间: ${this.selectedRoom.getDisplayName()}`])

            // 进入选中的房间
            await nowGameRun.value.enterRoom(this.selectedRoom)

            // 处理房间内容
            await this.selectedRoom.process()
        }

        await this.complete()
    }

    /**
     * 获取已选择的房间
     */
    getSelectedRoom(): Room | null {
        return this.selectedRoom
    }

    /**
     * 获取所有可选房间
     */
    getRooms(): Room[] {
        return this.rooms
    }

    protected getDefaultTitle(): string {
        return `选择第 ${this.layer} 层的房间`
    }

    protected getDefaultDescription(): string {
        return "选择一个房间进入"
    }
}
