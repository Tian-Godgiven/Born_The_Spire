import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { Target } from "@/core/objects/target/Target"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 护甲清零效果
 * 由护甲机制的 clearArmor 事件调用，支持被壁垒状态拦截
 */
export const clearArmorEffect: EffectFunc = (event, _effect) => {
    handleEventEntity(event.target, (target) => {
        const t = target as Target
        if (!t.current.armor) return
        t.current.armor.value = 0
        newLog([t.label, "护甲清零"])
    })
}
