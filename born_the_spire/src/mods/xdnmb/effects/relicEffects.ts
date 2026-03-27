/**
 * xdnmb Mod - 遗物专属效果
 */

import type { EffectFunc } from '@/core/objects/system/effect/EffectFunc'
import { handleEventEntity, doEvent } from '@/core/objects/system/ActionEvent'
import { isEntity } from '@/core/utils/typeGuards'
import { randomInt } from '@/core/hooks/random'
import { nowBattle } from '@/core/objects/game/battle'
import type { EffectData } from '../..'

/**
 * 血偿棱镜 - 随机连锁伤害
 *
 * 对选中的友方目标造成 min~max 随机伤害，然后对所有敌人造成该伤害的 multiplier 倍
 */
const relic_bloodPrismChainDamage: EffectFunc = (event, effect) => {
    const { target, medium, source } = event
    const params = effect.params || {}

    const min = Number(params.min ?? 6)
    const max = Number(params.max ?? 12)
    const multiplier = Number(params.multiplier ?? 2)

    const context = `bloodPrism:${(medium as any)?.__id || 0}`
    const randomDamage = randomInt(min, max, context)

    // 1. 对选中的友方目标造成伤害
    handleEventEntity(target, (t) => {
        if (!isEntity(t)) return
        doEvent({
            key: 'damage',
            source: source,
            medium: medium,
            target: t,
            effectUnits: [{ key: 'damage', params: { value: randomDamage } }]
        })
    })

    // 2. 对所有敌人造成倍数伤害
    const battle = nowBattle.value
    if (!battle) return

    const damageToEnemies = Math.floor(randomDamage * multiplier)
    for (const enemy of battle.getTeam('enemy')) {
        doEvent({
            key: 'damage',
            source: source,
            medium: medium,
            target: enemy,
            effectUnits: [{ key: 'damage', params: { value: damageToEnemies } }]
        })
    }
}

export const bloodPrismChainDamageEffect: EffectData = {
    label: '血偿棱镜-随机连锁伤害',
    key: 'bloodPrismChainDamage',
    effect: relic_bloodPrismChainDamage
}
