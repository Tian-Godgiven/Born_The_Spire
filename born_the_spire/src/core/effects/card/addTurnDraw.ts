import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"
import { nowBattle } from "@/core/objects/game/battle"

/**
 * 战斗开始时给指定回合的回合起始抽牌数追加一次性 buff
 *
 * @params {
 *   turn?: number   - 目标回合号，默认 1
 *   value: number   - 增加的抽牌数
 * }
 */
export const addTurnDraw: EffectFunc = (event, effect) => {
    const value = Number(effect.params.value ?? 0)
    const turn = Number(effect.params.turn ?? 1)

    if (value <= 0) return

    handleEventEntity(event.target, (entity) => {
        if (!isEntity(entity)) return

        // 挂 before take turnStartDrawCard 触发器，检查是否是目标回合
        const triggerRemover = entity.appendTrigger({
            when: "before",
            how: "take",
            key: "turnStartDrawCard",
            callback: async (triggerEvent) => {
                if (!nowBattle.value || nowBattle.value.turnNumber !== turn) return

                const effects = triggerEvent.effects
                if (!effects || effects.length === 0) return

                const drawEffect = effects.find((e: any) => e.key === "drawFromDrawPile")
                if (!drawEffect || drawEffect.params.value === undefined) return

                const currentValue = drawEffect.params.value
                if (typeof currentValue === 'object' && currentValue !== null && 'fromStatus' in currentValue) {
                    // fromStatus 引用型，用 _addValue 累加，让 drawFromDrawPile 内部自己合并
                    drawEffect.params._addValue = (Number(drawEffect.params._addValue) || 0) + value
                } else {
                    drawEffect.params.value = Number(currentValue) + value
                }
            }
        })

        // 战斗结束时清理
        event.collectSideEffect(() => {
            triggerRemover.remove()
        })
    })
}
