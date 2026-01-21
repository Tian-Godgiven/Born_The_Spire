/**
 * 水池房间
 * 玩家可以在这里休息和提升
 */

import { Room, RoomConfig } from "./Room"
import { Choice, ChoiceGroup } from "../system/Choice"
import { nowPlayer } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 水池房间配置
 */
export interface PoolRoomConfig extends RoomConfig {
    type: "pool"
    absorbAmount?: number       // 汲取物质数量（默认根据层级计算）
    allowBloodMark?: boolean    // 是否允许染血（默认 true）
}

/**
 * 水池房间类
 * 提供汲取、升级、染血三种选择
 */
export class PoolRoom extends Room {
    public readonly absorbAmount: number
    public readonly allowBloodMark: boolean
    public readonly choiceGroup: ChoiceGroup
    private hasBloodMark: boolean = false  // 全局是否已染血

    constructor(config: PoolRoomConfig) {
        super(config)

        // 计算汲取物质数量（根据层级）
        this.absorbAmount = config.absorbAmount ?? this.calculateAbsorbAmount(config.layer)
        this.allowBloodMark = config.allowBloodMark ?? true

        // TODO: 从全局状态检查是否已染血
        // this.hasBloodMark = nowGameRun.value.hasBloodMark

        // 创建选项
        const choices = this.createChoices()

        // 创建选项组
        this.choiceGroup = new ChoiceGroup({
            title: "水池",
            description: "选择一个行为",
            choices,
            minSelect: 1,
            maxSelect: 1,
            onComplete: async () => {
                await this.complete()
            }
        })
    }

    /**
     * 创建选项
     */
    private createChoices(): Choice[] {
        const choices: Choice[] = []

        // 选项1：汲取
        choices.push(new Choice({
            title: "汲取",
            description: `吸收水池中的物质，获得 ${this.absorbAmount} 物质`,
            icon: "💧",
            onSelect: async () => {
                await this.onAbsorb()
            }
        }))

        // 选项2：升级
        choices.push(new Choice({
            title: "升级",
            description: "消耗物质提升器官等级（可重复）",
            icon: "⬆️",
            onSelect: async () => {
                await this.onUpgrade()
            }
        }))

        // 选项3：染血（如果允许且未染血）
        if (this.allowBloodMark && !this.hasBloodMark) {
            choices.push(new Choice({
                title: "染血",
                description: "获得红色印记（全局只能进行1次）",
                icon: "🩸",
                onSelect: async () => {
                    await this.onBloodMark()
                }
            }))
        }

        return choices
    }

    /**
     * 进入水池房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog(["===== 进入水池 ====="])
        newLog(["一个宁静的休息处..."])
    }

    /**
     * 处理水池房间
     * 等待玩家选择
     */
    async process(): Promise<void> {
        // 水池房间的处理由 UI 驱动
        // 玩家通过 UI 选择行为
    }

    /**
     * 完成水池房间
     */
    async complete(): Promise<void> {
        this.state = "completed"
        newLog(["===== 离开水池 ====="])
    }

    /**
     * 离开水池房间
     */
    async exit(): Promise<void> {
        // 清理状态
    }

    /**
     * 汲取行为
     */
    private async onAbsorb(): Promise<void> {
        newLog([`汲取了 ${this.absorbAmount} 物质`])

        // TODO: 实现物质系统后，给玩家添加物质
        // nowPlayer.addMaterial(this.absorbAmount)
    }

    /**
     * 升级行为
     */
    private async onUpgrade(): Promise<void> {
        newLog(["打开器官升级界面..."])

        // TODO: 打开器官升级 UI
        // 这里应该触发一个全局事件或调用 UI 系统
    }

    /**
     * 染血行为
     */
    private async onBloodMark(): Promise<void> {
        newLog(["获得了红色印记！"])

        // TODO: 实现红色印记系统
        // nowPlayer.addBloodMark()
        // nowGameRun.value.hasBloodMark = true

        this.hasBloodMark = true
    }

    /**
     * 计算汲取物质数量（根据层级）
     */
    private calculateAbsorbAmount(layer: number): number {
        // 基础物质 + 层级加成
        return 50 + layer * 10
    }

    /**
     * 获取选项组
     */
    getChoiceGroup(): ChoiceGroup {
        return this.choiceGroup
    }

    getDisplayName(): string {
        return this.name || "水池"
    }

    getIcon(): string {
        return "〜"
    }
}
