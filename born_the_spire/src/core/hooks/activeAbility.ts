import { Entity } from "@/core/objects/system/Entity"
import {
    ActiveAbility,
    ActiveTriggerConfig,
    AbilityMenuConfig,
    ActiveDisplayConfig
} from "@/core/types/ActiveAbility"
import { activeAbilityManager } from "@/core/objects/system/ActiveAbilityManager"
import { activeAbilityLifecycleManager } from "@/core/objects/system/ActiveAbilityLifecycleManager"
import { usageTracker } from "@/core/objects/system/UsageTracker"

/**
 * 主动能力系统便捷hooks
 * 为mod制作者和内部开发提供高级API
 */

/**
 * 处理物品的右键点击
 */
export async function handleItemRightClick(
    item: Entity,
    owner: Entity,
    abilities: ActiveAbility[],
    triggerConfig?: ActiveTriggerConfig,
    menuConfig?: AbilityMenuConfig
): Promise<void> {
    await activeAbilityManager.handleRightClick(item, owner, abilities, triggerConfig, menuConfig)
}

/**
 * 执行指定的能力
 */
export async function executeAbility(
    item: Entity,
    owner: Entity,
    ability: ActiveAbility,
    selectedTargets?: Entity[]
): Promise<boolean> {
    return await activeAbilityManager.executeAbility(item, owner, ability, selectedTargets)
}

/**
 * 通过key执行能力
 */
export async function executeAbilityByKey(
    item: Entity,
    owner: Entity,
    abilities: ActiveAbility[],
    abilityKey: string
): Promise<boolean> {
    return await activeAbilityManager.executeAbilityByKey(item, owner, abilities, abilityKey)
}

/**
 * 检查能力是否可用
 */
export function checkAbilityUsability(
    item: Entity,
    ability: ActiveAbility,
    owner: Entity
) {
    const displayManager = activeAbilityManager.getDisplayManager()
    return displayManager.getAbilityAvailability(item, ability, owner)
}

/**
 * 获取物品的显示状态
 */
export function getItemDisplayState(
    item: Entity,
    owner: Entity,
    abilities: ActiveAbility[],
    displayConfig?: ActiveDisplayConfig
) {
    const displayManager = activeAbilityManager.getDisplayManager()
    return displayManager.getDisplayState(item, owner, abilities, displayConfig)
}

/**
 * 获取能力的剩余使用次数
 */
export function getRemainingUses(
    item: Entity,
    abilityKey: string,
    ability: ActiveAbility
) {
    return usageTracker.getRemainingUses(item, abilityKey, ability)
}

/**
 * 获取能力的冷却剩余时间
 */
export function getCooldownRemaining(item: Entity, abilityKey: string): number {
    return usageTracker.getCooldownRemaining(item, abilityKey)
}

/**
 * 获取能力的当前充能数
 */
export function getCurrentCharges(item: Entity, abilityKey: string): number {
    return usageTracker.getCurrentCharges(item, abilityKey)
}

/**
 * 获取开关型能力的状态
 */
export function getToggleState(item: Entity, abilityKey: string): boolean {
    return usageTracker.getToggleState(item, abilityKey)
}

/**
 * 手动设置开关状态
 */
export function setToggleState(item: Entity, abilityKey: string, active: boolean): void {
    usageTracker.setToggleState(item, abilityKey, active)
}

/**
 * 手动添加充能
 */
export function addCharges(item: Entity, abilityKey: string, amount: number): void {
    usageTracker.addCharges(item, abilityKey, amount)
}

/**
 * 手动减少冷却时间
 */
export function reduceCooldown(item: Entity, abilityKey: string, amount: number = 1): void {
    const usageState = usageTracker.getUsageState(item)
    const current = usageState.cooldowns[abilityKey] || 0
    usageState.cooldowns[abilityKey] = Math.max(0, current - amount)
}

/**
 * 重置能力的使用次数
 */
