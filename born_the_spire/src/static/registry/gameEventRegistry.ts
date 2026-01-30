/**
 * 事件注册表系统
 * 支持 mod 制作者注册自定义事件类型
 */

import { GameEvent, GameEventConfig } from "@/core/objects/system/GameEvent"

/**
 * 事件类构造函数类型
 */
export type GameEventConstructor = new (config: any) => GameEvent

/**
 * 事件类型注册信息
 */
interface GameEventTypeRegistration {
    eventClass: GameEventConstructor
}

/**
 * 事件注册表类
 * 管理所有事件类型
 */
class GameEventRegistry {
    // 事件类型映射表（type -> EventClass）
    private eventTypes: Map<string, GameEventTypeRegistration> = new Map()

    /**
     * 注册事件类型
     * @param type 事件类型标识
     * @param eventClass 事件类
     */
    registerEventType(type: string, eventClass: GameEventConstructor): void {
        if (this.eventTypes.has(type)) {
            console.warn(`[GameEventRegistry] 事件类型 "${type}" 已存在，将被覆盖`)
        }

        this.eventTypes.set(type, { eventClass })
    }

    /**
     * 获取事件类型注册信息
     * @param type 事件类型
     */
    getEventType(type: string): GameEventTypeRegistration | undefined {
        return this.eventTypes.get(type)
    }

    /**
     * 创建事件实例
     * @param config 事件配置
     */
    createEvent(config: GameEventConfig): GameEvent | null {
        const typeRegistration = this.getEventType(config.type)
        if (!typeRegistration) {
            console.error(`[GameEventRegistry] 未注册事件类型: ${config.type}`)
            return null
        }

        try {
            const event = new typeRegistration.eventClass(config)
            return event
        } catch (error) {
            console.error(`[GameEventRegistry] 创建事件实例失败: ${config.type}`, error)
            return null
        }
    }

    /**
     * 获取所有已注册的事件类型
     */
    getAllEventTypes(): string[] {
        return Array.from(this.eventTypes.keys())
    }

    /**
     * 清空注册表（用于测试）
     */
    clear(): void {
        this.eventTypes.clear()
    }
}

// 导出单例
export const gameEventRegistry = new GameEventRegistry()

// 导出类型供外部使用
export type { GameEventTypeRegistration }
