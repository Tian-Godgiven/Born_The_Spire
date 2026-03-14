/**
 * 工厂函数中心
 *
 * 核心原则：外部代码只使用 import type，通过工厂来创建实例
 * 工厂内部使用值导入和 new 操作，集中管理创建逻辑
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

// ========== Entity 工厂 ==========

/**
 * 创建 Entity 实例
 * 工厂内部使用值导入，外部只使用类型
 */
export async function createEntity(map: EntityMap): Promise<Entity> {
    const { Entity } = await import("./objects/system/Entity")
    return new Entity(map)
}

// ========== Item 工厂 ==========

/**
 * 创建 Card 实例
 */
export async function createCard(map: any): Promise<Card> {
    const { Card } = await import("./objects/item/Subclass/Card")
    return new Card(map)
}

/**
 * 创建 Potion 实例
 */
export async function createPotion(map: any): Promise<Potion> {
    const { Potion } = await import("./objects/item/Subclass/Potion")
    return new Potion(map)
}

/**
 * 创建 Relic 实例
 */
export async function createRelic(map: any): Promise<Relic> {
    const { Relic } = await import("./objects/item/Subclass/Relic")
    return new Relic(map)
}

// ========== Target 工厂 ==========

/**
 * 创建 Player 实例
 */
export async function createPlayer(map: any): Promise<Player> {
    const { Player } = await import("./objects/target/Player")
    return new Player(map)
}

/**
 * 创建 Enemy 实例
 */
export async function createEnemy(map: any): Promise<Enemy> {
    const { Enemy } = await import("./objects/target/Enemy")
    return new Enemy(map)
}

/**
 * 创建 Organ 实例
 */
export async function createOrgan(map: any): Promise<Organ> {
    const { Organ } = await import("./objects/target/Organ")
    return new Organ(map)
}

// ========== ActionEvent 工厂 ==========

/**
 * 创建 ActionEvent 实例
 */
export async function createActionEvent(
    key: string,
    source: Entity,
    medium: Entity,
    target: Entity | Entity[],
    info: Record<string, any>,
    effectUnits: EffectUnit[]
): Promise<ActionEvent> {
    const { ActionEvent } = await import("./objects/system/ActionEvent")
    return new ActionEvent(key, source, medium, target, info, effectUnits)
}

// ========== Effect 工厂 ==========

import type { Effect } from "./objects/system/effect/Effect"
import type { EffectParams } from "./objects/system/effect/EffectFunc"

/**
 * 通过 EffectUnit 创建 Effect 实例
 *
 * 架构说明：为什么在工厂中实现？
 * - 打破 ActionEvent ↔ EffectUnit ↔ Effect 的循环依赖
 * - ActionEvent 只导入 factories（不导入 EffectUnit）
 * - factories 动态导入 Effect（不导入 ActionEvent）
 * - Effect 可以导入 ActionEvent 的函数
 *
 * 注意：这是同步函数，因为在 ActionEvent 构造函数中调用
 * 依赖的模块必须在调用前已加载（通过 preload 确保）
 */
export function createEffectByUnit(
    event: ActionEvent,
    unit: EffectUnit
): Effect {
    // 使用懒加载获取 effectMap（已在 preload 中加载）
    const { getLazyModule } = require("@/core/utils/lazyLoader")
    const { newError } = require("@/ui/hooks/global/alert")

    const effectMap = getLazyModule<any[]>('effectMap')
    const data = effectMap.find((tmp: any) => tmp.key == unit.key)
    if(!data){
        newError(["错误:没有找到目标效果", unit.key])
        throw new Error()
    }

    // 构建 effect 对象
    const {key, params, describe, resultStoreAs} = unit

    // 使用 JSON 深拷贝
    let clonedParams: EffectParams
    try {
        clonedParams = JSON.parse(JSON.stringify(params))
    } catch (e) {
        // 如果有循环引用，退回到浅拷贝
        clonedParams = {...params}
    }

    // 动态导入 Effect 类（必须在运行时，此时模块已加载）
    const { Effect } = require("./objects/system/effect/Effect")

    // 创建 Effect 对象（会在构造函数中解析参数并验证）
    const effectObj = new Effect({
        label: data.label,
        key,
        effectFunc: data.effect,
        params: clonedParams,
        describe,
        triggerEvent: event,
        resultStoreAs
    })
    return effectObj
}

// ========== 同步工厂（用于已加载的模块） ==========

/**
 * 同步创建 ActionEvent（用于 ActionEvent.ts 内部）
 * 需要确保模块已加载
 */
export function createActionEventSync(
    ActionEventClass: any,
    key: string,
    source: Entity,
    medium: Entity,
    target: Entity | Entity[],
    info: Record<string, any>,
    effectUnits: EffectUnit[]
): ActionEvent {
    return new ActionEventClass(key, source, medium, target, info, effectUnits)
}
