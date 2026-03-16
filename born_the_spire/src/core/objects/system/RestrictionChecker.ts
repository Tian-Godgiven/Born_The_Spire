import type { Entity } from "@/core/objects/system/Entity"
import type { Player } from "@/core/objects/target/Player"
import type {
    ActiveAbility,
    ActiveAbilityRestrictions,
    AbilityCheckResult,
    AbilityUsageState
} from "@/core/types/ActiveAbility"
import { getStatusValue } from "@/core/objects/system/status/Status"
import { nowGameRun } from "@/core/objects/game/run"

/**
 * 限制检查器
 * 负责检查主动能力的各种使用限制
 */
export class RestrictionChecker {

    /**
     * 检查能力是否可以使用
     */
    checkAbility(
        item: Entity,
        ability: ActiveAbility,
        owner: Entity,
        usageState: AbilityUsageState
    ): AbilityCheckResult {
        const restrictions = ability.restrictions
        if (!restrictions) {
            return { canUse: true }
        }

        // 按优先级检查各种限制

        // 1. 条件限制（最快失败）
        const conditionResult = this.checkConditions(restrictions, owner)
        if (!conditionResult.canUse) {
            return conditionResult
        }

        // 2. 次数限制
        const usesResult = this.checkUses(restrictions, ability.key, usageState)
        if (!usesResult.canUse) {
            return usesResult
        }

        // 3. 冷却限制
        const cooldownResult = this.checkCooldown(restrictions, ability.key, usageState)
        if (!cooldownResult.canUse) {
            return cooldownResult
        }

        // 4. 充能限制
        const chargesResult = this.checkCharges(restrictions, ability.key, usageState)
        if (!chargesResult.canUse) {
            return chargesResult
        }

        // 5. 消耗限制（最后检查，避免误扣资源）
        const costsResult = this.checkCosts(restrictions, owner)
        if (!costsResult.canUse) {
            return costsResult
        }

        // 6. 自定义检查
        const customResult = this.checkCustom(restrictions, item, owner)
        if (!customResult.canUse) {
            return customResult
        }

        return { canUse: true }
    }

    /**
     * 检查条件限制
     */
    private checkConditions(
        restrictions: ActiveAbilityRestrictions,
        owner: Entity
    ): AbilityCheckResult {
        const conditions = restrictions.conditions
        if (!conditions) return { canUse: true }

        // 生命值条件
        if (conditions.healthBelow !== undefined || conditions.healthAbove !== undefined) {
            const currentHealth = owner.current?.health?.value || 0
            const maxHealth = getStatusValue(owner, "maxHealth")
            const healthPercent = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0

            if (conditions.healthBelow !== undefined && healthPercent >= conditions.healthBelow) {
                return { canUse: false, reason: `需要生命值低于${conditions.healthBelow}%` }
            }

            if (conditions.healthAbove !== undefined && healthPercent <= conditions.healthAbove) {
                return { canUse: false, reason: `需要生命值高于${conditions.healthAbove}%` }
            }
        }

        // 手牌数量条件
        if ('targetType' in owner && owner.targetType === 'player') {
            const player = owner as Player
            const handSize = player.cardPiles.handPile.length

            if (conditions.minHandSize !== undefined && handSize < conditions.minHandSize) {
                return { canUse: false, reason: `需要至少${conditions.minHandSize}张手牌` }
            }

            if (conditions.maxHandSize !== undefined && handSize > conditions.maxHandSize) {
                return { canUse: false, reason: `手牌不能超过${conditions.maxHandSize}张` }
            }
        }

        // 状态条件
        if (conditions.hasStatus && !owner.status[conditions.hasStatus]) {
            return { canUse: false, reason: `需要拥有${conditions.hasStatus}状态` }
        }

        if (conditions.notHasStatus && owner.status[conditions.notHasStatus]) {
            return { canUse: false, reason: `不能拥有${conditions.notHasStatus}状态` }
        }

        // 场景条件
        if (conditions.scene) {
            const inCombat = nowGameRun?.currentRoom?.type === 'battle'

            if (conditions.scene === 'combat' && !inCombat) {
                return { canUse: false, reason: "只能在战斗中使用" }
            }

            if (conditions.scene === 'nonCombat' && inCombat) {
                return { canUse: false, reason: "不能在战斗中使用" }
            }
        }

        return { canUse: true }
    }

