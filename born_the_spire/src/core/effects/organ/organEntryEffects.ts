import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Organ, breakOrgan } from "@/core/objects/target/Organ"
import { getCurrentValue, setCurrentValue } from "@/core/objects/system/Current/current"
import { getStatusValue } from "@/core/objects/system/status/Status"

/**
 * 脆弱词条效果：50%概率损坏器官
 */
export const fragileBreak: EffectFunc = (event, effect) => {
    const { target } = event
    const organ = effect.params.organ as Organ

    // 检查目标是否是器官
    if (!(target instanceof Organ)) return

    // 50%概率触发
    if (Math.random() > 0.5) return

    // 检查器官是否已经损坏
    if (organ.isDisabled) return

    // 损坏器官
    if (organ.owner) {
        breakOrgan(organ.owner, organ)
    }
}

/**
 * 再生词条效果：恢复器官质量
 */
export const regenerateMass: EffectFunc = (event, effect) => {
    const { target } = event
    const organ = effect.params.organ as Organ
    const value = Number(effect.params.value)

    // 检查目标是否是器官
    if (!(target instanceof Organ)) return

    // 检查器官是否有质量系统
    if (!organ.current.mass) return

    // 获取当前质量和最大质量
    const currentMass = getCurrentValue(organ, "mass")
    const maxMass = getStatusValue(organ, "max-mass")

    // 恢复质量（不超过最大值）
    const newMass = Math.min(currentMass + value, maxMass)
    setCurrentValue(organ, "mass", newMass)
}
