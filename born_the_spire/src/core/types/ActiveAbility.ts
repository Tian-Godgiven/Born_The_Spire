import { Entity } from "@/core/objects/system/Entity"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import type { Describe } from "@/ui/hooks/express/describe"

/**
 * 主动能力触发配置
 */
export interface ActiveTriggerConfig {
    rightClick?: {
        type: "ability" | "menu" | "callback"
        abilityKey?: string
        callback?: (item: Entity, owner: Entity) => void
    }
    showInDetail?: boolean  // 默认 true
}

/**
 * 能力菜单配置
 */
export interface AbilityMenuConfig {
    title?: string
    layout?: "list" | "grid"
    items: AbilityMenuItem[]
}

/**
 * 能力菜单项
 */
export interface AbilityMenuItem {
    type: "ability" | "callback"
    abilityKey?: string
    label?: string
    describe?: Describe
    callback?: (item: Entity, owner: Entity) => void
    canUse?: (item: Entity, owner: Entity) => boolean
}

/**
 * 主动能力定义
 */
export interface ActiveAbility {
    key: string
    label: string
    describe: Describe

    // 使用方式
    usage: {
        type: "direct" | "selectTarget" | "toggle" | "allTargets"
        targetType?: "enemy" | "ally" | "card" | "organ"
    }

    // 使用限制
    restrictions?: ActiveAbilityRestrictions

    // 效果定义
    effects: EffectUnit[]

    // 使用后永久失效
    disableAfterUse?: boolean

    // 自定义执行逻辑（高级）
    onActivate?: (item: Entity, owner: Entity, context: any) => void
}

/**
 * 主动能力限制
 */
export interface ActiveAbilityRestrictions {
    // 消耗型限制
    costs?: {
        energy?: number
        health?: number
        material?: number
    }

    // 次数型限制
    uses?: {
        perTurn?: number
        perBattle?: number
        perFloor?: number
        total?: number
    }

    // 冷却型限制
    cooldown?: number

    // 条件型限制
    conditions?: {
        healthBelow?: number
        healthAbove?: number
        minHandSize?: number
        maxHandSize?: number
        hasStatus?: string
        notHasStatus?: string
        scene?: "combat" | "nonCombat" | "anytime"
    }

    // 充能型限制
    charges?: {
        required: number
        gainOn?: string
    }

    // 自定义检查
    customCheck?: (item: Entity, owner: Entity, context: any) => boolean | string
}

/**
 * 视觉反馈配置
 */
export interface ActiveDisplayConfig {
    badges?: ActiveBadgeConfig[]
    disabled?: (item: Entity, owner: Entity) => boolean
    highlight?: (item: Entity, owner: Entity) => string | null
}

/**
 * 角标配置
 */
export interface ActiveBadgeConfig {
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left"
    type: "counter" | "cooldown" | "energy" | "custom"
    source?: "usesRemaining" | "cooldownTurns" | "energyCost"
    getValue?: (item: Entity, owner: Entity) => string | number
    getColor?: (item: Entity, owner: Entity) => string
    showWhen?: (item: Entity, owner: Entity) => boolean
}

/**
 * 使用状态追踪
 */
export interface AbilityUsageState {
    // 次数使用记录
    usesThisTurn: Record<string, number>
    usesThisBattle: Record<string, number>
    usesThisFloor: Record<string, number>
    usesTotal: Record<string, number>

    // 冷却记录
    cooldowns: Record<string, number>

    // 充能记录
    charges: Record<string, number>

    // 开关状态
    toggleStates: Record<string, boolean>
}

/**
 * 能力检查结果
 */
export interface AbilityCheckResult {
    canUse: boolean
    reason?: string
    missingResources?: {
        energy?: number
        health?: number
        material?: number
    }
}

/**
 * 主动能力上下文
 */
export interface ActiveAbilityContext {
    item: Entity
    owner: Entity
    ability: ActiveAbility
    selectedTargets?: Entity[]
    eventData?: any
}