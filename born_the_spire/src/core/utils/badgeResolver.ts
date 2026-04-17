/**
 * 角标解析器
 *
 * 从 entity 的 badges 配置计算出实际要渲染的角标数据
 */

import type { Entity } from "@/core/objects/system/Entity"
import type {
    BadgeConfig,
    BadgeRenderData,
    BadgePosition,
} from "@/core/types/BadgeConfig"
import {
    BADGE_DEFAULT_POSITION,
    BADGE_DEFAULT_STYLE,
} from "@/core/types/BadgeConfig"
import { referenceResolver } from "@/core/utils/ReferenceResolver"
import { checkCondition } from "@/core/types/ConditionSystem"
import type { ConditionContext } from "@/core/types/ConditionSystem"

/**
 * 计算 entity 的所有角标
 *
 * @param entity - 遗物/器官实体
 * @param owner - 拥有者（玩家）
 * @param badges - 角标配置数组
 * @param context - 额外上下文（battle 等）
 * @returns 按位置分组的角标渲染数据
 */
export function resolveBadges(
    entity: Entity,
    owner: Entity | undefined,
    badges: BadgeConfig[],
    context?: Partial<ConditionContext>
): BadgeRenderData[] {
    const results: BadgeRenderData[] = []

    const ctx: ConditionContext = {
        item: entity,
        owner,
        source: entity,
        ...context,
    }

    for (const badge of badges) {
        const rendered = resolveSingleBadge(entity, badge, ctx)
        if (rendered && rendered.visible) {
            results.push(rendered)
        }
    }

    return results
}

/**
 * 计算单个角标
 */
function resolveSingleBadge(
    entity: Entity,
    badge: BadgeConfig,
    context: ConditionContext
): BadgeRenderData | null {
    // 条件检查
    if (badge.showWhen) {
        if (!checkCondition(badge.showWhen, context)) {
            return null
        }
    }

    // 计算显示文本
    const text = resolveBadgeText(entity, badge, context)
    if (text === null) return null

    // 位置
    const position = badge.position ?? BADGE_DEFAULT_POSITION[badge.type]

    // 样式
    const defaultStyle = BADGE_DEFAULT_STYLE[badge.type]
    const style = badge.style
        ? { ...defaultStyle, ...badge.style }
        : { ...defaultStyle }

    return { position, text, style, visible: true }
}

/**
 * 解析角标文本
 */
function resolveBadgeText(
    entity: Entity,
    badge: BadgeConfig,
    context: ConditionContext
): string | null {
    // 固定文字
    if (badge.text !== undefined) {
        return badge.text
    }

    // $ 引用表达式
    if (badge.value !== undefined) {
        const val = referenceResolver.resolve(badge.value, context)
        return formatByType(badge, val, context)
    }

    // 从自身 status 读取
    if (badge.status !== undefined) {
        const status = entity.status?.[badge.status]
        if (!status) return null
        const val = status.value
        return formatByType(badge, val, context, entity)
    }

    return null
}

/**
 * 根据角标类型格式化显示文本
 */
function formatByType(
    badge: BadgeConfig,
    value: any,
    context: ConditionContext,
    entity?: Entity
): string | null {
    switch (badge.type) {
        case "cooldown":
            return formatCooldown(value)

        case "counter":
            return formatCounter(value, badge, context, entity)

        case "state":
            return formatState(value, badge, entity)

        case "indicator":
            return String(value ?? "")

        default:
            return String(value ?? "")
    }
}

/**
 * 冷却格式：0 时显示 ✓，否则显示数字
 */
function formatCooldown(value: any): string {
    const num = Number(value)
    if (isNaN(num)) return String(value)
    return num <= 0 ? "✓" : String(num)
}

/**
 * 计数器格式：显示 "当前/最大"
 */
function formatCounter(
    value: any,
    badge: BadgeConfig,
    context: ConditionContext,
    entity?: Entity
): string | null {
    const current = value

    // 解析最大值
    let max: any = null

    if (badge.maxValue !== undefined) {
        if (typeof badge.maxValue === "number") {
            max = badge.maxValue
        } else {
            max = referenceResolver.resolve(badge.maxValue, context)
        }
    } else if (badge.maxStatus !== undefined && entity) {
        const maxStatusObj = entity.status?.[badge.maxStatus]
        if (maxStatusObj) max = maxStatusObj.value
    } else if (badge.status !== undefined && entity) {
        // 尝试从 status 配置的 max/maxFrom 自动获取
        const statusObj = entity.status?.[badge.status]
        if (statusObj) {
            const statusConfig = statusObj as any
            if (statusConfig._options?.max !== undefined) {
                max = statusConfig._options.max
            } else if (statusConfig._options?.maxFrom) {
                const maxFromStatus = entity.status?.[statusConfig._options.maxFrom]
                if (maxFromStatus) max = maxFromStatus.value
            }
        }
    }

    if (max !== null && max !== undefined) {
        return `${current}/${max}`
    }

    return String(current)
}

/**
 * 状态格式：用 displayMap 映射，没有则直接显示
 */
function formatState(
    value: any,
    badge: BadgeConfig,
    entity?: Entity
): string | null {
    // 尝试从 status 的 displayMap 获取映射
    if (badge.status !== undefined && entity) {
        const statusObj = entity.status?.[badge.status] as any
        if (statusObj?.displayMap && value in statusObj.displayMap) {
            return statusObj.displayMap[value]
        }
    }

    return String(value ?? "")
}
