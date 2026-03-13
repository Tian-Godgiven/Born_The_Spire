import { Entity } from "@/core/objects/system/Entity"
import {
    ActiveAbility,
    ActiveDisplayConfig,
    ActiveBadgeConfig,
    AbilityCheckResult
} from "@/core/types/ActiveAbility"
import { usageTracker } from "./UsageTracker"
import { RestrictionChecker } from "./RestrictionChecker"
import { getStatusValue } from "@/core/objects/system/status/Status"

/**
 * 角标信息
 */
export interface BadgeInfo {
    position: string
    text: string | number
    color: string
    visible: boolean
}

/**
 * 显示管理器
 * 负责管理主动能力的视觉反馈，包括角标、置灰、高亮等
 */
export class DisplayManager {
    private restrictionChecker = new RestrictionChecker()

    /**
     * 计算物品的角标显示
     */
    calculateBadges(
        item: Entity,
        owner: Entity,
        abilities: ActiveAbility[],
        displayConfig?: ActiveDisplayConfig
    ): BadgeInfo[] {
        if (!displayConfig?.badges) return []

        const badges: BadgeInfo[] = []

        for (const badgeConfig of displayConfig.badges) {
            const badge = this.calculateSingleBadge(item, owner, abilities, badgeConfig)
            if (badge) {
                badges.push(badge)
            }
        }

        return badges
    }

    /**
     * 计算单个角标
     */
    private calculateSingleBadge(
        item: Entity,
        owner: Entity,
        abilities: ActiveAbility[],
        config: ActiveBadgeConfig
    ): BadgeInfo | null {
        // 检查显示条件
        if (config.showWhen && !config.showWhen(item, owner)) {
            return null
        }

        let text: string | number = ""
        let color = "#666666"

        // 根据类型和数据源计算显示值
        if (config.type === "custom") {
            // 自定义类型
            if (config.getValue) {
                text = config.getValue(item, owner)
            }
            if (config.getColor) {
                color = config.getColor(item, owner)
            }
        } else {
            // 制式类型
            const result = this.calculateStandardBadge(item, owner, abilities, config)
            if (!result) return null

            text = result.text
            color = result.color
        }

        return {
            position: config.position,
            text,
            color,
            visible: true
        }
    }

    /**
     * 计算制式角标
     */
    private calculateStandardBadge(
        item: Entity,
        owner: Entity,
        abilities: ActiveAbility[],
        config: ActiveBadgeConfig
    ): { text: string | number, color: string } | null {
        const usageState = usageTracker.getUsageState(item)

        switch (config.type) {
            case "counter":
                return this.calculateCounterBadge(item, abilities, config)

            case "cooldown":
                return this.calculateCooldownBadge(item, abilities, config)

            case "energy":
                return this.calculateEnergyBadge(abilities, config)

            default:
                return null
        }
    }

    /**
     * 计算计数器角标
     */
    private calculateCounterBadge(
        item: Entity,
        abilities: ActiveAbility[],
        config: ActiveBadgeConfig
    ): { text: string | number, color: string } | null {
        if (config.source === "usesRemaining") {
            // 显示剩余使用次数
            let minRemaining = Infinity
            let hasUseLimit = false

            for (const ability of abilities) {
                const remaining = usageTracker.getRemainingUses(item, ability.key, ability)

                // 找到最严格的限制
                const limits = [remaining.perTurn, remaining.perBattle, remaining.perFloor, remaining.total]
                for (const limit of limits) {
                    if (limit !== undefined) {
                        hasUseLimit = true
                        minRemaining = Math.min(minRemaining, limit)
                    }
                }
            }

            if (!hasUseLimit) return null

            const remaining = minRemaining === Infinity ? 0 : minRemaining
            return {
                text: remaining,
                color: remaining > 0 ? "#22c55e" : "#ef4444"
            }
        }

        return null
    }

    /**
     * 计算冷却角标
     */
    private calculateCooldownBadge(
        item: Entity,
        abilities: ActiveAbility[],
        config: ActiveBadgeConfig
    ): { text: string | number, color: string } | null {
        if (config.source === "cooldownTurns") {
            let maxCooldown = 0

            for (const ability of abilities) {
                const cooldown = usageTracker.getCooldownRemaining(item, ability.key)
                maxCooldown = Math.max(maxCooldown, cooldown)
            }

            if (maxCooldown <= 0) return null

            return {
                text: maxCooldown,
                color: "#f59e0b"
            }
        }

        return null
    }

