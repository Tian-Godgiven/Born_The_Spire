/**
 * Mod 注册工具
 * 提供统一的内容注册接口
 */

import type { RelicMap } from '@/core/objects/item/Subclass/Relic'
import type { CardMap } from '@/core/objects/item/Subclass/Card'
import type { OrganMap } from '@/core/objects/target/Organ'
import type { EnemyMap } from '@/core/objects/target/Enemy'
import type { EffectFunc } from '@/core/objects/system/effect/EffectFunc'
import { getLazyModule } from '@/core/utils/lazyLoader'

export type EffectData = {
    label?: string
    key: string
    effect: EffectFunc
    preview?: (event: any, effect: any) => number | null
}

/**
 * 注册遗物到游戏
 */
export function registerRelic(relic: RelicMap): void {
    const relicList = getLazyModule<RelicMap[]>('relicList')
    relicList.push(relic)
    console.log(`[Mod] 注册遗物: ${relic.key} - ${relic.label}`)
}

/**
 * 注册卡牌到游戏
 */
export function registerCard(card: CardMap): void {
    const cardList = getLazyModule<CardMap[]>('cardList')
    cardList.push(card)
    console.log(`[Mod] 注册卡牌: ${card.key} - ${card.label}`)
}

/**
 * 注册器官到游戏
 */
export function registerOrgan(organ: OrganMap): void {
    const organList = getLazyModule<OrganMap[]>('organList')
    organList.push(organ)
    console.log(`[Mod] 注册器官: ${organ.key} - ${organ.label}`)
}

/**
 * 注册敌人到游戏
 */
export function registerEnemy(enemy: EnemyMap): void {
    const enemyList = getLazyModule<EnemyMap[]>('enemyList')
    enemyList.push(enemy)
    console.log(`[Mod] 注册敌人: ${enemy.key} - ${enemy.label}`)
}

/**
 * 注册效果到游戏
 */
export function registerEffect(effect: EffectData): void {
    const effectMap = getLazyModule<EffectData[]>('effectMap')
    effectMap.push(effect)
    console.log(`[Mod] 注册效果: ${effect.key} - ${effect.label}`)
}

/**
 * 批量注册遗物
 */
export function registerRelics(relics: RelicMap[]): void {
    relics.forEach(relic => registerRelic(relic))
}

/**
 * 批量注册卡牌
 */
export function registerCards(cards: CardMap[]): void {
    cards.forEach(card => registerCard(card))
}

/**
 * 批量注册器官
 */
export function registerOrgans(organs: OrganMap[]): void {
    organs.forEach(organ => registerOrgan(organ))
}

/**
 * 批量注册效果
 */
export function registerEffects(effects: EffectData[]): void {
    effects.forEach(effect => registerEffect(effect))
}
