/**
 * 工厂函数中心
 *
 * 运行时入口：new 对应的类，再 initialize()。
 * 不是加载隔离层。Player / Enemy 都 extends Chara，顶层值导入会在
 * preload 还在加载 Target.ts 时就把子类跑起来（Cannot access 'Chara'）。
 * 这两个在 create 函数里再取类，调用发生在 preload 之后。
 */

import type { EntityMap } from "./objects/system/Entity"
import type { EffectUnit } from "./objects/system/effect/EffectUnit"

import { Entity } from "./objects/system/Entity"
import { Card } from "./objects/item/Subclass/Card"
import { Potion } from "./objects/item/Subclass/Potion"
import { Relic } from "./objects/item/Subclass/Relic"
import { Organ } from "./objects/target/Organ"
import { ActionEvent } from "./objects/system/ActionEvent"

import type { Entity as EntityType } from "./objects/system/Entity"
import type { Card as CardType } from "./objects/item/Subclass/Card"
import type { Potion as PotionType } from "./objects/item/Subclass/Potion"
import type { Relic as RelicType } from "./objects/item/Subclass/Relic"
import type { Player as PlayerType } from "./objects/target/Player"
import type { Enemy as EnemyType } from "./objects/target/Enemy"
import type { Organ as OrganType } from "./objects/target/Organ"

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
 *
 * 不在文件顶层值导入 Player。Chara 还在 Target.ts 里加载时，
 * 谁 import 本文件都不能去执行 `class Player extends Chara`。
 */
export async function createPlayer(map: any): Promise<PlayerType> {
    const { Player } = await import("./objects/target/Player")
    const player = new Player(map)
    await player.initialize()
    return player
}

/**
 * 创建 Enemy 实例
 */
export async function createEnemy(map: any): Promise<EnemyType> {
    const { Enemy } = await import("./objects/target/Enemy")
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

