/**
 * 条件系统类型定义
 *
 * 使用统一的 $ 引用语法（复用 ReferenceResolver）
 *
 * 示例：
 *   "$owner.status(health) > 100"
 *   "$owner.current(health) <= 50%"
 *   "$scene == combat"
 *   "$allEnemies.any.hasOrgan(heart)"
 */

import type { TargetContext } from "./TargetSpec"
import { referenceResolver } from "@/core/utils/ReferenceResolver"

// ==================== 条件类型 ====================

/**
 * 单个条件字符串
 * 例如："$owner.status(health) > 100"
 */
export type ConditionString = string

/**
 * AND 组合（数组默认是 AND）
 * 例如：["$owner.status(health) > 50%", "$scene == combat"]
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
 * checkCondition("$owner.status(health) > 100", context)
 * checkCondition(["$owner.status(health) > 50%", "$scene == combat"], context)
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
 * 格式："$target.accessor op value"
 * 示例：
 *   "$owner.status(health) > 100"
 *   "$owner.current(energy) <= 2"
 *   "$scene == combat"
 *   "$allEnemies.any.hasOrgan(heart)"
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

    // 没有操作符，说明是布尔表达式（如 "$allEnemies.any.hasOrgan(heart)"）
    return Boolean(evaluateExpression(expr, context))
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

    const rightValue = evaluateRightValue(rightExpr, context)
    return applyComparison(leftValue, rightValue, op)
}

/**
 * 计算表达式的值
 *
 * 统一委托给 ReferenceResolver 处理 $ 引用
 * 非 $ 开头的视为字面量
 */
function evaluateExpression(expr: string, context: ConditionContext): any {
    // $ 开头：委托给 ReferenceResolver
    if (expr.startsWith("$")) {
        return referenceResolver.resolve(expr, context)
    }

    // 非 $ 开头：尝试作为字面量
    const num = Number(expr)
    if (!isNaN(num)) return num

    return expr
}

/**
 * 从左侧表达式解析最大值（用于百分比比较）
 * 例如："$owner.current(health)" → 找到 owner.current.health.options.maxBy
 *
 * 通过 ReferenceResolver 获取目标实体，然后访问 current 的 maxBy 配置
 */
function getMaxValueForExpr(leftExpr: string, context: ConditionContext): number {
    // 去掉 $ 前缀后解析
    const expr = leftExpr.startsWith("$") ? leftExpr.slice(1) : leftExpr

    // 解析 "target.accessor" 格式
    const dotIndex = expr.indexOf(".")
    if (dotIndex === -1) return 1

    const targetKey = expr.slice(0, dotIndex)
    const accessorPart = expr.slice(dotIndex + 1)

    // 解析访问器 funcName(arg)
    const match = accessorPart.match(/^(\w+)\(([^)]*)\)$/)
    if (!match) return 1

    const [, funcName, arg] = match

    // 只处理 current() 访问器（health/energy 等）
    if (funcName !== "current") return 1

    // 通过 ReferenceResolver 获取目标实体
    const entity = referenceResolver.resolve("$" + targetKey, context) as any
    if (!entity || Array.isArray(entity)) return 1

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
 * 评估右侧的值
 *
 * $ 开头 → ReferenceResolver
 * 数字 → 返回数字
 * 其他 → 字符串字面量
 */
function evaluateRightValue(
    rightExpr: string,
    context: ConditionContext
): any {
    // $ 引用 → 走 ReferenceResolver
    if (rightExpr.startsWith("$")) {
        return referenceResolver.resolve(rightExpr, context)
    }

    // random(...) → 走 ReferenceResolver
    if (rightExpr.startsWith("random(")) {
        return referenceResolver.resolve(rightExpr, context)
    }

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