    /**
     * 检查次数限制
     */
    private checkUses(
        restrictions: ActiveAbilityRestrictions,
        abilityKey: string,
        usageState: AbilityUsageState
    ): AbilityCheckResult {
        const uses = restrictions.uses
        if (!uses) return { canUse: true }

        // 检查每回合次数
        if (uses.perTurn !== undefined) {
            const usedThisTurn = usageState.usesThisTurn[abilityKey] || 0
            if (usedThisTurn >= uses.perTurn) {
                return { canUse: false, reason: `每回合只能使用${uses.perTurn}次` }
            }
        }

        // 检查每战斗次数
        if (uses.perBattle !== undefined) {
            const usedThisBattle = usageState.usesThisBattle[abilityKey] || 0
            if (usedThisBattle >= uses.perBattle) {
                return { canUse: false, reason: `每战斗只能使用${uses.perBattle}次` }
            }
        }

        // 检查每层级次数
        if (uses.perFloor !== undefined) {
            const usedThisFloor = usageState.usesThisFloor[abilityKey] || 0
            if (usedThisFloor >= uses.perFloor) {
                return { canUse: false, reason: `每层级只能使用${uses.perFloor}次` }
            }
        }

        // 检查总次数
        if (uses.total !== undefined) {
            const usedTotal = usageState.usesTotal[abilityKey] || 0
            if (usedTotal >= uses.total) {
                return { canUse: false, reason: `总共只能使用${uses.total}次` }
            }
        }

        return { canUse: true }
    }

    /**
     * 检查冷却限制
     */
    private checkCooldown(
        restrictions: ActiveAbilityRestrictions,
        abilityKey: string,
        usageState: AbilityUsageState
    ): AbilityCheckResult {
        if (restrictions.cooldown === undefined) return { canUse: true }

        const cooldownRemaining = usageState.cooldowns[abilityKey] || 0
        if (cooldownRemaining > 0) {
            return {
                canUse: false,
                reason: `冷却中，还需${cooldownRemaining}回合`
            }
        }

        return { canUse: true }
    }

    /**
     * 检查充能限制
     */
    private checkCharges(
        restrictions: ActiveAbilityRestrictions,
        abilityKey: string,
        usageState: AbilityUsageState
    ): AbilityCheckResult {
        const charges = restrictions.charges
        if (!charges) return { canUse: true }

        const currentCharges = usageState.charges[abilityKey] || 0
        if (currentCharges < charges.required) {
            return {
                canUse: false,
                reason: `需要${charges.required}点充能，当前${currentCharges}点`
            }
        }

        return { canUse: true }
    }

    /**
     * 检查消耗限制
     */
    private checkCosts(
        restrictions: ActiveAbilityRestrictions,
        owner: Entity
    ): AbilityCheckResult {
        const costs = restrictions.costs
        if (!costs) return { canUse: true }

        const missingResources: any = {}
        let hasMissing = false

        // 检查能量消耗
        if (costs.energy !== undefined) {
            const currentEnergy = owner.current?.energy?.value || 0
            if (currentEnergy < costs.energy) {
                missingResources.energy = costs.energy - currentEnergy
                hasMissing = true
            }
        }

        // 检查生命消耗
        if (costs.health !== undefined) {
            const currentHealth = owner.current?.health?.value || 0
            if (currentHealth < costs.health) {
                missingResources.health = costs.health - currentHealth
                hasMissing = true
            }
        }

        // 检查材料消耗
        if (costs.material !== undefined) {
            const currentMaterial = getStatusValue(owner, "material")
            if (currentMaterial < costs.material) {
                missingResources.material = costs.material - currentMaterial
                hasMissing = true
            }
        }

        if (hasMissing) {
            const reasons = []
            if (missingResources.energy) reasons.push(`能量不足${missingResources.energy}`)
            if (missingResources.health) reasons.push(`生命不足${missingResources.health}`)
            if (missingResources.material) reasons.push(`材料不足${missingResources.material}`)

            return {
                canUse: false,
                reason: reasons.join(", "),
                missingResources
            }
        }

        return { canUse: true }
    }

    /**
     * 检查自定义限制
     */
    private checkCustom(
        restrictions: ActiveAbilityRestrictions,
        item: Entity,
        owner: Entity
    ): AbilityCheckResult {
        if (!restrictions.customCheck) return { canUse: true }

        try {
            const result = restrictions.customCheck(item, owner, {})
            if (typeof result === 'boolean') {
                return { canUse: result, reason: result ? undefined : "自定义条件不满足" }
            } else {
                return { canUse: false, reason: result }
            }
        } catch (error) {
            console.error("[RestrictionChecker] 自定义检查函数出错:", error)
            return { canUse: false, reason: "检查出错" }
        }
    }

    /**
     * 应用消耗
     */
    applyCosts(restrictions: ActiveAbilityRestrictions, owner: Entity): boolean {
        const costs = restrictions.costs
        if (!costs) return true

        try {
            // 扣除能量
            if (costs.energy !== undefined && owner.current?.energy) {
                owner.current.energy.value -= costs.energy
            }

            // 扣除生命
            if (costs.health !== undefined && owner.current?.health) {
                owner.current.health.value -= costs.health
            }

            // 扣除材料
            if (costs.material !== undefined) {
                const currentMaterial = getStatusValue(owner, "material")
                // 这里需要实际的材料扣除逻辑
                // 暂时跳过，因为需要具体的材料系统实现
            }

            return true
        } catch (error) {
            console.error("[RestrictionChecker] 应用消耗失败:", error)
            return false
        }
    }
}