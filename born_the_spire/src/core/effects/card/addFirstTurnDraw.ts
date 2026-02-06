import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"

/**
 * 战斗开始时增加第一回合抽牌数
 *
 * @params {
 *   value: number  - 增加的抽牌数
 * }
 */
export const addFirstTurnDraw: EffectFunc = (event, effect) => {
    const { value = 0 } = effect.params

    if (value <= 0) return

    handleEventEntity(event.target, (entity) => {
        if (!isEntity(entity)) return

        // 添加触发器：在回合开始抽牌之前，检查是否是第一回合
        const triggerRemover = entity.appendTrigger({
            when: "before",
            how: "take",
            key: "turnStartDrawCard",
            callback: async (triggerEvent) => {
                // 动态导入 nowBattle 避免循环依赖
                const { nowBattle } = await import("@/core/objects/game/battle")

                // 检查是否是第一回合
                if (nowBattle.value && nowBattle.value.turnNumber === 1) {
                    // 修改抽牌事件的效果参数
                    const effects = triggerEvent.effects
                    if (effects && effects.length > 0) {
                        // 找到 drawFromDrawPile 效果
                        const drawEffect = effects.find(e => e.key === "drawFromDrawPile")
                        if (drawEffect && drawEffect.params.value !== undefined) {
                            // 增加抽牌数
                            drawEffect.params.value = Number(drawEffect.params.value) + value
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
