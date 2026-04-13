/**
 * 人工制品抵消效果
 *
 * 当目标即将被施加 debuff 状态时，抵消该效果并消耗1层人工制品
 * 用于 artifact 状态的 reaction：targetType 为 "triggerEffect"
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { isEffect } from "@/core/utils/typeGuards"
import { stateList } from "@/static/list/target/stateList"
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"
import { newLog } from "@/ui/hooks/global/log"
import type { Target } from "@/core/objects/target/Target"

export const artifactBlockDebuff: EffectFunc = (event, _effect) => {
    const target = event.target

    // target 应该是触发的 applyState Effect
    if (Array.isArray(target) || !isEffect(target)) return false

    // 检查被施加的状态是否为 debuff
    const stateKey = target.params.stateKey as string
    if (!stateKey) return false

    const stateData = stateList.find(s => s.key === stateKey)
    if (!stateData || stateData.category !== "debuff") return false

    // 是 debuff，取消该效果
    target.cancel()

    // 减少人工制品层数
    const owner = (event as any).triggerContext?.owner as Target | undefined
    if (owner) {
        const stateModifier = getStateModifier(owner)
        stateModifier.changeStack("artifact", "default", -1)
        newLog([owner, "的人工制品抵消了", stateData.label])
    }

    return true
}
