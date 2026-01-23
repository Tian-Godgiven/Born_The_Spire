/**
 * 统一组件加载系统
 * 用于在游戏中动态显示自定义组件（事件、升级、奖励等）
 * 支持 Mod 扩展
 */

import { Component, markRaw, reactive } from "vue"

/**
 * 组件布局模式
 */
export type ComponentLayout =
    | "fullscreen"  // 全屏显示
    | "modal"       // 弹窗模式（居中，带遮罩）
    | "inline"      // 内联显示（嵌入当前页面）

/**
 * 组件配置
 */
export interface ComponentConfig {
    component: string | Component  // 组件名（字符串）或组件对象
    data?: any                      // 传递给组件的数据（通过 props）
    layout?: ComponentLayout        // 布局模式（默认 modal）
    onComplete?: (result?: any) => void | Promise<void>  // 完成回调
    onCancel?: () => void | Promise<void>  // 取消回调（可选）
}

/**
 * 当前显示的组件状态
 */
interface ComponentState {
    component: Component | null     // 当前组件
    data: any                       // 组件数据
    layout: ComponentLayout         // 布局模式
    isVisible: boolean              // 是否显示
    resolve?: (result?: any) => void  // Promise resolve
    reject?: (reason?: any) => void   // Promise reject
}

/**
 * 组件管理器类
 */
class ComponentManager {
    // 组件注册表（供 Mod 注册自定义组件）
    private componentRegistry = new Map<string, Component>()

    // 当前组件状态（响应式）
    public state = reactive<ComponentState>({
        component: null,
        data: null,
        layout: "modal",
        isVisible: false
    })

    /**
     * 注册组件
     * @param name 组件名称
     * @param component 组件对象
     */
    registerComponent(name: string, component: Component): void {
        // 使用 markRaw 避免 Vue 将组件对象变成响应式
        this.componentRegistry.set(name, markRaw(component))
        console.log(`[ComponentManager] 注册组件: ${name}`)
    }

    /**
     * 批量注册组件
     * @param components 组件映射表
     */
    registerComponents(components: Record<string, Component>): void {
        for (const [name, component] of Object.entries(components)) {
            this.registerComponent(name, component)
        }
    }

    /**
     * 获取已注册的组件
     * @param name 组件名称
     * @returns 组件对象，如果不存在则返回 null
     */
    getComponent(name: string): Component | null {
        return this.componentRegistry.get(name) || null
    }

    /**
     * 显示组件
     * @param config 组件配置
     * @returns Promise，在组件完成时 resolve
     */
    async showComponent(config: ComponentConfig): Promise<any> {
        // 如果已经有组件在显示，先关闭
        if (this.state.isVisible) {
            console.warn("[ComponentManager] 已有组件在显示，先关闭旧组件")
            this.closeComponent()
        }

        // 解析组件
        let component: Component | null = null
        if (typeof config.component === "string") {
            component = this.getComponent(config.component)
            if (!component) {
                throw new Error(`[ComponentManager] 未找到组件: ${config.component}`)
            }
        } else {
            component = markRaw(config.component)
        }

        // 创建 Promise 用于等待组件完成
        return new Promise((resolve, reject) => {
            this.state.component = component
            this.state.data = config.data || {}
            this.state.layout = config.layout || "modal"
            this.state.isVisible = true
            this.state.resolve = (result?: any) => {
                // 调用完成回调
                if (config.onComplete) {
                    config.onComplete(result)
                }
                resolve(result)
            }
            this.state.reject = (reason?: any) => {
                // 调用取消回调
                if (config.onCancel) {
                    config.onCancel()
                }
                reject(reason)
            }
        })
    }

    /**
     * 关闭当前组件
     * @param result 返回结果（可选）
     */
    closeComponent(result?: any): void {
        if (this.state.resolve) {
            this.state.resolve(result)
        }
        this.resetState()
    }

    /**
     * 取消当前组件
     * @param reason 取消原因（可选）
     */
    cancelComponent(reason?: any): void {
        if (this.state.reject) {
            this.state.reject(reason)
        }
        this.resetState()
    }

    /**
     * 重置状态
     */
    private resetState(): void {
        this.state.component = null
        this.state.data = null
        this.state.layout = "modal"
        this.state.isVisible = false
        this.state.resolve = undefined
        this.state.reject = undefined
    }

    /**
     * 检查是否有组件正在显示
     */
    isComponentVisible(): boolean {
        return this.state.isVisible
    }

    /**
     * 获取所有已注册的组件名称
     */
    getRegisteredComponentNames(): string[] {
        return Array.from(this.componentRegistry.keys())
    }
}

// 导出单例
export const componentManager = new ComponentManager()

// 导出便捷函数
export const registerComponent = componentManager.registerComponent.bind(componentManager)
export const registerComponents = componentManager.registerComponents.bind(componentManager)
export const showComponent = componentManager.showComponent.bind(componentManager)
export const closeComponent = componentManager.closeComponent.bind(componentManager)
export const cancelComponent = componentManager.cancelComponent.bind(componentManager)
