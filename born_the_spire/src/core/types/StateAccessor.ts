/**
 * State 属性访问模块
 *
 * 与 EntityAccessor.readEntityValue 平行，但作用于 State（非 Entity）
 * 供 ReferenceResolver 在 participant 是 state 时调用
 */

import type { State } from "@/core/objects/system/State"
import type { AccessorResult } from "@/core/types/EntityAccessor"

export function readStateValue(accessor: string, state: State): AccessorResult {
    const match = accessor.match(/^(\w+)\(([^)]*)\)$/)
    if (!match) {
        throw new Error(
            `[StateAccessor] 无法解析访问器: "${accessor}"。` +
            `支持格式: hasTrait(key), trait(key), stateStack(key?), key(), label()`
        )
    }

    const [, funcName, arg] = match

    switch (funcName) {
        case "hasTrait":
            return hasTrait(arg, state)
        case "trait":
            return trait(arg, state)
        case "stateStack":
            return stateStack(arg, state)
        case "key":
            return state.key ?? ""
        case "label":
            return state.label ?? ""
        default:
            throw new Error(
                `[StateAccessor] State 不支持访问器: "${funcName}"。` +
                `支持: hasTrait, trait, stateStack, key, label`
            )
    }
}

// ==================== 实现 ====================

/**
 * hasTrait(toxic)        → traits 里有没有 toxic 这个 key
 * hasTrait(toxic,true)   → traits.toxic === true
 */
function hasTrait(arg: string, state: State): boolean {
    const traits = (state as any).traits
    if (!traits || typeof traits !== "object" || Array.isArray(traits)) return false

    const [key, value] = arg.split(",").map(s => s.trim())
    if (!key) return false

    if (value === undefined || value === "") {
        return key in traits && traits[key] !== false && traits[key] !== undefined
    }

    return traits[key] === value
}

/**
 * trait(toxic) → traits.toxic 的值
 */
function trait(arg: string, state: State): AccessorResult {
    const traits = (state as any).traits
    if (!traits || typeof traits !== "object" || Array.isArray(traits)) return ""

    const [key] = arg.split(",").map(s => s.trim())
    if (!key) return ""
    return traits[key] ?? ""
}

/**
 * stateStack()              → 第一个 stack 的层数
 * stateStack(default)       → key 为 default 的 stack 层数
 *
 * 注意：这里读的是 state 自己的 stacks，不是"某个状态在实体上的层数"
 */
function stateStack(arg: string, state: State): number {
    const stacks = (state as any).stacks ?? []
    if (!Array.isArray(stacks) || stacks.length === 0) return 0

    const [stackKey] = arg ? arg.split(".") : []
    if (!stackKey) {
        return stacks[0]?.stack ?? 0
    }
    const s = stacks.find((x: any) => x.key === stackKey)
    return s?.stack ?? 0
}