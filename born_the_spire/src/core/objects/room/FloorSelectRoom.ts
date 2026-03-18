/**
 * 楼层选择房间
 * 用于在完成一个楼层后，让玩家选择下一个楼层的风格/主题
 * 例如：森林、沼泽、火山等不同风格的楼层
 */

import { Room } from "./Room"
import type { RoomConfig } from "./Room"
import { Choice, ChoiceGroup } from "../system/Choice"
import { floorRegistry } from "@/static/registry/floorRegistry"
import { nowGameRun, enterRoom } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"
import type { FloorConfig } from "@/core/types/FloorConfig"

/**
 * 楼层选择房间配置
 */
export interface FloorSelectRoomConfig extends RoomConfig {
    type: "floorSelect"
    floorKeys?: string[]        // 可选楼层的 key 列表（可选，如果不提供则自动获取）
    floorOrder?: number         // 目标楼层顺序（例如：第2个楼层）
}

/**
 * 楼层选择房间类
 * 玩家从多个楼层风格中选择一个
 */
export class FloorSelectRoom extends Room {
    public readonly floorOrder: number
    public readonly choiceGroup: ChoiceGroup
    private availableFloors: FloorConfig[] = []
    private selectedFloor: FloorConfig | null = null

    constructor(config: FloorSelectRoomConfig) {
        super(config)

        // 计算目标楼层顺序
        this.floorOrder = config.floorOrder ?? this.calculateNextFloorOrder()

        // 获取可选楼层
        const floorKeys = config.floorKeys ?? this.getAvailableFloorKeys()

        // 获取楼层配置
        this.availableFloors = floorKeys
            .map(key => floorRegistry.getFloor(key))
            .filter((floor): floor is FloorConfig => floor !== null)

        // 创建选项
        const choices = this.availableFloors.map(floor => {
            return new Choice({
                key: floor.key,
                title: floor.name || floor.key,
                description: floor.description || "未知楼层",
                icon: this.getFloorIcon(floor),
                customData: { floor }
            })
        })

        // 创建选项组
        this.choiceGroup = new ChoiceGroup({
            title: `选择第 ${this.floorOrder} 个楼层`,
            description: "不同的楼层有不同的难度和奖励",
            choices,
            minSelect: 1,
            maxSelect: 1,
            onComplete: async (selected) => {
                await this.onFloorSelected(selected[0])
            }
        })
    }

    /**
     * 计算下一个楼层顺序
     */
    private calculateNextFloorOrder(): number {
        const currentFloorConfig = nowGameRun.floorManager.getCurrentFloorConfig()
        if (currentFloorConfig) {
            return currentFloorConfig.order + 1
        }
        return 1
    }

    /**
     * 获取可用的楼层key列表
     */
    private getAvailableFloorKeys(): string[] {
        // 获取所有楼层
        const allFloors = floorRegistry.getAllFloors()

        // 过滤出目标顺序的楼层
        const targetFloors = allFloors.filter(floor => floor.order === this.floorOrder)

        // 如果没有找到，返回空数组
        if (targetFloors.length === 0) {
            console.warn(`[FloorSelectRoom] 没有找到顺序为 ${this.floorOrder} 的楼层`)
            return []
        }

        return targetFloors.map(floor => floor.key)
    }

    /**
     * 获取楼层图标
     */
    private getFloorIcon(floor: FloorConfig): string {
        // 可以根据楼层主题返回不同的图标
        if (floor.key.includes("forest")) return "🌲"
        if (floor.key.includes("swamp")) return "🌿"
        if (floor.key.includes("volcano")) return "🌋"
        if (floor.key.includes("ice")) return "❄️"
        if (floor.key.includes("desert")) return "🏜️"
        return "🗺️"
    }

    /**
     * 进入楼层选择房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog([`===== 选择第 ${this.floorOrder} 个楼层 =====`])
    }

    /**
     * 处理楼层选择
     * 等待玩家选择
     */
    async process(): Promise<void> {
        // 楼层选择由 UI 驱动
        // 玩家通过 UI 选择楼层
    }

    /**
     * 完成楼层选择
     */
    async complete(): Promise<void> {
        this.state = "completed"
        if (this.selectedFloor) {
            newLog([`选择了楼层: ${this.selectedFloor.name || this.selectedFloor.key}`])
        }
    }

    /**
     * 离开楼层选择房间
     */
    async exit(): Promise<void> {
        // 清理状态
    }

    /**
     * 当楼层被选择时
     */
    private async onFloorSelected(choice: Choice): Promise<void> {
        this.selectedFloor = choice.customData?.floor as FloorConfig

        if (!this.selectedFloor) {
            console.error("[FloorSelectRoom] 选中的楼层配置为空")
            return
        }

        // 完成当前房间（楼层选择房间）
        await nowGameRun.completeCurrentRoom()

        // 设置新楼层
        nowGameRun.floorManager.setCurrentFloor(this.selectedFloor.key)

        // 生成新楼层的地图
        const floorMap = nowGameRun.floorManager.generateMap(this.selectedFloor.mapConfig)

        // 检查是否有楼层入口事件
        if (this.selectedFloor.entranceEvent) {
            // 进入楼层入口事件
            await enterRoom(this.selectedFloor.entranceEvent, 0)
        } else {
            // 直接进入地图UI或第一个房间选择
            // 这里应该显示地图UI，暂时使用旧的房间选择方式
            const { RoomSelectRoom } = await import("@/core/objects/room/RoomSelectRoom")
            const roomSelectRoom = new RoomSelectRoom({
                type: "roomSelect",
                layer: 1,
                targetLayer: 1,
                useMapNodes: true
            })

            await nowGameRun.enterRoom(roomSelectRoom)
        }
    }

    /**
     * 获取已选择的楼层
     */
    getSelectedFloor(): FloorConfig | null {
        return this.selectedFloor
    }

    /**
     * 获取所有可选楼层
     */
    getAvailableFloors(): FloorConfig[] {
        return this.availableFloors
    }

    /**
     * 获取选项组
     */
    getChoiceGroup(): ChoiceGroup {
        return this.choiceGroup
    }

    getDisplayName(): string {
        return "选择楼层"
    }

    getIcon(): string {
        return "🗺️"
    }
}
