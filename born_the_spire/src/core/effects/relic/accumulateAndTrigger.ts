import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import type { ActionEvent } from "@/core/objects/system/ActionEvent"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import type { Entity } from "@/core/objects/system/Entity"
import type { Item } from "@/core/objects/item/Item"
import type { Effect } from "@/core/objects/system/effect/Effect"
import { handleEventEntity, doEvent } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"
import { resolveTriggerEventTarget } from "@/core/objects/system/trigger/resolveTriggerEventTarget"
import { resolveTriggerMountTargets } from "@/core/utils/resolveTriggerMountTargets"

/**
 * 积累计数并触发效果
 *
 * 在指定事件上累积点数，当达到阈值时触发效果。
 *
 * === 核心参数（必填）===
 * - pointKey:   计数器使用的 status key（需在物品 status 中声明，默认 "point"）
 * - on:         触发时机 { when?, how?, key }
 * - gain:       每次累积多少（数字，或 "$triggerEffect.params(value)" 读取触发效果的值）
 * - threshold:  触发阈值（默认 10）
 * - effects:    达到阈值时触发的效果数组
 *
 * === 调节参数（可选）===
 * - consume:    触发时消耗的点数（默认 1，或 "all" 清空所有点数）
 * - minGain:    gain 的最小值，低于此值不累积（可选）
 * - repeat:     是否在单次事件内循环触发直到低于阈值（默认 true）
 * - maxRepeat:  单次事件最多触发次数（默认不限）
 * - targetType: 触发效果的目标（默认 "owner"，可选 "triggerSource"、"eventTarget"、"eventSource"）
 *
 * === 限流参数（可选，成对使用）===
 * - maxTriggerPerBattle: 每场战斗最多触发次数
 * - usedKey:             记录已触发次数的 status key（使用 maxTriggerPerBattle 时必填）
 *
 * === 挂载目标（可选）===
 * - triggerTarget: 将触发器挂到指定目标上而非 owner（默认挂在 owner 上）
 *                  可选值："allOpponents"（所有对手）、"opponent"（单个对手）
 */
export const accumulateAndTrigger: EffectFunc = (event, effect) => {
    const { target, medium } = event
    const params = effect.params || {}

    // 核心参数
    const pointKey = String(params.pointKey ?? "point")
    const on = params.on as { when?: "before"|"after", how?: "take"|"make"|"via", key: string }
    const gain = params.gain
    const threshold = Number(params.threshold ?? 10)
    const effects = (params.effects as EffectUnit[]) ?? []

    // 调节参数
    const minGain = params.minGain !== undefined ? Number(params.minGain) : undefined
    const consumeParam = params.consume ?? 1
    const repeat = params.repeat !== false
    const maxRepeat = params.maxRepeat === undefined ? Infinity : Number(params.maxRepeat)
    const targetType = String(params.targetType ?? "owner")

    // 限流参数
    const maxTriggerPerBattle = params.maxTriggerPerBattle !== undefined ? Number(params.maxTriggerPerBattle) : undefined
    const usedKey = params.usedKey !== undefined ? String(params.usedKey) : undefined

    // 挂载目标
    const triggerTargetKey = params.triggerTarget as string | undefined

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

    const item = medium as any

    if (!item.status?.[pointKey]) {
        console.warn(`[accumulateAndTrigger] 物品 ${item?.label || 'Unknown'} 缺少 ${pointKey} 属性`)
        return
    }

    // 构建触发回调，owner 通过闭包传入（用于 targetType: "owner" 解析）
    const makeCallback = (owner: any) => (triggerEvent: ActionEvent, triggerEffect: any) => {
        let gainAmount: number
        if (typeof gain === "string" && gain.startsWith("$triggerEffect")) {
            gainAmount = Number((triggerEffect as any)?.params?.value ?? 0)
        } else if (typeof gain === "number") {
            gainAmount = gain
        } else {
            gainAmount = 0
        }
        if (gainAmount === 0) return
        if (minGain !== undefined && gainAmount < minGain) return

        if (maxTriggerPerBattle !== undefined && usedKey) {
            const usedStatus = item.status?.[usedKey]
            if (usedStatus && usedStatus.value >= maxTriggerPerBattle) return
        }

        const pointStatus = item.status?.[pointKey]
        if (!pointStatus) return
        pointStatus.setOriginalBaseValue(pointStatus.value + gainAmount)

        let count = 0
        while (pointStatus.value >= threshold && (repeat || count === 0) && count < maxRepeat) {
            const consumeAmount = consumeParam === "all" ? pointStatus.value : Number(consumeParam)
            pointStatus.setOriginalBaseValue(Math.max(0, pointStatus.value - consumeAmount))
            count++

            const resolved = resolveTriggerEventTarget(
                targetType,
                triggerEvent,
                triggerEffect as Effect | null,
                item as Item,
                owner
            )
            const effectTarget = resolved ?? owner

            doEvent({
                key: "accumulateTrigger",
                source: item,
                medium: item,
                target: effectTarget,
                effectUnits: effects
            })

            if (maxTriggerPerBattle !== undefined && usedKey) {
                const usedStatus = item.status?.[usedKey]
                if (usedStatus) usedStatus.setOriginalBaseValue(usedStatus.value + 1)
            }
        }
    }

    // 注册战斗开始时的重置触发器（仅限流时需要）
    const registerBattleReset = (owner: any) => {
        if (maxTriggerPerBattle === undefined || !usedKey) return
        const { remove } = owner.appendTrigger({
            when: "after",
            how: "make",
            key: "battleStart",
            callback: () => {
                const usedStatus = item.status?.[usedKey]
                if (usedStatus) usedStatus.setOriginalBaseValue(0)
                const pointStatus = item.status?.[pointKey]
                if (pointStatus) pointStatus.setOriginalBaseValue(0)
            }
        })
        event.collectSideEffect(remove)
    }

    if (triggerTargetKey) {
        // 将触发器挂到指定目标（对手等）而非 owner
        const ownerEntity = (Array.isArray(target) ? target[0] : target) as Entity
        if (!isEntity(ownerEntity)) return

        const mountTargets = resolveTriggerMountTargets(triggerTargetKey, ownerEntity)

        const callback = makeCallback(ownerEntity)
        for (const mountTarget of mountTargets) {
            const { remove } = (mountTarget as any).appendTrigger({
                when: on.when ?? "after",
                how: on.how ?? "take",
                key: on.key,
                callback
            })
            event.collectSideEffect(remove)
        }
        registerBattleReset(ownerEntity)
    } else {
        // 默认：挂在 owner 上
        handleEventEntity(target, (owner) => {
            if (!isEntity(owner)) return
            const { remove } = owner.appendTrigger({
                when: on.when ?? "after",
                how: on.how ?? "take",
                key: on.key,
                callback: makeCallback(owner)
            })
            event.collectSideEffect(remove)
            registerBattleReset(owner)
        })
    }
}
