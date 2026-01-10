import { ActionEvent, handleEventEntity } from "@/core/objects/system/ActionEvent"
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"
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
    const delta = effect.params.delta as number

    if (!stateKey) {
        newError(["changeStateStack 效果缺少 stateKey 参数"])
        return false
    }

    if (delta === undefined) {
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

        const stateModifier = getStateModifier(t as any)
        const changed = stateModifier.changeStack(stateKey, stackKey, delta)
        if (changed !== false) {
            success = true
        }
    })

    return success
}