import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { Effect } from "@/core/objects/system/effect/Effect"
import { getFromEffectMap } from "@/static/list/system/effectMap"
import { randomChoice } from "@/core/hooks/random"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 从多个选项中随机挑一个并执行其 effects
 *
 * @params {
 *   options: Array<{ label?: string, effects: EffectUnit[] }>
 *   context?: string  // 传给 randomChoice 的种子上下文，默认 "randomPickEffect"
 * }
 */
export const randomPickEffect: EffectFunc = async (event, effect) => {
    const options = effect.params.options as { label?: string, effects: EffectUnit[] }[] | undefined
    const context = String(effect.params.context ?? "randomPickEffect")

    if (!options || !Array.isArray(options) || options.length === 0) {
        console.warn("[randomPickEffect] options 为空或非数组")
        return
    }

    const picked = randomChoice(options, context)
    if (!picked || !picked.effects || !Array.isArray(picked.effects)) {
        console.warn("[randomPickEffect] 挑中的选项无 effects")
        return
    }

    if (picked.label) {
        newLog([`随机结果：${picked.label}`])
    }

    const triggerLevel = event.triggerLevel || 0
    for (const unit of picked.effects) {
        const effectData = getFromEffectMap(unit)
        const subEffect = new Effect({
            key: unit.key,
            effectFunc: effectData.effect,
            params: { ...unit.params },
            triggerEvent: event
        })
        await subEffect.trigger("before", triggerLevel)
        await subEffect.apply()
        await subEffect.trigger("after", triggerLevel)
    }
}
