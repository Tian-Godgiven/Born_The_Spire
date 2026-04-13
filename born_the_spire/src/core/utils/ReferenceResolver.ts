/**
 * 统一引用解析器
 *
 * 统一处理 $participant.accessor(args) 语法的引用解析
 * 供效果参数、条件系统、触发器目标解析等使用
 *
 * 支持的语法：
 *   $eventResult(key)           → 从事件结果获取值
 *   $triggerEffect.params(key)  → 获取触发效果的参数（延迟解析）
 *   $participant.accessor(args) → 从参与者获取属性值
 *   random(min,max)             → 生成随机数（不带 $）
 *
 * accessor 类型（复用 EntityAccessor）：
 *   status(key)     → 属性值
 *   current(key)    → 当前值
 *   stateStack(key?)→ 状态层数（key 可选，默认 "default"）
 *   hasOrgan(key)   → 是否拥有器官
 *   hasRelic(key)   → 是否拥有遗物
 *   hasCard(key)    → 手牌中是否有某张牌
 *   hasState(key)   → 是否有某个状态
 *   hasStatus(key)  → 是否有某个属性且 > 0
 */

import type { TargetContext } from "@/core/types/TargetSpec"
import type { ActionEvent } from "@/core/objects/system/ActionEvent"
import type { Effect } from "@/core/objects/system/effect/Effect"
import type { Entity } from "@/core/objects/system/Entity"
import type { AccessorResult } from "@/core/types/EntityAccessor"

import { getTargetValue } from "@/core/types/TargetSpec"
import { readEntityValue } from "@/core/types/EntityAccessor"
import { getContextRandom } from "@/core/hooks/random"
import { newError } from "@/ui/hooks/global/alert"

// ==================== 类型定义 ====================

/**
 * 引用解析上下文（扩展 TargetContext）
 */
export interface ReferenceContext extends TargetContext {
    lazyResolve?: boolean  // true 时 $triggerEffect.params() 原样返回
}

/**
 * 解析后的引用（内部使用）
 */
interface ParsedReference {
    type: "eventResult" | "triggerEffect" | "participant" | "unknown"
    participant?: string
    accessor?: string
    args?: string[]
    raw: string
}

// ==================== 单例类 ====================

export class ReferenceResolver {
    private static _instance: ReferenceResolver

    private constructor() {}

    static getInstance(): ReferenceResolver {
        if (!ReferenceResolver._instance) {
            ReferenceResolver._instance = new ReferenceResolver()
        }
        return ReferenceResolver._instance
    }

    // ==================== 公共 API ====================

    /**
     * 主入口：解析单个值
     */
    resolve(value: any, context: ReferenceContext): any {
        if (typeof value !== "string") {
            return value
        }

        if (value.startsWith("random(")) {
            return this.resolveRandom(value)
        }

        if (value.startsWith("$")) {
            return this.resolveReference(value, context)
        }

        return value
    }

    /**
     * 批量解析对象中的所有引用值
     */
    resolveObject<T extends Record<string, any>>(obj: T, context: ReferenceContext): T {
        const result: Record<string, any> = {}
        for (const [key, value] of Object.entries(obj)) {
            result[key] = this.resolve(value, context)
        }
        return result as T
    }

    /**
     * 检查一个值是否需要解析
     */
    needsResolution(value: any): boolean {
        if (typeof value !== "string") {
            return false
        }
        return value.startsWith("$") || value.startsWith("random(")
    }

    /**
     * 直接在 Entity 上调用 accessor（供 ConditionSystem 复用）
     */
    resolveAccessorOnEntity(entity: Entity, accessorPart: string): AccessorResult {
        return readEntityValue(accessorPart, entity)
    }

    // ==================== 内部解析方法 ====================

    private resolveReference(ref: string, context: ReferenceContext): any {
        const parsed = this.parseReference(ref)

        switch (parsed.type) {
            case "eventResult":
                return this.resolveEventResult(parsed, context)
            case "triggerEffect":
                return this.resolveTriggerEffect(parsed, context)
            case "participant":
                return this.resolveParticipantReference(parsed, context)
            default:
                newError([`引用解析失败: 无法解析 "${ref}"`])
                return undefined
        }
    }

