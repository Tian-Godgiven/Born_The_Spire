import { nanoid } from "nanoid"
import { reactive } from "vue"
import { Component } from "vue"

/**
 * 奖励状态
 */
export type RewardState = "available" | "claimed" | "locked"

/**
 * 奖励配置接口
 */
export interface RewardConfig {
    key?: string              // 奖励唯一标识（可选，自动生成）
    type: string              // 奖励类型
    title?: string            // 奖励标题
    description?: string      // 奖励描述
    icon?: string             // 奖励图标
    component?: Component     // 自定义 Vue 组件（可选）
    customData?: Record<string, any> // 自定义数据
}

/**
 * 奖励基类
 * 所有奖励类型的抽象基类
 */
export abstract class Reward {
    public readonly __key: string       // 奖励唯一标识
    public readonly type: string        // 奖励类型
    public readonly title?: string      // 奖励标题
    public readonly description?: string // 奖励描述
    public readonly icon?: string       // 奖励图标
    public readonly component?: Component // 自定义组件
    public readonly customData?: Record<string, any> // 自定义数据
    public state: RewardState           // 奖励状态

    constructor(config: RewardConfig) {
        this.__key = config.key || nanoid()
        this.type = config.type
        this.title = config.title
        this.description = config.description
        this.icon = config.icon
        this.component = config.component
        this.customData = config.customData
        this.state = "available"

        // 使用 Vue 响应式包装
        return reactive(this) as this
    }

    /**
     * 领取奖励
     * 子类必须实现此方法来定义具体的奖励逻辑
     */
    abstract claim(): void | Promise<void>

    /**
     * 判断奖励是否可领取
     */
    isAvailable(): boolean {
        return this.state === "available"
    }

    /**
     * 判断奖励是否已领取
     */
    isClaimed(): boolean {
        return this.state === "claimed"
    }

    /**
     * 判断奖励是否被锁定
     */
    isLocked(): boolean {
        return this.state === "locked"
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
        return "未知奖励"
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

    /**
     * 获取显示图标
     */
    getDisplayIcon(): string {
        return this.icon || this.getDefaultIcon()
    }

    /**
     * 获取默认图标（子类可重写）
     */
    protected getDefaultIcon(): string {
        return "?"
    }

    /**
     * 标记为已领取
     */
    protected markAsClaimed(): void {
        this.state = "claimed"
    }

    /**
     * 锁定奖励
     */
    lock(): void {
        this.state = "locked"
    }

    /**
     * 解锁奖励
     */
    unlock(): void {
        if (this.state === "locked") {
            this.state = "available"
        }
    }
}
