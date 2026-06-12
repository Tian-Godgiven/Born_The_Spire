import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { newLog } from "@/ui/hooks/global/log"
import { newError } from "@/ui/hooks/global/alert"
import { doEvent } from "@/core/objects/system/ActionEvent"
import type { Entity } from "@/core/objects/system/Entity"

/**
 * 计数并触发效果
 *
 * 用于器官等需要计数并触发效果的场景
 * 支持累计超过阈值的 n 倍时，自动触发 n 次
 *
 * @param effect.params.countKey     - 计数器状态的 key（在 target 上）
 * @param effect.params.threshold    - 触发阈值（默认 1）
 * @param effect.params.onTrigger    - 达到阈值时触发的事件配置
 *                                     格式：{ key, label, targetType, mediumTargetType, effect }
 *
 * 使用方式：
 * effect: {
 *     key: "countAndTrigger",
 *     params: {
 *         countKey: "counter",
 *         threshold: 5,
 *         onTrigger: {
 *             key: "effect-name",
 *             targetType: "triggerOwner",
 *             mediumTargetType: "triggerEventMedium",
 *             effect: [{ key: "someEffect", params: {...} }]
 *         }
 *     }
 * }
 *
 * 示例逻辑：
 * threshold = 5，当前值 0
 * +1 → 1 (< 5)，不触发
 * +1 → 5 (>= 5)，触发 1 次，重置为 0
 * +1 → 13 (>= 5)，触发 2 次，重置为 3
 */
export const countAndTrigger: EffectFunc = (event, effect) => {
    const params = effect.params || {}
    const countKey = String(params.countKey)
    const threshold = Number(params.threshold ?? 1)

    if (!countKey) {
        console.error("[countAndTrigger] 缺少必要参数 countKey", effect.params)
        return
    }
    if (threshold <= 0) {
        console.error("[countAndTrigger] threshold 必须大于 0", threshold)
        return
    }

    const target = event.target
    const source = event.source
    const medium = event.medium

    const targetEntity = target as Entity
    if (!targetEntity || !targetEntity.status || typeof targetEntity !== 'object') {
        console.error("[countAndTrigger] target 无效或没有 status", target)
        newError(["[countAndTrigger] target 无效或没有 status", target])
        return
    }

    const countStatus = targetEntity.status[countKey]
    if (!countStatus) {
        console.error("[countAndTrigger] 未找到计数器状态", countKey, "available:", Object.keys(targetEntity.status || {}))
        newError([`[countAndTrigger] 未找到计数器状态 ${countKey}`, `可用状态:`, Object.keys(targetEntity.status || {})])
        return
    }

    const currentValue = Number(countStatus.originalBaseValue ?? countStatus.value ?? 0)
    const newValue = currentValue + 1
    countStatus.setOriginalBaseValue(newValue)

    const triggerCount = Math.floor(newValue / threshold)
    if (triggerCount <= 0) return

    countStatus.setOriginalBaseValue(newValue - triggerCount * threshold)
    newLog(["计数器", countKey, `达到阈值 ${threshold}`, `触发 ${triggerCount} 次`])

    if (!params.onTrigger || !(params.onTrigger as any).key) return

    const onTriggerTarget = event.triggerContext?.owner ?? event.target
    const onTriggerKey = String((params.onTrigger as any).key)
    const onTriggerInfo = (params.onTrigger as any).info ?? {}
    const onTriggerEffect = (params.onTrigger as any).effect ?? []

    for (let i = 0; i < triggerCount; i++) {
        doEvent({
            key: onTriggerKey,
            source,
            medium,
            target: onTriggerTarget,
            info: onTriggerInfo,
            effectUnits: onTriggerEffect
        })
    }
}
