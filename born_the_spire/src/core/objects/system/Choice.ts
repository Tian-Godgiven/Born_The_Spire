import { nanoid } from "nanoid"
import { reactive } from "vue"
import { Component } from "vue"

/**
 * 选项状态
 */
export type ChoiceState = "available" | "selected" | "locked" | "disabled"

/**
 * 选项配置接口
 */
export interface ChoiceConfig {
    key?: string                    // 选项唯一标识（可选，自动生成）
    title: string                   // 选项标题
    description?: string            // 选项描述
    icon?: string                   // 选项图标
    component?: Component | string  // 自定义 Vue 组件（可选）
    onSelect?: () => void | Promise<void>  // 选择时的回调
    customData?: Record<string, any> // 自定义数据
}

/**
 * 选项基类
 * 表示一个可选择的选项
 */
export class Choice {
    public readonly __key: string
    public readonly title: string
    public readonly description?: string
    public readonly icon?: string
    public readonly component?: Component | string
    public readonly customData?: Record<string, any>
    public state: ChoiceState
    private onSelectCallback?: () => void | Promise<void>

    constructor(config: ChoiceConfig) {
        this.__key = config.key || nanoid()
        this.title = config.title
        this.description = config.description
        this.icon = config.icon
        this.component = config.component
        this.customData = config.customData
        this.onSelectCallback = config.onSelect
        this.state = "available"

        // 使用 Vue 响应式包装
        return reactive(this) as this
    }

    /**
     * 选择此选项
     */
    async select(): Promise<void> {
        if (!this.isAvailable()) {
            console.warn("[Choice] 选项不可选择")
            return
        }

        this.state = "selected"

        // 执行回调
        if (this.onSelectCallback) {
            await this.onSelectCallback()
        }
    }

    /**
     * 判断选项是否可选择
     */
    isAvailable(): boolean {
        return this.state === "available"
    }

    /**
     * 判断选项是否已选择
     */
    isSelected(): boolean {
        return this.state === "selected"
    }

    /**
     * 判断选项是否被锁定
     */
    isLocked(): boolean {
        return this.state === "locked"
    }

    /**
     * 判断选项是否被禁用
     */
    isDisabled(): boolean {
        return this.state === "disabled"
    }

    /**
     * 锁定选项
     */
    lock(): void {
        this.state = "locked"
    }

    /**
     * 解锁选项
     */
    unlock(): void {
        if (this.state === "locked") {
            this.state = "available"
        }
    }

    /**
     * 禁用选项
     */
    disable(): void {
        this.state = "disabled"
    }

    /**
     * 启用选项
     */
    enable(): void {
        if (this.state === "disabled") {
            this.state = "available"
        }
    }
}

/**
 * 选项组配置接口
 */
export interface ChoiceGroupConfig {
    key?: string                    // 选项组唯一标识
    title?: string                  // 选项组标题
    description?: string            // 选项组描述
    choices: Choice[]               // 选项列表
    minSelect?: number              // 最少选择数量（默认 1）
    maxSelect?: number              // 最多选择数量（默认 1）
    onComplete?: (selected: Choice[]) => void | Promise<void>  // 完成选择时的回调
}

/**
 * 选项组类
 * 管理一组选项
 */
export class ChoiceGroup {
    public readonly __key: string
    public readonly title?: string
    public readonly description?: string
    public readonly choices: Choice[]
    public readonly minSelect: number
    public readonly maxSelect: number
    private onCompleteCallback?: (selected: Choice[]) => void | Promise<void>
    private selectedChoices: Choice[] = []

    constructor(config: ChoiceGroupConfig) {
        this.__key = config.key || nanoid()
        this.title = config.title
        this.description = config.description
        this.choices = config.choices
        this.minSelect = config.minSelect ?? 1
        this.maxSelect = config.maxSelect ?? 1
        this.onCompleteCallback = config.onComplete

        // 使用 Vue 响应式包装
        return reactive(this) as this
    }

    /**
     * 选择一个选项
     */
    async selectChoice(choice: Choice): Promise<void> {
        if (!choice.isAvailable()) {
            console.warn("[ChoiceGroup] 选项不可选择")
            return
        }

        // 如果已达到最大选择数量，取消之前的选择
        if (this.selectedChoices.length >= this.maxSelect) {
            if (this.maxSelect === 1) {
                // 单选模式：取消之前的选择
                this.selectedChoices.forEach(c => c.state = "available")
                this.selectedChoices = []
            } else {
                console.warn("[ChoiceGroup] 已达到最大选择数量")
                return
            }
        }

        // 选择此选项
        await choice.select()
        this.selectedChoices.push(choice)

        // 如果达到最大选择数量，自动完成
        if (this.selectedChoices.length >= this.maxSelect) {
            await this.complete()
        }
    }

    /**
     * 取消选择一个选项
     */
    deselectChoice(choice: Choice): void {
        if (!choice.isSelected()) {
            return
        }

        choice.state = "available"
        const index = this.selectedChoices.indexOf(choice)
        if (index > -1) {
            this.selectedChoices.splice(index, 1)
        }
    }

    /**
     * 完成选择
     */
    async complete(): Promise<void> {
        if (this.selectedChoices.length < this.minSelect) {
            console.warn(`[ChoiceGroup] 至少需要选择 ${this.minSelect} 个选项`)
            return
        }

        // 执行回调
        if (this.onCompleteCallback) {
            await this.onCompleteCallback(this.selectedChoices)
        }
    }

    /**
     * 获取已选择的选项
     */
    getSelectedChoices(): Choice[] {
        return this.selectedChoices
    }

    /**
     * 判断是否可以完成选择
     */
    canComplete(): boolean {
        return this.selectedChoices.length >= this.minSelect
    }

    /**
     * 判断是否已完成选择
     */
    isCompleted(): boolean {
        return this.selectedChoices.length >= this.maxSelect
    }
}