    /**
     * 计算能量角标
     */
    private calculateEnergyBadge(
        abilities: ActiveAbility[],
        config: ActiveBadgeConfig
    ): { text: string | number, color: string } | null {
        if (config.source === "energyCost") {
            let minCost = Infinity

            for (const ability of abilities) {
                const cost = ability.restrictions?.costs?.energy
                if (cost !== undefined) {
                    minCost = Math.min(minCost, cost)
                }
            }

            if (minCost === Infinity) return null

            return {
                text: minCost,
                color: "#3b82f6"
            }
        }

        return null
    }

    /**
     * 检查物品是否应该置灰
     */
    shouldDisable(
        item: Entity,
        owner: Entity,
        abilities: ActiveAbility[],
        displayConfig?: ActiveDisplayConfig
    ): boolean {
        // 自定义置灰检查
        if (displayConfig?.disabled) {
            return displayConfig.disabled(item, owner)
        }

        // 默认检查：如果所有能力都不可用，则置灰
        const usageState = usageTracker.getUsageState(item)

        for (const ability of abilities) {
            const checkResult = this.restrictionChecker.checkAbility(item, ability, owner, usageState)
            if (checkResult.canUse) {
                return false // 至少有一个能力可用
            }
        }

        return abilities.length > 0 // 有能力但都不可用时才置灰
    }

    /**
     * 获取高亮状态
     */
    getHighlight(
        item: Entity,
        owner: Entity,
        abilities: ActiveAbility[],
        displayConfig?: ActiveDisplayConfig
    ): string | null {
        // 自定义高亮检查
        if (displayConfig?.highlight) {
            return displayConfig.highlight(item, owner)
        }

        // 默认高亮逻辑
        const usageState = usageTracker.getUsageState(item)

        // 检查是否有开关型能力处于激活状态
        for (const ability of abilities) {
            if (ability.usage.type === "toggle") {
                const isActive = usageTracker.getToggleState(item, ability.key)
                if (isActive) {
                    return "#22c55e" // 绿色高亮表示激活
                }
            }
        }

        // 检查是否有能力可用且消耗较低（提示玩家可以使用）
        let hasLowCostAbility = false
        for (const ability of abilities) {
            const checkResult = this.restrictionChecker.checkAbility(item, ability, owner, usageState)
            if (checkResult.canUse) {
                const energyCost = ability.restrictions?.costs?.energy || 0
                if (energyCost <= 1) {
                    hasLowCostAbility = true
                    break
                }
            }
        }

        if (hasLowCostAbility) {
            return "#3b82f6" // 蓝色高亮表示有低消耗能力可用
        }

        return null
    }

    /**
     * 获取能力的可用性状态（用于UI显示）
     */
    getAbilityAvailability(
        item: Entity,
        ability: ActiveAbility,
        owner: Entity
    ): {
        canUse: boolean
        reason?: string
        cooldownRemaining?: number
        usesRemaining?: number
        chargesRemaining?: number
    } {
        const usageState = usageTracker.getUsageState(item)
        const checkResult = this.restrictionChecker.checkAbility(item, ability, owner, usageState)

        const result: any = {
            canUse: checkResult.canUse,
            reason: checkResult.reason
        }

        // 添加额外信息
        result.cooldownRemaining = usageTracker.getCooldownRemaining(item, ability.key)
        result.chargesRemaining = usageTracker.getCurrentCharges(item, ability.key)

        // 计算剩余使用次数
        const remaining = usageTracker.getRemainingUses(item, ability.key, ability)
        const limits = [remaining.perTurn, remaining.perBattle, remaining.perFloor, remaining.total]
        const validLimits = limits.filter(l => l !== undefined)
        if (validLimits.length > 0) {
            result.usesRemaining = Math.min(...validLimits)
        }

        return result
    }

    /**
     * 获取物品的完整显示状态
     */
    getDisplayState(
        item: Entity,
        owner: Entity,
        abilities: ActiveAbility[],
        displayConfig?: ActiveDisplayConfig
    ) {
        return {
            badges: this.calculateBadges(item, owner, abilities, displayConfig),
            disabled: this.shouldDisable(item, owner, abilities, displayConfig),
            highlight: this.getHighlight(item, owner, abilities, displayConfig),
            abilities: abilities.map(ability => ({
                key: ability.key,
                ...this.getAbilityAvailability(item, ability, owner)
            }))
        }
    }
}