/**
 * 事件房间（重构版）
 * 支持从配置列表加载事件，支持原子效果和复杂交互
 */

import { Room } from "./Room"
import type { RoomConfig } from "./Room"
import { Choice, ChoiceGroup } from "../system/Choice"
import type { EventMap, EventSceneMap } from "@/core/types/EventMapData"
import { executeEventEffects } from "@/static/list/room/event/eventEffectMap"
import { newLog } from "@/ui/hooks/global/log"
import type { Component } from "vue"
import { getLazyModule } from "@/core/utils/lazyLoader"

/**
 * 事件房间配置
 */
export interface EventRoomConfig extends RoomConfig {
    type: "event"
    eventConfig?: EventMap          // 事件配置（可选，如果不提供则从 eventKey 加载）
    eventKey?: string               // 事件 key（从 eventList 中加载）
    customData?: {                  // 自定义数据（用于从 roomList 创建）
        eventKey?: string
    }
}

/**
 * 事件房间类
 * 提供多个选项供玩家选择，支持简单效果和复杂交互
 * 支持单幕事件和多幕事件
 */
export class EventRoom extends Room {
    public readonly eventConfig: EventMap
    public readonly choiceGroup: ChoiceGroup
    public customComponent?: Component | string  // 自定义事件组件

    // 多幕事件相关
    private isMultiScene: boolean = false       // 是否为多幕事件
    private _currentSceneKey: string | null = null  // 当前幕的 key
    private sceneData: Record<string, any> = {}     // 幕间共享数据

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

        // 判断是单幕还是多幕事件
        this.isMultiScene = !!(this.eventConfig.scenes && this.eventConfig.scenes.length > 0)

        if (this.isMultiScene) {
            // 多幕事件：从第一幕开始
            this._currentSceneKey = this.eventConfig.scenes![0].key
            void this._currentSceneKey  // 抑制未使用警告 - 保留用于未来实现
            const firstScene = this.eventConfig.scenes![0]
            this.choiceGroup = this.createChoiceGroupForScene(firstScene)
        } else {
            // 单幕事件：使用现有逻辑
            const choices = this.createChoicesFromOptions(
                this.eventConfig.options!,
                this.eventConfig.mutuallyExclusiveGroups
            )

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
     * 为指定幕创建 ChoiceGroup
     */
    private createChoiceGroupForScene(scene: EventSceneMap): ChoiceGroup {
        const choices = this.createChoicesFromOptions(scene.options, scene.mutuallyExclusiveGroups)

        return new ChoiceGroup({
            title: scene.title,
            description: scene.description,
            choices,
            minSelect: 1,
            maxSelect: 1,
            onComplete: async () => {
                // 多幕事件不在选择完成时立即 complete
                // 而是等待跳转到下一幕或手动完成
            }
        })
    }

    /**
     * 从选项配置创建 Choice 数组
     */
    private createChoicesFromOptions(
        options: any[],
        mutuallyExclusiveGroups?: string[][]
    ): Choice[] {
        return options
            .filter(option => {
                // 如果有条件函数，检查是否满足条件
                if (option.condition) {
                    return option.condition(this.sceneData)
                }
                return true
            })
            .map(option => {
                // 根据互斥组计算此选项的互斥列表
                let mutuallyExclusiveWith: string[] | undefined = undefined
                if (mutuallyExclusiveGroups && option.key) {
                    for (const group of mutuallyExclusiveGroups) {
                        if (group.includes(option.key)) {
                            mutuallyExclusiveWith = group.filter(k => k !== option.key)
                            break
                        }
                    }
                }

                return new Choice({
                    key: option.key,
                    title: option.title,
                    description: option.description,
                    icon: option.icon,
                    component: option.component,
                    customData: { option },
                    mutuallyExclusiveWith,
                    onSelect: async () => {
                        await this.onOptionSelected(option)
                    }
                })
            })
    }

    /**
     * 跳转到指定幕
     */
    goToScene(sceneKey: string): void {
        if (!this.isMultiScene) {
            console.warn("[EventRoom] 单幕事件不支持幕切换")
            return
        }

        const scene = this.eventConfig.scenes!.find(s => s.key === sceneKey)
        if (!scene) {
            console.error(`[EventRoom] 未找到幕: ${sceneKey}`)
            return
        }

        this._currentSceneKey = sceneKey
        newLog([`===== ${scene.title} =====`])
        if (scene.description) {
            newLog([scene.description])
        }

        // 清理当前选项
        this.choiceGroup.choices.splice(0, this.choiceGroup.choices.length)

        // 创建新幕的选项
        const newChoices = this.createChoicesFromOptions(scene.options, scene.mutuallyExclusiveGroups)
        newChoices.forEach(choice => this.choiceGroup.choices.push(choice))
    }

    /**
     * 获取幕间共享数据
     */
    getSceneData(): Record<string, any> {
        return this.sceneData
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
        // 注意：不要在这里设置 state = "completed"
        // 让 GameRun.completeCurrentRoom() 来设置，以确保地图节点正确完成
        newLog(["===== 事件结束 ====="])

        // 清理所有选项
        this.choiceGroup.choices.splice(0, this.choiceGroup.choices.length)

        // 添加"离开"选项
        const leaveChoice = new Choice({
            title: "离开",
            description: "前往下一层",
            icon: "🚪",
            onSelect: async () => {
                const { completeAndGoNext } = await import("@/core/hooks/step")
                await completeAndGoNext()
            }
        })
        this.choiceGroup.choices.push(leaveChoice)
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

        // 1. 保存数据到 sceneData（多幕事件）
        if (option.saveData) {
            await option.saveData(this.sceneData)
        }

        // 2. 执行简单效果（使用 eventEffectMap）
        if (option.effects && option.effects.length > 0) {
            await executeEventEffects(option.effects)
        }

        // 3. 执行自定义回调
        if (option.customCallback) {
            await option.customCallback(this.sceneData)
        }

        // 4. 如果有复杂交互组件，由 UI 层处理
        // 组件会通过 choice.component 传递给 ChoiceContainer

        // 5. 处理幕切换（多幕事件）
        if (this.isMultiScene) {
            if (option.nextScene) {
                // 有下一幕：延迟跳转
                setTimeout(() => {
                    this.goToScene(option.nextScene)
                }, 500)
            } else {
                // 没有下一幕：这是最后一幕，完成事件
                await this.complete()
            }
        }
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
