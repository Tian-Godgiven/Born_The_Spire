/**
 * 清空宝箱效果
 * 将触发事件（openChest）的 info.ifGetReward 设为 false，使宝箱变为空的
 * 并移除触发此效果的遗物（一次性效果）
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"
import { getRelicModifier } from "@/core/objects/system/modifier/RelicModifier"
import { newLog } from "@/ui/hooks/global/log"

export const emptyChest: EffectFunc = (event, effect) => {
    // 通过 parentEvent 拿到原始的 openChest 事件
    const triggerEvent = event.parentEvent
    if (triggerEvent?.info) {
        triggerEvent.info.ifGetReward = false
    }

    // 如果指定了 relicKey，移除该遗物（一次性效果）
    const relicKey = effect.params?.relicKey
    if (relicKey) {
        handleEventEntity(event.target, (entity) => {
            if (!isEntity(entity)) return
            const relicModifier = getRelicModifier(entity)
            relicModifier.removeRelicByKey(String(relicKey))
            newLog(["恩洛斯的饥饿得到了满足"])
        })
    }
}
