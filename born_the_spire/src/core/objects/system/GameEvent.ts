import { nanoid } from "nanoid"
import { reactive } from "vue"
import { Component } from "vue"
import { Choice, ChoiceGroup } from "./Choice"

/**
 * 事件状态
 */
export type GameEventState = "pending" | "active" | "completed"

/**
 * 事件配置接口
 */
export interface GameEventConfig {
    key?: string                    // 事件唯一标识
    type: string                    // 事件类型
    title?: string                  // 事件标题
    description?: string            // 事件描述
    component?: Component           // 自定义 Vue 组件
    customData?: Record<string, any> // 自定义数据
}

/**
 * 游戏事件基类
 * 所有游戏事件的抽象基类
 */
export abstract class GameEvent {
    public readonly __key: string
    public readonly type: string
    public readonly title?: string
    public readonly description?: string
    public readonly component?: Component
    public readonly customData?: Record<string, any>
    public state: GameEventState

    constructor(config: GameEventConfig) {
        this.__key = config.key || nanoid()
        this.type = config.type
        this.title = config.title
        this.description = config.description
        this.component = config.component
        this.customData = config.customData
        this.state = "pending"

        // 使用 Vue 响应式包装
        return reactive(this) as this
    }

    /**
     * 开始事件
     */
    abstract start(): void | Promise<void>

    /**
     * 处理事件
     */
    abstract process(): void | Promise<void>

    /**
     * 完成事件
     */
    abstract complete(): void | Promise<void>

    /**
     * 判断事件是否已完成
     */
    isCompleted(): boolean {
        return this.state === "completed"
    }

    /**
     * 判断事件是否正在进行
     */
    isActive(): boolean {
        return this.state === "active"
    }

    /**
     * 获取显示标题
     */
    getDisplayTitle(): string {
        return this.title || this.getDefaultTitle()
    }

    /**
     * 获取默认标题（子类可重写）
     */
    protected getDefaultTitle(): string {
        return "未知事件"
    }

    /**
     * 获取显示描述
     */
    getDisplayDescription(): string {
        return this.description || this.getDefaultDescription()
    }

    /**
     * 获取默认描述（子类可重写）
     */
    protected getDefaultDescription(): string {
        return ""
    }
}

/**
 * 选择型事件配置
 */
export interface ChoiceEventConfig extends GameEventConfig {
    choices?: Choice[]              // 选项列表
    choiceGroup?: ChoiceGroup       // 或者直接提供 ChoiceGroup
    minSelect?: number              // 最少选择数量
    maxSelect?: number              // 最多选择数量
}

/**
 * 选择型事件类
 * 需要玩家做出选择的事件
 */
export class ChoiceEvent extends GameEvent {
    public readonly choiceGroup: ChoiceGroup

    constructor(config: ChoiceEventConfig) {
        super(config)

        // 创建或使用提供的 ChoiceGroup
        if (config.choiceGroup) {
            this.choiceGroup = config.choiceGroup
        } else {
            this.choiceGroup = new ChoiceGroup({
                title: config.title,
                description: config.description,
                choices: config.choices || [],
                minSelect: config.minSelect,
                maxSelect: config.maxSelect,
                onComplete: async (selected) => {
                    await this.onChoicesSelected(selected)
                }
            })
        }
    }

    /**
     * 开始事件
     */
    async start(): Promise<void> {
        this.state = "active"
    }

    /**
     * 处理事件
     * 等待玩家选择
     */
    async process(): Promise<void> {
        // 选择型事件的处理由 UI 驱动
        // 玩家通过 UI 选择选项
    }

    /**
     * 完成事件
     */
    async complete(): Promise<void> {
        this.state = "completed"
    }

    /**
     * 当选择完成时调用
     * 子类可重写此方法来处理选择结果
     */
    protected async onChoicesSelected(selected: Choice[]): Promise<void> {
        // 默认实现：直接完成事件
        await this.complete()
    }

    /**
     * 获取选项组
     */
    getChoiceGroup(): ChoiceGroup {
        return this.choiceGroup
    }
}
