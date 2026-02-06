/**
 * 初始化房间类
 * 用于游戏开始时的特殊房间（如苏生事件）
 * 与普通事件房间分离，避免污染事件池
 */

import { Room, RoomConfig } from "./Room"
import { Choice, ChoiceGroup } from "../system/Choice"
import { InitMap } from "@/static/list/room/init/initList"
import { executeEventEffects } from "@/static/list/room/event/eventEffectMap"
import { newLog } from "@/ui/hooks/global/log"
import { Component } from "vue"
import { getLazyModule } from "@/core/utils/lazyLoader"

/**
 * 初始化房间配置
 */
export interface InitRoomConfig extends RoomConfig {
    type: "init"
    initConfig?: InitMap            // 初始化配置（可选，如果不提供则从 initKey 加载）
    initKey?: string                // 初始化 key（从 initList 中加载）
    customData?: {                  // 自定义数据（用于从 roomList 创建）
        initKey?: string
    }
}

/**
 * 初始化房间类
 * 提供多个选项供玩家选择，用于游戏开始时的特殊事件
 */
export class InitRoom extends Room {
    public readonly initConfig: InitMap
    public readonly choiceGroup: ChoiceGroup
    public customComponent?: Component | string  // 自定义组件

    constructor(config: InitRoomConfig) {
        super(config)

        // 加载初始化配置
        if (config.initConfig) {
            this.initConfig = config.initConfig
        } else if (config.initKey) {
            this.initConfig = this.loadInitByKey(config.initKey)
        } else if (config.customData?.initKey) {
            // 从 customData 中加载（用于从 roomList 创建）
            this.initConfig = this.loadInitByKey(config.customData.initKey)
        } else {
            throw new Error("[InitRoom] 必须提供 initConfig 或 initKey")
        }

        // 保存自定义组件
        this.customComponent = this.initConfig.component

        // 创建选项
        const choices = this.initConfig.options.map(option => {
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
            title: this.initConfig.title,
            description: this.initConfig.description,
            choices,
            minSelect: 1,
            maxSelect: 1,
            onComplete: async () => {
                await this.complete()
            }
        })
    }

    /**
     * 根据初始化 key 加载配置
     */
    private loadInitByKey(key: string): InitMap {
        const initList = getLazyModule<InitMap[]>('initList')
        const config = initList.find((i: InitMap) => i.key === key)
        if (!config) {
            throw new Error(`[InitRoom] 未找到初始化配置: ${key}`)
        }
        return config
    }

    /**
     * 进入初始化房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog(["===== 初始化 ====="])
        newLog([this.initConfig.title])
        if (this.initConfig.description) {
            newLog([this.initConfig.description])
        }
    }

    /**
     * 处理初始化房间
     * 等待玩家选择
     */
    async process(): Promise<void> {
        // 初始化房间的处理由 UI 驱动
        // 玩家通过 UI 选择选项
    }

    /**
     * 完成初始化房间
     */
    async complete(): Promise<void> {
        this.state = "completed"
        newLog(["===== 初始化完成 ====="])
    }

    /**
     * 离开初始化房间
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
     * 获取自定义组件
     */
    getCustomComponent(): Component | string | undefined {
        return this.customComponent
    }

    /**
     * 获取初始化房间的 key
     */
    getInitKey(): string {
        return this.initConfig.key
    }

    getDisplayName(): string {
        return this.name || this.initConfig.title || "初始化"
    }

    getIcon(): string {
        return this.initConfig.icon || "?"
    }
}
