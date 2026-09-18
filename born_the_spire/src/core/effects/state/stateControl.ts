import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent"
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"
import { gainStateStack } from "@/core/objects/system/State"
import { isEntity } from "@/core/utils/typeGuards"
import { newError } from "@/ui/hooks/global/alert"
import { stateList } from "@/static/list/target/stateList"

/**
 * 为目标添加状态
 *
 * params:
 * - stateKey: string - 状态的 key
 * - stacks: number | Array<{key: string, stack: number}> - 层数
 */
export const applyState: EffectFunc = (event: ActionEvent, effect) => {
    const stateKey = effect.params.stateKey as string
    const stacks = effect.params.stacks as number | Array<{key: string, stack: number}>

    if (!stateKey) {
        newError(["applyState 效果缺少 stateKey 参数"])
        return false
    }

    // 查找状态数据
    const stateData = stateList.find(s => s.key === stateKey)
    if (!stateData) {
        newError(["未找到状态数据:", stateKey])
        return false
    }

    // 为所有目标添加状态
    let success = false
    handleEventEntity(event.target, (t) => {
        if (!isEntity(t)) {
            newError(["applyState 只能作用于 Entity，当前类型:", t.participantType])
            return
        }

        // 获取 StateModifier
        const stateModifier = getStateModifier(t as any)
        stateModifier.addState(stateData, stacks || 1, event.source as any)
        success = true
    })

    return success
}

/**
 * 移除目标的状态
 *
 * params:
 * - stateKey: string - 状态的 key
 * - triggerRemoveEffect: boolean - 是否触发 remove 交互效果
 */
export const removeState: EffectFunc = (event: ActionEvent, effect) => {
    const stateKey = effect.params.stateKey as string
    const triggerRemoveEffect = effect.params.triggerRemoveEffect as boolean ?? false

    if (!stateKey) {
        newError(["removeState 效果缺少 stateKey 参数"])
        return false
    }

    // 移除所有目标的状态
    let success = false
    handleEventEntity(event.target, (t) => {
        if (!isEntity(t)) {
            newError(["removeState 只能作用于 Entity，当前类型:", t.participantType])
            return
        }

        const stateModifier = getStateModifier(t as any)
        const removed = stateModifier.removeState(stateKey, triggerRemoveEffect)
        if (removed) {
            success = true
        }
    })

    return success
}

/**
 * 修改目标状态的层数
 *
 * params:
 * - stateKey: string - 状态的 key
 * - stackKey: string - 层数的 key（默认 "default"）
 * - delta: number - 变化量（正数增加，负数减少）
 */
export const changeStateStack: EffectFunc = (event: ActionEvent, effect) => {
    const stateKey = effect.params.stateKey as string
    const stackKey = (effect.params.stackKey as string) ?? "default"
    const rawDelta = effect.params.delta as number
    const delta = effect.params.negate ? -rawDelta : rawDelta

    if (!stateKey) {
        newError(["changeStateStack 效果缺少 stateKey 参数"])
        return false
    }

    if (rawDelta === undefined) {
        newError(["changeStateStack 效果缺少 delta 参数"])
        return false
    }

    // 修改所有目标的状态层数
    let success = false
    handleEventEntity(event.target, (t) => {
        if (!isEntity(t)) {
            newError(["changeStateStack 只能作用于 Entity，当前类型:", t.participantType])
            return
        }

        // default 层走 gainStateStack：目标还没有该状态时自动创建，避免静默失效
        const changed = stackKey === "default"
            ? gainStateStack(t as any, stateKey, delta, event.source as any)
            : getStateModifier(t as any).changeStack(stateKey, stackKey, delta)
        if (changed !== false) {
            success = true
        }
    })

    return success
}

/**
 * 将目标状态的层数设为绝对值
 *
 * params:
 * - stateKey: string - 状态的 key
 * - stackKey: string - 层数的 key（默认 "default"）
 * - value: number - 目标层数
 */
export const setStateStack: EffectFunc = (event: ActionEvent, effect) => {
    const stateKey = effect.params.stateKey as string
    const stackKey = (effect.params.stackKey as string) ?? "default"
    const value = Number(effect.params.value)

    if (!stateKey) {
        newError(["setStateStack 效果缺少 stateKey 参数"])
        return false
    }
    if (!Number.isFinite(value)) {
        newError(["setStateStack 效果缺少有效的 value 参数"])
        return false
    }

    let success = false
    handleEventEntity(event.target, (t) => {
        if (!isEntity(t)) {
            newError(["setStateStack 只能作用于 Entity，当前类型:", t.participantType])
            return
        }

        const stateModifier = getStateModifier(t as any)
        const state = stateModifier.getState(stateKey)
        if (!state) return
        const stack = state.stacks.find((s: { key: string }) => s.key === stackKey)
        if (!stack) return

        const delta = value - stack.stack
        if (delta === 0) {
            success = true
            return
        }
        const changed = stateModifier.changeStack(stateKey, stackKey, delta)
        if (changed !== false) success = true
    })

    return success
}

function effectLooksLikeAttack(key: string, params?: Record<string, any>): boolean {
    if (key === "attack" || key === "damage") return true
    if (key === "repeatEffects") {
        const units = params?.effects as Array<{ key: string, params?: Record<string, any> }> | undefined
        return units?.some(u => effectLooksLikeAttack(u.key, u.params)) ?? false
    }
    return false
}

function findCardPlayEvent(event: ActionEvent): ActionEvent | undefined {
    let current: ActionEvent | undefined = event
    const seen = new Set<ActionEvent>()
    while (current && !seen.has(current)) {
        seen.add(current)
        if (current.key === "useCard" || current.key === "afterUseCard") return current
        current = current.triggerContext?.triggerEvent ?? current.parentEvent
    }
    return undefined
}

function isAttackCardPlay(playEvent: ActionEvent): boolean {
    if (playEvent.key === "useCard") {
        if (playEvent.effects.some(e => effectLooksLikeAttack(e.key, e.params))) return true
    }
    const tags = (playEvent.medium as { tags?: string[] })?.tags
    return Array.isArray(tags) && tags.includes("attack")
}

/**
 * 打完一张攻击牌后清掉状态（活力：每段都加伤，整张牌打完才归零）
 *
 * 反应会 spawn 一条独立事件（key 是 vitalityReset 这类），不能拿这条的 event.key 去判断。
 * 要沿 parentEvent / triggerContext.triggerEvent 找到原来的 useCard / afterUseCard。
 *
 * 敌人：效果挂在 useCard 里，after useCard 时本事件已经打完所有段。
 * 玩家：useCard 是空壳，真伤害在 cardEffect，清零要等 afterUseCard，且只在打出攻击牌时清。
 */
export const consumeStateAfterAttackPlay: EffectFunc = (event: ActionEvent, effect) => {
    const stateKey = effect.params.stateKey as string
    if (!stateKey) {
        newError(["consumeStateAfterAttackPlay 效果缺少 stateKey 参数"])
        return false
    }

    const playEvent = findCardPlayEvent(event)
    if (!playEvent || !isAttackCardPlay(playEvent)) return false

    return removeState(event, effect)
}
