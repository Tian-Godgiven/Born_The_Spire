import { Entity } from "@/core/objects/system/Entity"
import type { ActiveAbility } from "@/core/types/ActiveAbility"
import { usageTracker } from "./UsageTracker"

/**
 * 主动能力生命周期管理器
 * 负责处理回合开始/结束、战斗开始/结束等事件对主动能力系统的影响
 */
export class ActiveAbilityLifecycleManager {

    /**
     * 回合开始时的处理
     */
    onTurnStart(entity: Entity, abilities: ActiveAbility[]): void {
        // 重置每回合使用次数
        usageTracker.resetTurnUses(entity)

        // 减少冷却时间
        usageTracker.reduceCooldowns(entity, 1)

        // 触发回合开始的充能获取
        usageTracker.triggerChargeGain(entity, "turnStart", abilities)

        console.log(`[ActiveAbilityLifecycle] ${entity.label} 回合开始处理完成`)
    }

    /**
     * 回合结束时的处理
     */
    onTurnEnd(entity: Entity, abilities: ActiveAbility[]): void {
        // 触发回合结束的充能获取
        usageTracker.triggerChargeGain(entity, "turnEnd", abilities)

        console.log(`[ActiveAbilityLifecycle] ${entity.label} 回合结束处理完成`)
    }

    /**
     * 战斗开始时的处理
     */
    onBattleStart(entity: Entity, abilities: ActiveAbility[]): void {
        // 重置每战斗使用次数
        usageTracker.resetBattleUses(entity)

        // 触发战斗开始的充能获取
        usageTracker.triggerChargeGain(entity, "battleStart", abilities)

        console.log(`[ActiveAbilityLifecycle] ${entity.label} 战斗开始处理完成`)
    }

    /**
     * 战斗结束时的处理
     */
    onBattleEnd(entity: Entity, abilities: ActiveAbility[]): void {
        // 清理战斗相关的开关状态（可选）
        this.clearBattleToggleStates(entity, abilities)

        // 触发战斗结束的充能获取
        usageTracker.triggerChargeGain(entity, "battleEnd", abilities)

        console.log(`[ActiveAbilityLifecycle] ${entity.label} 战斗结束处理完成`)
    }

    /**
     * 层级开始时的处理
     */
    onFloorStart(entity: Entity, abilities: ActiveAbility[]): void {
        // 重置每层级使用次数
        usageTracker.resetFloorUses(entity)

        // 触发层级开始的充能获取
        usageTracker.triggerChargeGain(entity, "floorStart", abilities)

        console.log(`[ActiveAbilityLifecycle] ${entity.label} 层级开始处理完成`)
    }

    /**
     * 层级结束时的处理
     */
    onFloorEnd(entity: Entity, abilities: ActiveAbility[]): void {
        // 触发层级结束的充能获取
        usageTracker.triggerChargeGain(entity, "floorEnd", abilities)

        console.log(`[ActiveAbilityLifecycle] ${entity.label} 层级结束处理完成`)
    }

    /**
     * 卡牌使用时的处理（用于充能获取）
     */
    onCardPlayed(entity: Entity, abilities: ActiveAbility[]): void {
        usageTracker.triggerChargeGain(entity, "cardPlayed", abilities)
    }

    /**
     * 受到伤害时的处理（用于充能获取）
     */
    onDamageTaken(entity: Entity, abilities: ActiveAbility[], damage: number): void {
        usageTracker.triggerChargeGain(entity, "damageTaken", abilities)
    }

    /**
     * 清理战斗相关的开关状态
     */
    private clearBattleToggleStates(entity: Entity, abilities: ActiveAbility[]): void {
        for (const ability of abilities) {
            if (ability.usage.type === "toggle") {
                // 检查是否需要在战斗结束时自动关闭
                const shouldClearOnBattleEnd = ability.restrictions?.conditions?.scene === "combat"
                if (shouldClearOnBattleEnd) {
                    usageTracker.setToggleState(entity, ability.key, false)
                }
            }
        }
    }

    /**
     * 实体被移除时的清理
     */
    onEntityRemoved(entity: Entity): void {
        usageTracker.clearUsageState(entity)
        console.log(`[ActiveAbilityLifecycle] 清理了 ${entity.label} 的使用状态`)
    }

    /**
     * 游戏重新开始时的全局清理
     */
    onGameReset(): void {
        usageTracker.resetAll()
        console.log(`[ActiveAbilityLifecycle] 重置了所有使用状态`)
    }
}

// 全局生命周期管理器实例
export const activeAbilityLifecycleManager = new ActiveAbilityLifecycleManager()