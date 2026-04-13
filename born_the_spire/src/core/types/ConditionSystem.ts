/**
 * 条件系统类型定义
 *
 * 分层设计：
 * 1. 底层：目标解析（复用 TargetSpec）
 *    "owner" → Entity
 *    "allEnemies.random" → Entity
 *
 * 2. 中层：属性访问（EntityAccessor）
 *    "status(health)" → number
 *    "hasOrgan(heart)" → boolean
 *
 * 3. 上层：条件判断
 *    "owner.status(health) > 100" → boolean
 *    "allEnemies.any.hasOrgan(heart)" → boolean
 */

import type { TargetContext } from "./TargetSpec"
import { getTargetValue, resolveTargetOptional } from "./TargetSpec"
import { readEntityValue } from "./EntityAccessor"

// ==================== 条件类型 ====================

/**
 * 单个条件字符串
 * 例如："owner.status(health) > 100"
 */
export type ConditionString = string

/**
 * AND 组合（数组默认是 AND）
 * 例如：["owner.status(health) > 100", "scene == combat"]
 */
export type ConditionArray = (ConditionString | ConditionGroup)[]

/**
 * 复杂条件组
 * 例如：{ or: ["cond1", "cond2"] }
 */
export interface ConditionGroup {
    and?: ConditionArray
    or?: ConditionArray
    not?: ConditionString | ConditionArray | ConditionGroup
}

/**
 * 条件（联合类型）
 */
export type Condition = ConditionString | ConditionArray | ConditionGroup

// ==================== 上下文类型 ====================

/**
 * 条件检查上下文
 */
export interface ConditionContext extends TargetContext {
    // TargetContext 已经包含：
    // - item, owner, source, target
    // - event, trigger, battle
    // 等所有需要的引用
}

// ==================== 比较操作符 ====================

const comparisonOps = ["==", "!=", ">", ">=", "<", "<="] as const
export type ComparisonOp = typeof comparisonOps[number]

// ==================== 条件解析和检查 ====================

/**
 * 检查条件是否满足
 *
 * @param condition - 条件（字符串/数组/对象）
 * @param context - 上下文
 * @returns 是否满足
 *
 * @example
 * checkCondition("owner.status(health) > 100", context)
 * checkCondition(["owner.status(health) > 50%", "scene == combat"], context)
 * checkCondition({ or: ["cond1", "cond2"] }, context)
 */
export function checkCondition(
    condition: Condition,
    context: ConditionContext
): boolean {
    if (typeof condition === "string") {
        return checkSingleCondition(condition, context)
    }

    if (Array.isArray(condition)) {
        // 数组默认是 AND 关系
        return condition.every(c => checkCondition(c, context))
    }

    // ConditionGroup
    if (condition.and) {
        return condition.and.every(c => checkCondition(c, context))
    }

    if (condition.or) {
        return condition.or.some(c => checkCondition(c, context))
    }

    if (condition.not) {
        return !checkCondition(condition.not, context)
    }

    // 空条件对象，默认通过
    return true
}

/**
 * 检查单个条件字符串
 *
 * 格式："target.accessor op value"
 * 示例：
 *   "owner.status(health) > 100"
 *   "owner.current(energy) <= 2"
 *   "scene == combat"
 *   "allEnemies.any.hasOrgan(heart)"
 */
function checkSingleCondition(expr: string, context: ConditionContext): boolean {
    // 先尝试找比较操作符
    for (const op of comparisonOps) {
        const parts = splitByOp(expr, op)
        if (parts) {
            const [left, right] = parts
            return compareValues(left, right, op, context)
        }
    }

    // 没有操作符，说明是布尔表达式
    return checkBooleanCondition(expr, context)
}

/**
 * 按操作符分割表达式
 * 返回 [left, right] 或 null
 */
function splitByOp(expr: string, op: ComparisonOp): [string, string] | null {
    const index = expr.indexOf(op)
    if (index === -1) return null

    // 确保不是更长操作符的一部分，比如 ">=" 包含 ">"
    // 检查前后是否是空格或边界
    const charBefore = expr[index - 1]
    const charAfter = expr[index + op.length]

    const isLeftValid = charBefore === undefined || charBefore === " "
    const isRightValid = charAfter === undefined || charAfter === " "

    if (!isLeftValid || !isRightValid) return null

    const left = expr.slice(0, index).trim()
    const right = expr.slice(index + op.length).trim()
    return [left, right]
}

/**
 * 比较左右两边的值
 */
function compareValues(
    leftExpr: string,
    rightExpr: string,
    op: ComparisonOp,
    context: ConditionContext
): boolean {
    const leftValue = evaluateExpression(leftExpr, context)

    // 百分比处理：当右值是百分比（如 "50%"）时
    if (rightExpr.endsWith("%")) {
        const percent = parseFloat(rightExpr.slice(0, -1)) / 100
        const maxValue = getMaxValueForExpr(leftExpr, context)
        const rightValue = maxValue * percent
        return applyComparison(leftValue, rightValue, op)
    }

    const rightValue = evaluateRightValue(rightExpr, leftExpr, context)
    return applyComparison(leftValue, rightValue, op)
}

/**
 * 从左侧表达式解析最大值（用于百分比比较）
 * 例如："owner.current(health)" → 找到 owner.current.health.options.maxBy
 */
