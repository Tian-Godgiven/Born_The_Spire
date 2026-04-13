/**
 * 中层：实体属性访问模块
 *
 * 职责：从 Entity 对象上读取属性值
 * 供 condition 系统和其他需要读取属性的系统使用
 *
 * 支持的访问方式：
 *   status(key)     → 读取 entity.status[key].value
 *   current(key)    → 读取 entity.current[key].value
 *   hasStatus(key)  → entity.status[key] 是否存在且 > 0
 *   hasState(key)   → 是否拥有某个状态（State，如易伤、中毒）
 *   hasOrgan(key)   → 是否拥有某个器官
 *   hasRelic(key)   → 是否拥有某个遗物
 *   hasCard(key)    → 手牌中是否有某张牌
 */

import type { Entity } from "@/core/objects/system/Entity"
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"

export type AccessorResult = number | string | boolean

/**
 * 解析访问器字符串，从实体上读取值
 *
 * @param accessor - 访问器字符串，如 "status(health)"、"current(energy)"
 * @param entity - 目标实体
 * @returns 读取到的值
 *
 * @example
 * readEntityValue("status(health)", player)   // → 100
 * readEntityValue("current(energy)", player)  // → 3
 * readEntityValue("hasOrgan(heart)", player)  // → true
 * readEntityValue("state(poison)", player)    // → State 对象
 * readEntityValue("stateStack()", player)     // → 0 (默认 default stack)
 * readEntityValue("stateStack(poison)", player) // → 3
 */
export function readEntityValue(accessor: string, entity: Entity): AccessorResult {
    // 解析函数调用格式：funcName(arg)
    const match = accessor.match(/^(\w+)\(([^)]*)\)$/)
    if (match) {
        const [, funcName, arg] = match
        return callAccessorFunction(funcName, arg, entity)
    }

    // 无括号的直接属性访问（未来扩展用）
    throw new Error(
        `[EntityAccessor] 无法解析访问器: "${accessor}"。` +
        `支持的格式: status(key), current(key), hasStatus(key), hasState(key), hasOrgan(key), hasRelic(key), hasCard(key), state(key), stateStack(key?)`
    )
}

/**
 * 调用访问器函数
 */
function callAccessorFunction(funcName: string, arg: string, entity: Entity): AccessorResult {
    const fn = builtinAccessors.get(funcName) ?? customAccessors.get(funcName)
    if (!fn) {
        throw new Error(
            `[EntityAccessor] 未知的访问器: "${funcName}"。` +
            `内置访问器: status, current, hasStatus, hasState, hasOrgan, hasRelic, hasCard, state, stateStack`
        )
    }
    return fn(arg, entity)
}

// ==================== 内置访问器注册 ====================

type AccessorFunction = (arg: string, entity: Entity) => AccessorResult

const customAccessors = new Map<string, AccessorFunction>()

const builtinAccessors = new Map<string, AccessorFunction>([
    ["status",      (arg, entity) => readStatus(arg, entity)],
    ["current",     (arg, entity) => readCurrent(arg, entity)],
    ["hasStatus",   (arg, entity) => hasStatus(arg, entity)],
    ["hasState",    (arg, entity) => hasState(arg, entity)],
    ["hasOrgan",    (arg, entity) => hasOrgan(arg, entity)],
    ["hasRelic",    (arg, entity) => hasRelic(arg, entity)],
    ["hasCard",     (arg, entity) => hasCard(arg, entity)],
    ["state",       (arg, entity) => state(arg, entity)],
    ["stateStack",  (arg, entity) => stateStack(arg, entity)],
])

// ==================== 内置访问器实现 ====================

function readStatus(key: string, entity: Entity): number | string {
    const status = entity.status?.[key]
    if (status === undefined) {
        throw new Error(`[EntityAccessor] 实体 "${entity.label}" 没有属性 "${key}"`)
    }
    return status.value
}

function readCurrent(key: string, entity: Entity): number {
    const current = (entity as any).current?.[key]
    if (current === undefined) {
        throw new Error(`[EntityAccessor] 实体 "${entity.label}" 没有当前值 "${key}"`)
    }
    return current.value
}

/**
 * 读取 State 对象
 * 注意：这里返回的是 State 对象本身，不是层数
 * 要获取层数请使用 stateStack(key) 访问器
 */
function state(key: string, entity: Entity): any {
    // 如果 entity 本身就是 State，直接返回
    if ((entity as any).participantType === "state") {
        return entity
    }

    // 从 StateModifier 获取 State
    try {
        const stateModifier = getStateModifier(entity as any)
        return stateModifier.getState(key)
    } catch {
        return undefined
    }
}

/**
 * 读取 State 的层数（stack）
 * stateStack() 默认读取 "default" stack
 * stateStack(key) 读取指定 key 的 stack
 */
function stateStack(key: string, entity: Entity): number {
    const stateObj = state(key, entity)
    if (!stateObj) return 0
    const stacks = (stateObj as any).stacks || []
    if (key === "") {
        // 没有指定 key，读取第一个 stack
        return stacks[0]?.stack ?? 0
    }
    const stack = stacks.find((s: any) => s.key === key)
    return stack?.stack ?? 0
}

function hasStatus(key: string, entity: Entity): boolean {
    const status = entity.status?.[key]
    if (!status) return false
    const val = status.value
    if (typeof val === "number") return val > 0
    return !!val
}

function hasState(key: string, entity: Entity): boolean {
    try {
        const stateModifier = getStateModifier(entity as any)
        return stateModifier.hasState(key)
    } catch {
        return false
    }
}

function hasOrgan(key: string, entity: Entity): boolean {
    const organs = (entity as any).organs
    if (!organs) return false
    return organs.some((o: any) => o.key === key)
}

function hasRelic(key: string, entity: Entity): boolean {
    const relics = (entity as any).relics?.()
    if (!relics) return false
    return relics.some((r: any) => r.key === key)
}

function hasCard(key: string, entity: Entity): boolean {
    const handPile = (entity as any).cardPiles?.handPile
    if (!handPile) return false
    return handPile.some((c: any) => c.key === key)
}

// ==================== 自定义访问器注册 ====================

/**
 * 注册自定义访问器（供 mod 使用）
 *
 * @example
 * registerAccessor("myMod_customValue", (arg, entity) => {
 *   return (entity as any).myCustomField ?? 0
 * })
 *
 * // 使用：
 * "owner.myMod_customValue(someArg) > 10"
 */
export function registerAccessor(name: string, fn: AccessorFunction): void {
    if (customAccessors.has(name)) {
        console.warn(`[EntityAccessor] 覆盖已有的访问器: "${name}"`)
    }
    customAccessors.set(name, fn)
}
