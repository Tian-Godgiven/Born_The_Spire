import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"
import { nowBattle } from "@/core/objects/game/battle"

/**
 * 战斗开始时增加第一回合抽牌数
 *
 * @params {
 *   value: number  - 增加的抽牌数
 * }
 */
export const addFirstTurnDraw: EffectFunc = (event, effect) => {
    const value = Number(effect.params.value ?? 0)

    if (value <= 0) return

    handleEventEntity(event.target, (entity) => {
        if (!isEntity(entity)) return

        // 添加触发器：在回合开始抽牌之前，检查是否是第一回合
        const triggerRemover = entity.appendTrigger({
            when: "before",
            how: "take",
            key: "turnStartDrawCard",
            callback: async (triggerEvent) => {
                // 检查是否是第一回合
                if (nowBattle.value && nowBattle.value.turnNumber === 1) {
                    // 修改抽牌事件的效果参数
                    const effects = triggerEvent.effects
                    if (effects && effects.length > 0) {
                        // 找到 drawFromDrawPile 效果
                        const drawEffect = effects.find((e: any) => e.key === "drawFromDrawPile")
                        if (drawEffect && drawEffect.params.value !== undefined) {
                            const currentValue = drawEffect.params.value
                            // 如果是对象（如 {fromStatus: "draw-per-turn"}），需要先解析
                            if (typeof currentValue === 'object' && currentValue !== null && 'fromStatus' in currentValue) {
                                // 不能直接修改对象，需要转换为数字
                                // 这里假设 fromStatus 对应的值已经被解析了，如果没有则使用默认值
                                // 实际上，效果函数会在执行时解析 fromStatus
                                // 所以这里我们需要用另一种方式：添加一个额外的 addValue 参数
                                drawEffect.params._addValue = value
                            } else {
                                // 直接是数字，增加抽牌数
                                drawEffect.params.value = Number(currentValue) + value
                            }
                        }
                    }
                }
            }
        })

        // 收集副作用（战斗结束时清理）
        event.collectSideEffect(() => {
            triggerRemover.remove()
        })
    })
}
