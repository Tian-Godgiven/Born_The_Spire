/**
 * 事件房间（重构版）
 * 支持从配置列表加载事件，支持原子效果和复杂交互
 */

import { Room, RoomConfig } from "./Room"
import { Choice, ChoiceGroup } from "../system/Choice"
import { EventMap } from "@/static/list/room/event/eventList"
import { executeEventEffects } from "@/static/list/room/event/eventEffectMap"
import { newLog } from "@/ui/hooks/global/log"
import { Component } from "vue"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { roomRegistry } from "@/static/registry/roomRegistry"

/**
 * 事件房间配置
 */
export interface EventRoomConfig extends RoomConfig {
    type: "event"
    eventConfig?: EventMap          // 事件配置（可选，如果不提供则从 eventKey 加载）
    eventKey?: string               // 事件 key（从 eventList 中加载）
}

/**
 * 事件房间类
 * 提供多个选项供玩家选择，支持简单效果和复杂交互
 */
export class EventRoom extends Room {
    public readonly eventConfig: EventMap
    public readonly choiceGroup: ChoiceGroup
    public customComponent?: Component | string  // 自定义事件组件

    constructor(config: EventRoomConfig) {
        super(config)

        // 加载事件配置
        if (config.eventConfig) {
            this.eventConfig = config.eventConfig
        } else if (config.eventKey) {
            this.eventConfig = this.loadEventByKey(config.eventKey)
        } else if (config.customData?.eventKey) {
            // 从 customData 中加载（用于从 roomList 创建）
            this.eventConfig = this.loadEventByKey(config.customData.eventKey)
        } else {
            throw new Error("[EventRoom] 必须提供 eventConfig 或 eventKey")
        }

        // 保存自定义组件
        this.customComponent = this.eventConfig.component

        // 创建选项
        const choices = this.eventConfig.options.map(option => {
            return new Choice({
                title: option.title,
                description: option.description,
                icon: option.icon,
                component: option.component,
                customData: { option },
                onSelect: async () => {
                    await this.onOptionSelected(option)
                }
            })
        })

        // 创建选项组
        this.choiceGroup = new ChoiceGroup({
            title: this.eventConfig.title,
            description: this.eventConfig.description,
            choices,
            minSelect: 1,
            maxSelect: 1,
            onComplete: async () => {
                await this.complete()
            }
        })
    }

    /**
     * 根据事件 key 加载事件配置
     */
    private loadEventByKey(key: string): EventMap {
        const eventList = getLazyModule<EventMap[]>('eventList')
        const config = eventList.find((e: EventMap) => e.key === key)
        if (!config) {
            throw new Error(`[EventRoom] 未找到事件配置: ${key}`)
        }
        return config
    }

    /**
     * 进入事件房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog(["===== 事件 ====="])
        newLog([this.eventConfig.title])
        if (this.eventConfig.description) {
            newLog([this.eventConfig.description])
        }
    }

    /**
     * 处理事件房间
     * 等待玩家选择
     */
    async process(): Promise<void> {
        // 事件房间的处理由 UI 驱动
        // 玩家通过 UI 选择选项
    }

    /**
     * 完成事件房间
     */
    async complete(): Promise<void> {
        this.state = "completed"
        newLog(["===== 事件结束 ====="])
    }

    /**
     * 离开事件房间
     */
    async exit(): Promise<void> {
        // 清理状态
    }

    /**
     * 当选项被选择时
     */
    private async onOptionSelected(option: any): Promise<void> {
        newLog([`选择了: ${option.title}`])

        // 1. 执行简单效果（使用 eventEffectMap）
        if (option.effects && option.effects.length > 0) {
            await executeEventEffects(option.effects)
        }

        // 2. 执行自定义回调
        if (option.customCallback) {
            await option.customCallback()
        }

        // 3. 如果有复杂交互组件，由 UI 层处理
        // 组件会通过 choice.component 传递给 ChoiceContainer
    }

    /**
     * 获取选项组
     */
    getChoiceGroup(): ChoiceGroup {
        return this.choiceGroup
    }

    /**
     * 获取自定义事件组件
     */
    getCustomComponent(): Component | string | undefined {
        return this.customComponent
    }

    getDisplayName(): string {
        return this.name || this.eventConfig.title || "事件"
    }

    getIcon(): string {
        return this.eventConfig.icon || "?"
    }
}
