import { Entity } from "@/core/objects/system/Entity"
import { AbilityUsageState, ActiveAbility } from "@/core/types/ActiveAbility"

/**
 * 使用状态追踪器
 * 负责追踪主动能力的使用状态，包括次数、冷却、充能等
 */
export class UsageTracker {
    private usageStates = new Map<Entity, AbilityUsageState>()

    /**
     * 获取实体的使用状态
     */
    getUsageState(entity: Entity): AbilityUsageState {
        if (!this.usageStates.has(entity)) {
            this.usageStates.set(entity, {
                usesThisTurn: {},
                usesThisBattle: {},
                usesThisFloor: {},
                usesTotal: {},
                cooldowns: {},
                charges: {},
                toggleStates: {}
            })
        }
        return this.usageStates.get(entity)!
    }

    /**
     * 记录能力使用
     */
    recordUsage(item: Entity, abilityKey: string, ability: ActiveAbility): void {
        const usageState = this.getUsageState(item)
        const restrictions = ability.restrictions

        if (!restrictions?.uses) return

        // 记录各种次数使用
        if (restrictions.uses.perTurn !== undefined) {
            usageState.usesThisTurn[abilityKey] = (usageState.usesThisTurn[abilityKey] || 0) + 1
        }

        if (restrictions.uses.perBattle !== undefined) {
            usageState.usesThisBattle[abilityKey] = (usageState.usesThisBattle[abilityKey] || 0) + 1
        }

        if (restrictions.uses.perFloor !== undefined) {
            usageState.usesThisFloor[abilityKey] = (usageState.usesThisFloor[abilityKey] || 0) + 1
        }

        if (restrictions.uses.total !== undefined) {
            usageState.usesTotal[abilityKey] = (usageState.usesTotal[abilityKey] || 0) + 1
        }
    }

    /**
     * 应用冷却
     */
    applyCooldown(item: Entity, abilityKey: string, turns: number): void {
        const usageState = this.getUsageState(item)
        usageState.cooldowns[abilityKey] = turns
    }

    /**
     * 消耗充能
     */
    consumeCharges(item: Entity, abilityKey: string, amount: number): void {
        const usageState = this.getUsageState(item)
        const current = usageState.charges[abilityKey] || 0
        usageState.charges[abilityKey] = Math.max(0, current - amount)
    }

    /**
     * 增加充能
     */
    addCharges(item: Entity, abilityKey: string, amount: number): void {
        const usageState = this.getUsageState(item)
        usageState.charges[abilityKey] = (usageState.charges[abilityKey] || 0) + amount
    }

    /**
     * 设置开关状态
     */
    setToggleState(item: Entity, abilityKey: string, active: boolean): void {
        const usageState = this.getUsageState(item)
        usageState.toggleStates[abilityKey] = active
    }

    /**
     * 获取开关状态
     */
    getToggleState(item: Entity, abilityKey: string): boolean {
        const usageState = this.getUsageState(item)
        return usageState.toggleStates[abilityKey] || false
    }

    /**
     * 获取剩余使用次数
     */
    getRemainingUses(item: Entity, abilityKey: string, ability: ActiveAbility): {
        perTurn?: number
        perBattle?: number
        perFloor?: number
        total?: number
    } {
        const usageState = this.getUsageState(item)
        const restrictions = ability.restrictions?.uses
        if (!restrictions) return {}

        const result: any = {}

        if (restrictions.perTurn !== undefined) {
            const used = usageState.usesThisTurn[abilityKey] || 0
            result.perTurn = Math.max(0, restrictions.perTurn - used)
        }

        if (restrictions.perBattle !== undefined) {
            const used = usageState.usesThisBattle[abilityKey] || 0
            result.perBattle = Math.max(0, restrictions.perBattle - used)
        }

        if (restrictions.perFloor !== undefined) {
            const used = usageState.usesThisFloor[abilityKey] || 0
            result.perFloor = Math.max(0, restrictions.perFloor - used)
        }

        if (restrictions.total !== undefined) {
            const used = usageState.usesTotal[abilityKey] || 0
            result.total = Math.max(0, restrictions.total - used)
        }

        return result
    }

    /**
     * 获取冷却剩余回合数
     */
    getCooldownRemaining(item: Entity, abilityKey: string): number {
        const usageState = this.getUsageState(item)
        return usageState.cooldowns[abilityKey] || 0
    }

    /**
     * 获取当前充能数
     */
    getCurrentCharges(item: Entity, abilityKey: string): number {
        const usageState = this.getUsageState(item)
        return usageState.charges[abilityKey] || 0
    }

    /**
     * 重置回合使用次数
     */
    resetTurnUses(entity: Entity): void {
        const usageState = this.getUsageState(entity)
        usageState.usesThisTurn = {}
    }

    /**
     * 重置战斗使用次数
     */
    resetBattleUses(entity: Entity): void {
        const usageState = this.getUsageState(entity)
        usageState.usesThisBattle = {}
    }

    /**
     * 重置层级使用次数
     */
    resetFloorUses(entity: Entity): void {
        const usageState = this.getUsageState(entity)
        usageState.usesThisFloor = {}
    }

    /**
     * 减少冷却时间
     */
    reduceCooldowns(entity: Entity, amount: number = 1): void {
        const usageState = this.getUsageState(entity)

        for (const abilityKey in usageState.cooldowns) {
            if (usageState.cooldowns[abilityKey] > 0) {
                usageState.cooldowns[abilityKey] = Math.max(0, usageState.cooldowns[abilityKey] - amount)
            }
        }
    }

    /**
     * 触发充能获取
     */
    triggerChargeGain(entity: Entity, trigger: string, abilities: ActiveAbility[]): void {
        const usageState = this.getUsageState(entity)

        for (const ability of abilities) {
            const charges = ability.restrictions?.charges
            if (charges && charges.gainOn === trigger) {
                usageState.charges[ability.key] = (usageState.charges[ability.key] || 0) + 1
            }
        }
    }

    /**
     * 清理实体的使用状态
     */
    clearUsageState(entity: Entity): void {
        this.usageStates.delete(entity)
    }

    /**
     * 获取所有实体的使用状态（调试用）
     */
    getAllUsageStates(): Map<Entity, AbilityUsageState> {
        return new Map(this.usageStates)
    }

    /**
     * 重置所有状态（新游戏开始时）
     */
    resetAll(): void {
        this.usageStates.clear()
    }
}

// 全局使用追踪器实例
export const usageTracker = new UsageTracker()