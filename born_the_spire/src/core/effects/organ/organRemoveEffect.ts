import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Organ } from "@/core/objects/target/Organ"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { isEntity } from "@/core/utils/typeGuards"

/**
 * 移除器官效果（基础效果）
 *
 * @params {
 *   organ: Organ - 要移除的器官实例
 * }
 */
export const removeOrganEffect: EffectFunc = async (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!isEntity(target)) return

    const organ = effect.params.organ as Organ

    if (!organ || !(organ instanceof Organ)) {
        console.warn("[removeOrganEffect] 无效的器官参数")
        return
    }

    const organModifier = getOrganModifier(target)
    organModifier.loseOrgan(organ, true)  // triggerLoseEffect = true
}
