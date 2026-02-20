/**
 * 获得护甲效果
 */

import { EffectFunc } from "@/core/objects/system/effect/Effect"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { Target } from "@/core/objects/target/Target"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 获得护甲
 * @param effect.params.value - 获得的护甲值
 */
export const gainArmor: EffectFunc = (event, effect) => {
    const amount = effect.params.value || 0

    if (amount <= 0) {
        return
    }

    handleEventEntity(event.target, (target) => {
        const t = target as Target

        // 增加护甲值
        if (!t.current.armor) {
            console.warn(`[gainArmor] ${t.label} 没有护甲机制`)
            return
        }

        t.current.armor.value += amount

        // 记录日志
        newLog([`${t.label} 获得了 ${amount} 点护甲`])
    })
}
