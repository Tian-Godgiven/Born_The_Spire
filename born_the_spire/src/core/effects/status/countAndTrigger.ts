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

/**
 * 计数并触发效果
 *
 * @param effect.params.countKey     - 计数器状态的 key（在 target 上）
 * @param effect.params.threshold    - 触发阈值（默认 1）
 * @param effect.params.onTrigger    - 达到阈值时触发的事件配置
 *                                     格式：{ key, label, targetType, mediumType, effect }
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
 *             mediumType: "triggerEventMedium",
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
    if (!target || !target.status || typeof target !== 'object') {
        console.error("[countAndTrigger] target 无效或没有 status", target)
        newError(["[countAndTrigger] target 无效或没有 status", target])
        return
    }

    // 获取计数器
    const countStatus = target.status[countKey]
    if (!countStatus) {
        console.error("[countAndTrigger] 未找到计数器状态", countKey, "available:", Object.keys(target.status || {}))
        newError([`[countAndTrigger] 未找到计数器状态 ${countKey}`, `可用状态:`, Object.keys(target.status || {})])
        return
    }

    // 增加计数器
    const currentValue = countStatus.originalBaseValue ?? countStatus.value ?? 0
    const newValue = currentValue + 1

    // 更新计数器
    if (countStatus.setOriginalBaseValue) {
        countStatus.setOriginalBaseValue(newValue)
    } else if (countStatus.setBase) {
        countStatus.setBase(newValue)
    } else {
        countStatus.value = newValue
    }

    // 计算达到阈值的次数（支持一次性超过多次）
    // 例如：threshold=5, newValue=13 → triggerCount=2 (13=5×2+3)
    const triggerCount = Math.floor((newValue - 1) / threshold)

    if (triggerCount > 0) {
        // 重置计数器为余数
        const remainder = newValue - triggerCount * threshold
        if (countStatus.setOriginalBaseValue) {
            countStatus.setOriginalBaseValue(remainder)
        } else if (countStatus.setBase) {
            countStatus.setBase(remainder)
        } else {
            countStatus.value = remainder
        }

        // 触发事件（可能多次）
        const logParts = ["计数器", countKey, `达到阈值 ${threshold}`, `触发 ${triggerCount} 次`]
        newLog(logParts)

        if (params.onTrigger && params.onTrigger.key) {
            // onTrigger 的目标优先使用 triggerContext.owner（触发器持有者）
            // 没有上下文时退回 event.target
            const onTriggerTarget = (event.triggerContext?.owner ?? event.target) as any
            for (let i = 0; i < triggerCount; i++) {
                doEvent({
                    key: params.onTrigger.key || "thresholdReached",
                    source: event.source,
                    medium: event.medium,
                    target: onTriggerTarget,
                    info: params.onTrigger.info,
                    effectUnits: params.onTrigger.effect ?? []
                })
            }
        }
    }
}
