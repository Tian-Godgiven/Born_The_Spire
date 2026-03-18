/**
 * 工厂函数中心
 *
 * 核心原则：外部代码只使用 import type，通过工厂来创建实例
 * 工厂内部使用值导入和 new 操作，集中管理创建逻辑
 */

import type { EntityMap } from "./objects/system/Entity"
import type { EffectUnit } from "./objects/system/effect/EffectUnit"

// 值导入（核心类已在 preload.ts 中预加载）
import { Entity } from "./objects/system/Entity"
import { Card } from "./objects/item/Subclass/Card"
import { Potion } from "./objects/item/Subclass/Potion"
import { Relic } from "./objects/item/Subclass/Relic"
import { Player } from "./objects/target/Player"
import { Enemy } from "./objects/target/Enemy"
import { Organ } from "./objects/target/Organ"
import { ActionEvent } from "./objects/system/ActionEvent"

// 类型导入（用于返回类型）
import type { Entity as EntityType } from "./objects/system/Entity"
import type { Card as CardType } from "./objects/item/Subclass/Card"
import type { Potion as PotionType } from "./objects/item/Subclass/Potion"
import type { Relic as RelicType } from "./objects/item/Subclass/Relic"
import type { Player as PlayerType } from "./objects/target/Player"
import type { Enemy as EnemyType } from "./objects/target/Enemy"
import type { Organ as OrganType } from "./objects/target/Organ"
import type { ActionEvent as ActionEventType } from "./objects/system/ActionEvent"

// ========== Entity 工厂 ==========

/**
 * 创建 Entity 实例
 * 工厂内部使用值导入，外部只使用类型
 */
export async function createEntity(map: EntityMap): Promise<EntityType> {
    const entity = new Entity(map)
    await entity.initialize()
    return entity
}

// ========== Item 工厂 ==========

/**
 * 创建 Card 实例
 */
export async function createCard(map: any): Promise<CardType> {
    const card = new Card(map)
    await card.initialize()
    return card
}

/**
 * 创建 Potion 实例
 */
export async function createPotion(map: any): Promise<PotionType> {
    const potion = new Potion(map)
    await potion.initialize()
    return potion
}

/**
 * 创建 Relic 实例
 */
export async function createRelic(map: any): Promise<RelicType> {
    const relic = new Relic(map)
    await relic.initialize()
    return relic
}

// ========== Target 工厂 ==========

/**
 * 创建 Player 实例
 */
export async function createPlayer(map: any): Promise<PlayerType> {
    const player = new Player(map)
    await player.initialize()
    return player
}

/**
 * 创建 Enemy 实例
 */
export async function createEnemy(map: any): Promise<EnemyType> {
    const enemy = new Enemy(map)
    await enemy.initialize()
    return enemy
}

/**
 * 创建 Organ 实例
 */
export async function createOrgan(map: any): Promise<OrganType> {
    const organ = new Organ(map)
    await organ.initialize()
    return organ
}

// ========== ActionEvent 工厂 ==========

/**
 * 创建 ActionEvent 实例
 */
export async function createActionEvent(
    key: string,
    source: EntityType,
    medium: EntityType,
    target: EntityType | EntityType[],
    info: Record<string, any>,
    effectUnits: EffectUnit[]
): Promise<ActionEventType> {
    return new ActionEvent(key, source, medium, target, info, effectUnits)
}

// ========== Effect 工厂 ==========

import type { Effect as EffectType } from "./objects/system/effect/Effect"
import type { EffectParams } from "./objects/system/effect/EffectFunc"
import { Effect } from "./objects/system/effect/Effect"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { newError } from "@/ui/hooks/global/alert"

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
): EffectType {
    // 使用懒加载获取 effectMap（已在 preload 中加载）
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