function getMaxValueForExpr(leftExpr: string, context: ConditionContext): number {
    // 解析 "target.accessor" 格式
    const dotIndex = leftExpr.indexOf(".")
    if (dotIndex === -1) return 1

    const targetKey = leftExpr.slice(0, dotIndex)
    const accessorPart = leftExpr.slice(dotIndex + 1)

    // 解析访问器 funcName(arg)
    const match = accessorPart.match(/^(\w+)\(([^)]*)\)$/)
    if (!match) return 1

    const [, funcName, arg] = match

    // 只处理 current() 访问器（health/energy 等）
    if (funcName !== "current") return 1

    // 获取目标对象
    const target = resolveTargetOptional(targetKey, context)
    if (!target || Array.isArray(target)) return 1

    const entity = target as any
    const current = entity.current?.[arg]

    if (!current) return 1

    // from current.options.maxBy
    const maxBy = current.options?.maxBy
    if (maxBy === undefined) return 1

    // maxBy 是数字，直接返回
    if (typeof maxBy === "number") return maxBy

    // maxBy 是字符串，在 status 中查找
    if (typeof maxBy === "string") {
        const maxStatus = entity.status?.[maxBy]
        return maxStatus?.value || 1
    }

    return 1
}

/**
 * 检查布尔条件（没有操作符的情况）
 * 例如："allEnemies.any.hasOrgan(heart)"
 */
function checkBooleanCondition(expr: string, context: ConditionContext): boolean {
    const result = evaluateExpression(expr, context)
    return Boolean(result)
}

/**
 * 计算表达式的值（左侧）
 * 可以是：
 * - 场景/全局值："scene"、"battle.turn"
 * - 目标+访问器："owner.status(health)"、"source.hasRelic(foo)"
 * - 集合+量词+访问器："allEnemies.any.hasOrgan(heart)"
 */
function evaluateExpression(expr: string, context: ConditionContext): any {
    // 先处理特殊的全局值
    if (expr === "scene") {
        return getSceneType(context)
    }
    if (expr.startsWith("battle.")) {
        return getBattleValue(expr.slice("battle.".length), context)
    }

    // 检查是否是集合+量词+访问器格式：allEnemies.any.xxx
    const match = expr.match(/^([a-zA-Z]+)\.(any|all)\.(.+)$/)
    if (match) {
        const [, collectionKey, quantifier, accessorPart] = match
        return evaluateCollectionCondition(collectionKey, quantifier as "any" | "all", accessorPart, context)
    }

    // 检查是否是目标+访问器格式：owner.status(health)
    const dotIndex = expr.indexOf(".")
    if (dotIndex !== -1) {
        const targetKey = expr.slice(0, dotIndex)
        const accessorPart = expr.slice(dotIndex + 1)
        return evaluateTargetAccessor(targetKey, accessorPart, context)
    }

    // 只有目标（不建议，但支持）
    throw new Error(
        `[Condition] 无法评估表达式: "${expr}"。` +
        `格式应为: "target.accessor op value" 或 "collection.quantifier.accessor"`
    )
}

/**
 * 获取场景类型
 */
function getSceneType(context: ConditionContext): string {
    const battle = context.battle
    if (battle) return "combat"

    const room = (context as any).room
    if (room) {
        const roomType = (room as any).type
        if (roomType === "pool") return "pool"
        if (roomType === "blackStore") return "blackStore"
        if (roomType === "event") return "event"
        return roomType
    }

    return "unknown"
}

/**
 * 获取战斗相关的值
 */
function getBattleValue(key: string, context: ConditionContext): number {
    if (key === "turn" || key === "turnCount") {
        return (context.battle as any)?.turnCount ?? 0
    }
    throw new Error(`[Condition] 未知的战斗值: battle.${key}`)
}

/**
 * 评估目标+访问器
 */
function evaluateTargetAccessor(
    targetKey: string,
    accessorPart: string,
    context: ConditionContext
): any {
    const target = resolveTargetOptional(targetKey, context)
    if (target === null || target === undefined) {
        throw new Error(`[Condition] 找不到目标: "${targetKey}"`)
    }

    if (Array.isArray(target)) {
        throw new Error(
            `[Condition] 目标 "${targetKey}" 返回数组，需要使用 .any 或 .all：` +
            `"${targetKey}.any.${accessorPart}" 或 "${targetKey}.all.${accessorPart}"`
        )
    }

    return readEntityValue(accessorPart, target)
}

/**
 * 评估集合条件（any/all）
 */
function evaluateCollectionCondition(
    collectionKey: string,
    quantifier: "any" | "all",
    accessorPart: string,
    context: ConditionContext
): boolean {
    const collection = resolveTargetOptional(collectionKey, context)
    if (collection === null || collection === undefined) {
        throw new Error(`[Condition] 找不到集合: "${collectionKey}"`)
    }

    if (!Array.isArray(collection)) {
        throw new Error(`[Condition] "${collectionKey}" 不是数组，无法使用 .any/.all`)
    }

    const results = collection.map(entity => {
        try {
            return Boolean(readEntityValue(accessorPart, entity))
        } catch {
            return false
        }
    })

    if (quantifier === "any") {
        return results.some(Boolean)
    } else {
        return results.every(Boolean)
    }
}

/**
 * 评估右侧的值
 */
function evaluateRightValue(
    rightExpr: string,
    leftExpr: string,
    context: ConditionContext
): any {
    // 数字
    const num = Number(rightExpr)
    if (!isNaN(num)) {
        return num
    }

    // 字符串（不加引号）
    return rightExpr
}

/**
 * 应用比较操作
 */
function applyComparison(left: any, right: any, op: ComparisonOp): boolean {
    switch (op) {
        case "==": return left == right
        case "!=": return left != right
        case ">": return left > right
        case ">=": return left >= right
        case "<": return left < right
        case "<=": return left <= right
        default: return false
    }
}
