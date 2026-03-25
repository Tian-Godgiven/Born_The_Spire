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
 * - threshold: 触发阈值
 * - consume: 每次触发消耗的点数（默认 1）或"all"表示清空所有点数
 * - repeat: 是否循环触发直到点数不足（默认 true）
 * - maxRepeat: 每次事件最多触发的次数（默认 Infinity）
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
    const threshold = Number(params.threshold ?? 10)
    const consumeParam = params.consume ?? 1
    const repeat = params.repeat !== false  // default true
    const maxRepeat = params.maxRepeat === undefined ? Infinity : Number(params.maxRepeat)
    const targetType = String(params.targetType ?? "owner")
    const effects = (params.effects as EffectUnit[]) ?? []

    if (!on?.key) {
        console.error("[accumulateAndTrigger] 缺少 on.key 参数")
        return
    }

    if (effects.length === 0) {
        console.warn("[accumulateAndTrigger] effects 为空，将不会触发任何效果")
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

                // 2. 累积点数到物品的计数器上
                const pointStatus = item.status?.[pointKey]
                if (!pointStatus) return

                const currentPoints = pointStatus.value
                pointStatus.setOriginalBaseValue(currentPoints + gainAmount)

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
                }
            }
        })

        // 注册清理函数
        event.collectSideEffect(remove)
    })
}
