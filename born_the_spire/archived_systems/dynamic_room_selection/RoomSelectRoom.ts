/**
 * 房间选择房间
 * 特殊的房间类型，用于让玩家选择下一个要进入的房间
 */

import { Room, RoomConfig } from "./Room"
import { Choice, ChoiceGroup } from "../system/Choice"
import { roomRegistry } from "@/static/registry/roomRegistry"
import { nowGameRun, enterRoom } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 房间选择房间配置
 */
export interface RoomSelectRoomConfig extends RoomConfig {
    type: "roomSelect"
    targetLayer?: number        // 目标层级（可选，如果不提供则自动计算）
    roomKeys?: string[]         // 可选房间的 key 列表（可选，如果不提供则自动生成）
    roomCount?: number          // 房间选项数量（默认 3）
}

/**
 * 房间选择房间类
 * 玩家从多个房间中选择一个进入
 */
export class RoomSelectRoom extends Room {
    public readonly targetLayer: number
    public readonly choiceGroup: ChoiceGroup
    private availableRooms: Room[] = []
    private selectedRoom: Room | null = null

    constructor(config: RoomSelectRoomConfig) {
        super(config)

        // 计算目标层级
        this.targetLayer = config.targetLayer ?? nowGameRun.floorManager.getCurrentFloor() + 1

        // 生成或使用提供的房间选项
        const roomKeys = config.roomKeys ?? nowGameRun.generateNextFloorRoomOptions(config.roomCount ?? 3)

        // 创建可选房间实例
        this.availableRooms = roomKeys
            .map(key => roomRegistry.createRoom(key, this.targetLayer))
            .filter((room): room is Room => room !== null)

        // 创建选项
        const choices = this.availableRooms.map(room => {
            return new Choice({
                key: room.__key,
                title: room.getDisplayName(),
                description: room.description,
                icon: room.getIcon(),
                customData: { room }
            })
        })

        // 创建选项组
        this.choiceGroup = new ChoiceGroup({
            title: `选择第 ${config.targetLayer} 层的房间`,
            description: "选择一个房间进入",
            choices,
            minSelect: 1,
            maxSelect: 1,
            onComplete: async (selected) => {
                await this.onRoomSelected(selected[0])
            }
        })
    }

    /**
     * 进入房间选择房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog([`===== 第 ${this.targetLayer} 层：选择房间 =====`])
    }

    /**
     * 处理房间选择
     * 等待玩家选择
     */
    async process(): Promise<void> {
        // 房间选择由 UI 驱动
        // 玩家通过 UI 选择房间
    }

    /**
     * 完成房间选择
     */
    async complete(): Promise<void> {
        this.state = "completed"
        newLog([`选择了房间: ${this.selectedRoom?.getDisplayName()}`])
    }

    /**
     * 离开房间选择房间
     */
    async exit(): Promise<void> {
        // 清理状态
    }

    /**
     * 当房间被选择时
     */
    private async onRoomSelected(choice: Choice): Promise<void> {
        this.selectedRoom = choice.customData?.room as Room

        if (this.selectedRoom) {
            // 完成当前房间（房间选择房间）
            await this.complete()

            // 使用独立的 enterRoom 函数进入选中的房间
            await enterRoom(this.selectedRoom)
        }
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
    getAvailableRooms(): Room[] {
        return this.availableRooms
    }

    /**
     * 获取选项组
     */
    getChoiceGroup(): ChoiceGroup {
        return this.choiceGroup
    }

    getDisplayName(): string {
        return "选择房间"
    }

    getIcon(): string {
        return "🚪"
    }
}

// ==================== 自动注册 ====================
