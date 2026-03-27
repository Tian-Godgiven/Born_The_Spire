import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import type { ActionEvent } from "@/core/objects/system/ActionEvent"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { handleEventEntity, doEvent } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"

/**
 * 计数触发效果
 *
 * 在指定事件上累积点数，当达到阈值时触发效果
 * 这是一个数据驱动的效果，用于简化"积累点数并在阈值触发效果"的遗物制作
 *
 * 参数：
 * - pointKey: 计数器使用的状态key（默认 "point"）
 * - on: 触发器配置 { when, how, key }
 * - gain: 每次获得的点数（可以是数字或 "$triggerValue"）
 * - minGain: 最小累积值，只有当gain >= minGain时才累积（可选）
 * - threshold: 触发阈值
 * - consume: 每次触发消耗的点数（默认 1）或"all"表示清空所有点数
 * - repeat: 是否循环触发直到点数不足（默认 true）
 * - maxRepeat: 每次事件最多触发的次数（默认 Infinity）
 * - maxTriggerPerBattle: 每场战斗最多触发次数（可选，需要配合usedKey）
 * - usedKey: 记录已触发次数的状态key（当使用maxTriggerPerBattle时必需）
 * - targetType: 效果目标类型（默认 "owner"）
 * - effects: 要触发的效果数组
 */
export const accumulateAndTrigger: EffectFunc = (event, effect) => {
    const { target, medium, source } = event
    const params = effect.params || {}

    // 解析参数
    const pointKey = String(params.pointKey ?? "point")
    const on = params.on as { when?: "before"|"after", how?: "take"|"make"|"via", key: string }
    const gain = params.gain  // "$triggerValue" or number
    const minGain = params.minGain !== undefined ? Number(params.minGain) : undefined
    const threshold = Number(params.threshold ?? 10)
    const consumeParam = params.consume ?? 1
    const repeat = params.repeat !== false  // default true
    const maxRepeat = params.maxRepeat === undefined ? Infinity : Number(params.maxRepeat)
    const maxTriggerPerBattle = params.maxTriggerPerBattle !== undefined ? Number(params.maxTriggerPerBattle) : undefined
    const usedKey = params.usedKey !== undefined ? String(params.usedKey) : undefined
    const targetType = String(params.targetType ?? "owner")
    const effects = (params.effects as EffectUnit[]) ?? []

    if (!on?.key) {
        console.error("[accumulateAndTrigger] 缺少 on.key 参数")
        return
    }

    if (effects.length === 0) {
        console.warn("[accumulateAndTrigger] effects 为空，将不会触发任何效果")
    }

    if (maxTriggerPerBattle !== undefined && !usedKey) {
        console.error("[accumulateAndTrigger] 使用 maxTriggerPerBattle 时必须提供 usedKey")
        return
    }

    // 获取物品（计数器所在的对象）
    const item = medium as any

    // 确保物品有对应的计数器状态
    if (!item.status?.[pointKey]) {
        console.warn(`[accumulateAndTrigger] 物品 ${(item as any)?.label || 'Unknown'} 缺少 ${pointKey} 属性`)
        return
    }

    // 对目标挂载触发器
    handleEventEntity(target, (owner) => {
        if (!isEntity(owner)) return

        const { remove } = owner.appendTrigger({
            when: on.when ?? "after",
            how: on.how ?? "take",
            key: on.key,
            callback: (triggerEvent, triggerEffect, _triggerLevel) => {
                // 1. 计算获得的点数
                let gainAmount: number
                if (gain === "$triggerValue") {
                    gainAmount = Number((triggerEffect as any)?.params?.value ?? 0)
                } else if (typeof gain === "number") {
                    gainAmount = gain
                } else {
                    gainAmount = 0
                }

                if (gainAmount === 0) return

                // 检查最小累积值
                if (minGain !== undefined && gainAmount < minGain) return

                // 检查每场战斗触发次数限制（在累积前检查）
                if (maxTriggerPerBattle !== undefined && usedKey) {
                    const usedStatus = item.status?.[usedKey]
                    if (usedStatus && usedStatus.value >= maxTriggerPerBattle) {
                        return  // 已达到本场战斗触发上限，不再累积
                    }
                }

                // 2. 累积点数到物品的计数器上
                const pointStatus = item.status?.[pointKey]
                if (!pointStatus) return

                const currentPoints = pointStatus.value
                pointStatus.setOriginalBaseValue(currentPoints + gainAmount)

                // 3. 检查每场战斗触发次数限制
                if (maxTriggerPerBattle !== undefined && usedKey) {
                    const usedStatus = item.status?.[usedKey]
                    if (usedStatus && usedStatus.value >= maxTriggerPerBattle) {
                        return  // 已达到本场战斗触发上限
                    }
                }

                // 3. 检查阈值并循环触发效果
                let count = 0
                while (pointStatus.value >= threshold && (repeat || count === 0) && count < maxRepeat) {
                    // 计算消耗的点数
                    let consumeAmount: number
                    if (consumeParam === "all") {
                        consumeAmount = pointStatus.value  // 清空所有
                    } else {
                        consumeAmount = Number(consumeParam)
                    }

                    // 消耗点数
                    const beforeConsume = pointStatus.value
                    pointStatus.setOriginalBaseValue(Math.max(0, beforeConsume - consumeAmount))
                    count++

                    // 确定效果目标
                    let effectTarget: any
                    switch (targetType) {
                        case "owner":
                            effectTarget = owner
                            break
                        case "triggerSource":
                            effectTarget = item
                            break
                        case "eventTarget":
                            effectTarget = triggerEvent.target
                            break
                        case "eventSource":
                            effectTarget = triggerEvent.source
                            break
                        default:
                            effectTarget = owner
                    }

                    // 触发效果
                    doEvent({
                        key: "accumulateTrigger",
                        source: item,
                        medium: item,
                        target: effectTarget,
                        effectUnits: effects
                    })

                    // 增加已触发次数
                    if (maxTriggerPerBattle !== undefined && usedKey) {
                        const usedStatus = item.status?.[usedKey]
                        if (usedStatus) {
                            usedStatus.setOriginalBaseValue(usedStatus.value + 1)
                        }
                    }
                }
            }
        })

        // 注册清理函数
        event.collectSideEffect(remove)

        // 如果使用了每场战斗触发次数限制，添加战斗开始时重置的触发器
        if (maxTriggerPerBattle !== undefined && usedKey) {
            const { remove: removeBattleStart } = owner.appendTrigger({
                when: "after",
                how: "make",
                key: "battleStart",
                callback: () => {
                    // 重置已触发次数
                    const usedStatus = item.status?.[usedKey]
                    if (usedStatus) {
                        usedStatus.setOriginalBaseValue(0)
                    }
                    // 重置计数器
                    const pointStatus = item.status?.[pointKey]
                    if (pointStatus) {
                        pointStatus.setOriginalBaseValue(0)
                    }
                }
            })
            event.collectSideEffect(removeBattleStart)
        }
    })
}
