/**
 * 依赖注入容器
 *
 * 统一管理对象创建和依赖关系
 * 提供轻量级的服务注册和解析机制
 */

import type { Entity, EntityMap } from "./objects/system/Entity"
import type { Item } from "./objects/item/Item"
import type { Card } from "./objects/item/Subclass/Card"
import type { Potion } from "./objects/item/Subclass/Potion"
import type { Relic } from "./objects/item/Subclass/Relic"
import type { Organ } from "./objects/target/Organ"
import type { Player } from "./objects/target/Player"
import type { Enemy } from "./objects/target/Enemy"
import type { ActionEvent } from "./objects/system/ActionEvent"
import type { EffectUnit } from "./objects/system/effect/EffectUnit"
import type { ModifierManager } from "./managers/ModifierManager"

type Factory<T> = () => T
type ServiceKey = string

class Container {
    private services = new Map<ServiceKey, Factory<any>>()
    private singletons = new Map<ServiceKey, any>()

    /**
     * 注册服务工厂
     */
    register<T>(key: ServiceKey, factory: Factory<T>): void {
        this.services.set(key, factory)
    }

    /**
     * 注册单例服务
     */
    singleton<T>(key: ServiceKey, factory: Factory<T>): void {
        this.services.set(key, () => {
            if (!this.singletons.has(key)) {
                this.singletons.set(key, factory())
            }
            return this.singletons.get(key)
        })
    }

    /**
     * 解析服务
     */
    resolve<T>(key: ServiceKey): T {
        const factory = this.services.get(key)
        if (!factory) {
            throw new Error(`Service not found: ${key}`)
        }
        return factory()
    }

    /**
     * 检查服务是否已注册
     */
    has(key: ServiceKey): boolean {
        return this.services.has(key)
    }

    /**
     * 清空所有服务（用于测试）
     */
    clear(): void {
        this.services.clear()
        this.singletons.clear()
    }
}

// 导出全局容器实例
export const container = new Container()

// 导出类型供外部使用
export type { Container, ServiceKey, Factory }

// ========== 初始化函数 ==========

/**
 * 初始化容器，注册所有核心服务
 */
export async function initContainer() {
    // 延迟导入工厂函数（避免循环依赖）
    const factories = await import("./factories")

    // 注册工厂服务
    container.register("createEntity", () => factories.createEntity)
    container.register("createCard", () => factories.createCard)
    container.register("createPotion", () => factories.createPotion)
    container.register("createRelic", () => factories.createRelic)
    container.register("createPlayer", () => factories.createPlayer)
    container.register("createEnemy", () => factories.createEnemy)
    container.register("createOrgan", () => factories.createOrgan)
    container.register("createActionEvent", () => factories.createActionEvent)

    // 注册单例服务
    const { modifierManager } = await import("./managers/ModifierManager")
    container.singleton("modifierManager", () => modifierManager)
}