export function resetAbilityUses(
    item: Entity,
    abilityKey: string,
    type: "turn" | "battle" | "floor" | "total"
): void {
    const usageState = usageTracker.getUsageState(item)

    switch (type) {
        case "turn":
            delete usageState.usesThisTurn[abilityKey]
            break
        case "battle":
            delete usageState.usesThisBattle[abilityKey]
            break
        case "floor":
            delete usageState.usesThisFloor[abilityKey]
            break
        case "total":
            delete usageState.usesTotal[abilityKey]
            break
    }
}

// 生命周期事件hooks

/**
 * 处理实体的回合开始
 */
export function handleTurnStart(entity: Entity, abilities: ActiveAbility[]): void {
    activeAbilityLifecycleManager.onTurnStart(entity, abilities)
}

/**
 * 处理实体的回合结束
 */
export function handleTurnEnd(entity: Entity, abilities: ActiveAbility[]): void {
    activeAbilityLifecycleManager.onTurnEnd(entity, abilities)
}

/**
 * 处理实体的战斗开始
 */
export function handleBattleStart(entity: Entity, abilities: ActiveAbility[]): void {
    activeAbilityLifecycleManager.onBattleStart(entity, abilities)
}

/**
 * 处理实体的战斗结束
 */
export function handleBattleEnd(entity: Entity, abilities: ActiveAbility[]): void {
    activeAbilityLifecycleManager.onBattleEnd(entity, abilities)
}

/**
 * 处理实体的层级开始
 */
export function handleFloorStart(entity: Entity, abilities: ActiveAbility[]): void {
    activeAbilityLifecycleManager.onFloorStart(entity, abilities)
}

/**
 * 处理实体的层级结束
 */
export function handleFloorEnd(entity: Entity, abilities: ActiveAbility[]): void {
    activeAbilityLifecycleManager.onFloorEnd(entity, abilities)
}

/**
 * 处理卡牌使用（用于充能获取）
 */
export function handleCardPlayed(entity: Entity, abilities: ActiveAbility[]): void {
    activeAbilityLifecycleManager.onCardPlayed(entity, abilities)
}

/**
 * 处理受到伤害（用于充能获取）
 */
export function handleDamageTaken(entity: Entity, abilities: ActiveAbility[], damage: number): void {
    activeAbilityLifecycleManager.onDamageTaken(entity, abilities, damage)
}

/**
 * 清理实体的主动能力状态
 */
export function cleanupEntityAbilities(entity: Entity): void {
    activeAbilityLifecycleManager.onEntityRemoved(entity)
}

/**
 * 重置游戏的主动能力系统
 */
export function resetActiveAbilitySystem(): void {
    activeAbilityLifecycleManager.onGameReset()
}

// 调试和开发工具

/**
 * 获取实体的完整使用状态（调试用）
 */
export function getEntityUsageState(entity: Entity) {
    return usageTracker.getUsageState(entity)
}

/**
 * 获取所有实体的使用状态（调试用）
 */
export function getAllUsageStates() {
    return usageTracker.getAllUsageStates()
}

/**
 * 强制触发能力（调试用，跳过所有限制）
 */
export async function forceExecuteAbility(
    item: Entity,
    owner: Entity,
    ability: ActiveAbility,
    selectedTargets?: Entity[]
): Promise<void> {
    console.warn("[ActiveAbilityHooks] 强制执行能力（调试模式）:", ability.label)

    // 直接执行效果，跳过所有检查
    const { doEvent } = await import("@/core/objects/system/ActionEvent")

    if (ability.onActivate) {
        await ability.onActivate(item, owner, { ability, selectedTargets })
    } else {
        const targets = selectedTargets || [owner]
        for (const target of targets) {
            doEvent({
                key: "abilityActivate",
                source: owner,
                medium: item,
                target: target,
                effectUnits: ability.effects
            })
        }
    }
}