    private parseReference(ref: string): ParsedReference {
        // $eventResult(key)
        const eventResultMatch = ref.match(/^\$eventResult\(([^)]*)\)$/)
        if (eventResultMatch) {
            return { type: "eventResult", args: [eventResultMatch[1]], raw: ref }
        }

        // $triggerEffect.params(key)
        const triggerEffectMatch = ref.match(/^\$triggerEffect\.params\(([^)]*)\)$/)
        if (triggerEffectMatch) {
            return { type: "triggerEffect", args: [triggerEffectMatch[1]], raw: ref }
        }

        // $participant.accessor(args)
        const participantMatch = ref.match(/^\$(\w+)\.(\w+)\(([^)]*)\)$/)
        if (participantMatch) {
            const argsStr = participantMatch[3]
            const args = argsStr ? argsStr.split(",").map(s => s.trim()) : []
            return {
                type: "participant",
                participant: participantMatch[1],
                accessor: participantMatch[2],
                args,
                raw: ref
            }
        }

        return { type: "unknown", raw: ref }
    }

    private resolveEventResult(parsed: ParsedReference, context: ReferenceContext): any {
        const key = parsed.args?.[0]
        if (!key) {
            newError([`$eventResult 需要一个参数: ${parsed.raw}`])
            return undefined
        }
        return context.event?.getEventResult(key)
    }

    private resolveTriggerEffect(parsed: ParsedReference, context: ReferenceContext): any {
        const key = parsed.args?.[0]
        if (!key) {
            newError([`$triggerEffect.params 需要一个参数: ${parsed.raw}`])
            return undefined
        }

        // lazyResolve 模式下原样返回（让 doEffectFunc 执行时再解析）
        if (context.lazyResolve) {
            return parsed.raw
        }

        return (context.triggerEffect as any)?.params?.[key]
    }

    private resolveParticipantReference(parsed: ParsedReference, context: ReferenceContext): any {
        const { participant, accessor, args } = parsed
        if (!participant || !accessor) {
            newError([`引用格式错误: ${parsed.raw}`])
            return undefined
        }

        // 1. 解析 participant 为实体
        const entity = getTargetValue(participant, context)
        if (!entity) {
            newError([`找不到参与者: ${participant}，在引用: ${parsed.raw}`])
            return undefined
        }

        // 2. 如果是数组，取第一个有效实体
        const targetEntity = Array.isArray(entity)
            ? entity.find(e => (e as any)?.participantType)
            : entity

        if (!targetEntity || !(targetEntity as any)?.participantType) {
            newError([`参与者 "${participant}" 不是有效实体: ${typeof entity}`])
            return undefined
        }

        // 3. 构建 accessor 字符串，调用 EntityAccessor
        const argsStr = args && args.length > 0 ? args.join(",") : ""
        const accessorStr = `${accessor}(${argsStr})`
        return this.resolveAccessorOnEntity(targetEntity as Entity, accessorStr)
    }

    private resolveRandom(expr: string): any {
        const match = expr.match(/^random\(([^,]+),([^)]+)\)$/)
        if (!match) {
            newError([`随机数格式错误: "${expr}"，应为 random(min,max)`])
            return undefined
        }

        const min = Number(match[1].trim())
        const max = Number(match[2].trim())

        if (isNaN(min) || isNaN(max)) {
            newError([`随机数解析失败: 无效的数值 "${expr}"`])
            return undefined
        }

        if (min > max) {
            newError([`随机数解析失败: 最小值不能大于最大值 "${expr}"`])
            return undefined
        }

        const rng = getContextRandom("referenceResolver")
        const isInteger = Number.isInteger(min) && Number.isInteger(max)

        return isInteger ? rng.nextInt(min, max) : rng.nextFloatRange(min, max)
    }
}

// 全局单例
export const referenceResolver = ReferenceResolver.getInstance()

// 便捷导出
export function resolveReference(value: any, context: ReferenceContext): any {
    return referenceResolver.resolve(value, context)
}

export function resolveReferenceObject<T extends Record<string, any>>(obj: T, context: ReferenceContext): T {
    return referenceResolver.resolveObject(obj, context)
}

export function needsReferenceResolution(value: any): boolean {
    return referenceResolver.needsResolution(value)
}

export function resolveAccessorOnEntity(entity: Entity, accessorPart: string): AccessorResult {
    return referenceResolver.resolveAccessorOnEntity(entity, accessorPart)
}
