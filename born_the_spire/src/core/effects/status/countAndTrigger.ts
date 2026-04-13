/**
 * 计数器，达到阈值时触发效果
 *
 * 用于器官等需要计数并触发效果的场景
 * 支持累计超过阈值的 n 倍时，自动触发 n 次
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { newLog } from "@/ui/hooks/global/log"
import { newError } from "@/ui/hooks/global/alert"
import { doEvent } from "@/core/objects/system/ActionEvent"
import type { Entity } from "@/core/objects/system/Entity"
import type { Effect } from "@/core/objects/system/effect/Effect"
import type { TriggerEventConfig } from "@/core/types/object/trigger"

/**
 * 计数并触发效果
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

    // 计数器存储在 target 上（通常是器官或物品本身）
    const target = event.target
    const source = event.source
    const medium = event.medium

    // 检查 target 是否有 status
    const targetEntity = target as Entity
    if (!targetEntity || !targetEntity.status || typeof targetEntity !== 'object') {
        console.error("[countAndTrigger] target 无效或没有 status", target)
        newError(["[countAndTrigger] target 无效或没有 status", target])
        return
    }

    // 获取计数器
    const countStatus = targetEntity.status[countKey]

    if (!countStatus) {
        console.error("[countAndTrigger] 未找到计数器状态", countKey, "available:", Object.keys(targetEntity.status || {}))
        newError([`[countAndTrigger] 未找到计数器状态 ${countKey}`, `可用状态:`, Object.keys(targetEntity.status || {})])
        return
    }

    // 增加计数器
    const currentValue = Number(countStatus.originalBaseValue ?? countStatus.value ?? 0)
    const newValue = currentValue + 1

    // 更新计数器
    if (countStatus.setOriginalBaseValue) {
        countStatus.setOriginalBaseValue(newValue)
    } else {
        ;(countStatus as any)._baseValue.value = newValue
    }

    // 计算达到阈值的次数
    const triggerCount = Math.floor(newValue / threshold)

    if (triggerCount > 0) {
        // 重置计数器为余数
        const remainder = newValue - triggerCount * threshold
        if (countStatus.setOriginalBaseValue) {
            countStatus.setOriginalBaseValue(remainder)
        } else {
            // 直接设置内部 ref 值
            ;(countStatus as any)._baseValue.value = remainder
        }

        // 触发事件（可能多次）
        const logParts = ["计数器", countKey, `达到阈值 ${threshold}`, `触发 ${triggerCount} 次`]
        newLog(logParts)

        if (params.onTrigger && (params.onTrigger as any).key) {
            console.log('[countAndTrigger Debug] 找到onTrigger配置，准备执行')
            const onTriggerTarget = (event.triggerContext?.owner ?? event.target)
            const onTriggerKey = typeof (params.onTrigger as any).key === 'string' ? (params.onTrigger as any).key : "thresholdReached"
            const onTriggerInfo = (params.onTrigger as any).info ?? {}
            const onTriggerEffect = (params.onTrigger as any).effect ?? []
            console.log('[countAndTrigger Debug] 触发事件配置:', {
                key: onTriggerKey,
                target: onTriggerTarget?.label,
                effectCount: onTriggerEffect?.length
            })
            for (let i = 0; i < triggerCount; i++) {
                console.log(`[countAndTrigger Debug] 执行第 ${i + 1}/${triggerCount} 次触发`)
                doEvent({
                    key: onTriggerKey,
                    source: source,
                    medium: medium,
                    target: onTriggerTarget,
                    info: onTriggerInfo,
                    effectUnits: onTriggerEffect
                })
            }
        } else {
            console.log('[countAndTrigger Debug] 没有找到onTrigger配置，跳过触发')
        }
    } else {
        console.log('[countAndTrigger Debug] 未达到阈值，不触发效果')
    }
}
