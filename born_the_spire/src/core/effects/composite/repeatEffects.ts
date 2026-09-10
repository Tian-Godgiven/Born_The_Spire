import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { Effect } from "@/core/objects/system/effect/Effect"
import { getFromEffectMap } from "@/static/list/system/effectMap"

/**
 * 重复执行一组效果 N 次
 *
 * 每次迭代走 Effect.runCycle（before → on → apply → after），
 * 和事务里普通效果同一套周期，护甲吸收和跳字快照都在 on。
 *
 * @params {
 *   times: number - 重复次数
 *   effects: EffectUnit[] - 每次重复执行的效果列表
 * }
 */
export const repeatEffects: EffectFunc = async (event, effect) => {
    const times = Number(effect.params.times ?? 1)
    const effectUnits = effect.params.effects as EffectUnit[]

    if (!effectUnits || !Array.isArray(effectUnits)) return

    const triggerLevel = event.triggerLevel || 0

    for (let i = 0; i < times; i++) {
        for (const unit of effectUnits) {
            const effectData = getFromEffectMap(unit)
            const subEffect = new Effect({
                key: unit.key,
                effectFunc: effectData.effect,
                params: { ...unit.params },
                triggerEvent: event
            })
            await subEffect.runCycle(triggerLevel)
        }
    }
}
