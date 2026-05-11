/**
 * 统一引用解析器
 *
 * 统一处理 $xxx 语法的引用解析
 * 供效果参数、条件系统、角标系统、触发器目标解析等使用
 *
 * $ 表示"引用对象"，是全局统一的引用语法
 *
 * 支持的语法：
 *   $eventResult(key)                      → 从事件结果获取值
 *   $triggerEffect.params(key)             → 获取触发效果的参数（延迟解析）
 *   $triggerEffect.target.accessor(args)   → 获取触发效果的事件目标的属性
 *   $participant.accessor(args)            → 从参与者获取属性值
 *   $event.info(key)                       → 获取触发事件的 info 字段值
 *   $scene                                 → 当前场景类型（combat/pool/event/...）
 *   $battle.turn                           → 当前战斗回合数
 *   $collection.any.accessor(args)         → 集合中任意一个满足条件
 *   $collection.all.accessor(args)         → 集合中全部满足条件
 *   random(min,max)                        → 生成随机数（不带 $）
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

import { getTargetValue, resolveTargetOptional } from "@/core/types/TargetSpec"
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
    type: "eventResult" | "eventInfo" | "triggerEffect" | "triggerEffectTarget" | "participant" | "unknown"
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
            case "eventInfo":
                return this.resolveEventInfo(parsed, context)
            case "triggerEffect":
                return this.resolveTriggerEffect(parsed, context)
            case "triggerEffectTarget":
                return this.resolveTriggerEffectTarget(parsed, context)
            case "participant":
                return this.resolveParticipantReference(parsed, context)
            default:
                // 通用解析：处理 $scene、$battle.turn、$collection.any.accessor 等
                return this.resolveGeneralReference(ref, context)
        }
    }

    private parseReference(ref: string): ParsedReference {
        // $eventResult(key)
        const eventResultMatch = ref.match(/^\$eventResult\(([^)]*)\)$/)
        if (eventResultMatch) {
            return { type: "eventResult", args: [eventResultMatch[1]], raw: ref }
        }

        // $event.info(key)
        const eventInfoMatch = ref.match(/^\$event\.info\(([^)]*)\)$/)
        if (eventInfoMatch) {
            return { type: "eventInfo", args: [eventInfoMatch[1]], raw: ref }
        }

        // $triggerEffect.params(key)
        const triggerEffectMatch = ref.match(/^\$triggerEffect\.params\(([^)]*)\)$/)
        if (triggerEffectMatch) {
            return { type: "triggerEffect", args: [triggerEffectMatch[1]], raw: ref }
        }

        // $triggerEffect.target.accessor(args) — 获取触发效果的事件目标的属性
        const triggerEffectTargetMatch = ref.match(/^\$triggerEffect\.target\.(\w+)\(([^)]*)\)$/)
        if (triggerEffectTargetMatch) {
            const argsStr = triggerEffectTargetMatch[2]
            const args = argsStr ? argsStr.split(",").map(s => s.trim()) : []
            return {
                type: "triggerEffectTarget",
                accessor: triggerEffectTargetMatch[1],
                args,
                raw: ref
            }
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

    private resolveEventInfo(parsed: ParsedReference, context: ReferenceContext): any {
        const key = parsed.args?.[0]
        if (!key) {
            newError([`$event.info 需要一个参数: ${parsed.raw}`])
            return undefined
        }
        return context.event?.info?.[key]
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

    /**
     * 解析 $triggerEffect.target.accessor(args)
     * 从事件目标（Effect）导航到该 Effect 的 actionEvent.target（被作用的实体）
     */
    private resolveTriggerEffectTarget(parsed: ParsedReference, context: ReferenceContext): any {
        // 事件的 target 应该是 Effect（通过 targetType: "triggerEffect" 设置）
        const eventTarget = Array.isArray(context.target) ? context.target[0] : context.target
        if (!eventTarget || (eventTarget as any)?.participantType !== 'effect') {
            newError([`$triggerEffect.target 需要事件目标为 Effect 类型，当前:`, (eventTarget as any)?.participantType])
            return undefined
        }

        // 导航到 Effect 的事件目标
        const effectEventTarget = (eventTarget as any).actionEvent?.target
        if (!effectEventTarget) return undefined

        const targetEntity = Array.isArray(effectEventTarget) ? effectEventTarget[0] : effectEventTarget
        if (!targetEntity || !(targetEntity as any)?.participantType) return undefined

        // 调用 accessor
        const { accessor, args } = parsed
        if (!accessor) return undefined
        const argsStr = args && args.length > 0 ? args.join(",") : ""
        const accessorStr = `${accessor}(${argsStr})`
        return this.resolveAccessorOnEntity(targetEntity as Entity, accessorStr)
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

    // ==================== 通用引用解析 ====================

    /**
     * 通用引用解析（处理特殊模式匹配不到的 $ 表达式）
     *
     * 支持：
     *   $scene                              → 场景类型
     *   $battle.turn / $battle.turnCount    → 战斗回合数
     *   $collection.any.accessor(args)      → 集合量词
     *   $collection.all.accessor(args)      → 集合量词
     *   $target.accessor(args)              → 目标+访问器（通用形式）
     *   $target                             → 仅解析目标对象
     */
    private resolveGeneralReference(ref: string, context: ReferenceContext): any {
        const expr = ref.slice(1) // 去掉 $

        // 全局值：$scene
        if (expr === "scene") {
            return this.getSceneType(context)
        }

        // 全局路径：$battle.turn / $battle.turnCount
        if (expr.startsWith("battle.")) {
            return this.getBattleValue(expr.slice("battle.".length), context)
        }

        // 集合 + 量词：$allEnemies.any.hasOrgan(heart)
        const collectionMatch = expr.match(/^(\w+)\.(any|all)\.(.+)$/)
        if (collectionMatch) {
            const [, collectionKey, quantifier, accessorPart] = collectionMatch
            return this.resolveCollectionQuantifier(
                collectionKey,
                quantifier as "any" | "all",
                accessorPart,
                context
            )
        }

        // 目标 + 访问器：$owner.status(health)
        const dotIndex = expr.indexOf(".")
        if (dotIndex !== -1) {
            const targetKey = expr.slice(0, dotIndex)
            const accessorPart = expr.slice(dotIndex + 1)
            return this.resolveTargetAccessor(targetKey, accessorPart, context, ref)
        }

        // 仅目标（无访问器）：$owner
        const target = resolveTargetOptional(expr, context)
        if (target !== null) return target

        newError([`引用解析失败: 无法解析 "${ref}"`])
        return undefined
    }

    /**
     * 解析目标+访问器
     */
    private resolveTargetAccessor(
        targetKey: string,
        accessorPart: string,
        context: ReferenceContext,
        raw: string
    ): any {
        const target = resolveTargetOptional(targetKey, context)
        if (target === null || target === undefined) {
            newError([`找不到目标: "${targetKey}"，在引用: "${raw}"`])
            return undefined
        }

        if (Array.isArray(target)) {
            newError([
                `目标 "${targetKey}" 返回数组，需要使用 .any 或 .all：`,
                `"$${targetKey}.any.${accessorPart}" 或 "$${targetKey}.all.${accessorPart}"`
            ])
            return undefined
        }

        return readEntityValue(accessorPart, target as Entity)
    }

    /**
     * 集合量词解析：$collection.any/all.accessor(args)
     */
    private resolveCollectionQuantifier(
        collectionKey: string,
        quantifier: "any" | "all",
        accessorPart: string,
        context: ReferenceContext
    ): boolean {
        const collection = resolveTargetOptional(collectionKey, context)
        if (collection === null || collection === undefined) {
            newError([`找不到集合: "${collectionKey}"`])
            return false
        }

        if (!Array.isArray(collection)) {
            newError([`"${collectionKey}" 不是数组，无法使用 .any/.all`])
            return false
        }

        const results = collection.map(entity => {
            try {
                return Boolean(readEntityValue(accessorPart, entity))
            } catch {
                return false
            }
        })

        return quantifier === "any"
            ? results.some(Boolean)
            : results.every(Boolean)
    }

    /**
     * 获取场景类型
     */
    private getSceneType(context: ReferenceContext): string {
        if (context.battle) return "combat"

        const room = (context as any).room
        if (room) {
            const roomType = (room as any).type
            if (roomType) return roomType
        }

        return "unknown"
    }

    /**
     * 获取战斗相关值
     */
    private getBattleValue(key: string, context: ReferenceContext): number {
        if (key === "turn" || key === "turnCount") {
            return (context.battle as any)?.turnCount ?? 0
        }
        newError([`未知的战斗值: $battle.${key}`])
        return 0
    }

    // ==================== 随机数 ====================

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
