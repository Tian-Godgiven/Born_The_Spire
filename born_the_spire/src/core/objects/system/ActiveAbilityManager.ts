import { Entity } from "@/core/objects/system/Entity"
import {
    ActiveAbility,
    ActiveTriggerConfig,
    AbilityMenuConfig,
    ActiveAbilityContext
} from "@/core/types/ActiveAbility"
import { RestrictionChecker } from "./RestrictionChecker"
import { usageTracker } from "./UsageTracker"
import { DisplayManager } from "./DisplayManager"
import { doEvent } from "./ActionEvent"
import { newError } from "@/ui/hooks/global/alert"
import { newLog } from "@/ui/hooks/global/log"
import { TargetType } from "@/static/list/registry/chooseTargetType"

/**
 * 主动能力管理器
 * 负责管理主动能力的触发、执行和状态管理
 */
export class ActiveAbilityManager {
    private restrictionChecker = new RestrictionChecker()
    private displayManager = new DisplayManager()

    /**
     * 处理右键点击
     */
    async handleRightClick(
        item: Entity,
        owner: Entity,
        abilities: ActiveAbility[],
        triggerConfig?: ActiveTriggerConfig,
        menuConfig?: AbilityMenuConfig
    ): Promise<void> {
        if (!triggerConfig?.rightClick) {
            console.log("[ActiveAbilityManager] 未配置右键行为")
            return
        }

        const rightClick = triggerConfig.rightClick

        switch (rightClick.type) {
            case "ability":
                // 直接执行能力
                if (rightClick.abilityKey) {
                    await this.executeAbilityByKey(item, owner, abilities, rightClick.abilityKey)
                } else {
                    newError(["右键配置错误：缺少 abilityKey"])
                }
                break

            case "menu":
                // 显示能力菜单
                if (menuConfig) {
                    await this.showAbilityMenu(item, owner, abilities, menuConfig)
                } else {
                    newError(["右键配置错误：缺少 abilityMenu 配置"])
                }
                break

            case "callback":
                // 执行自定义回调
                if (rightClick.callback) {
                    try {
                        await rightClick.callback(item, owner)
                    } catch (error) {
                        console.error("[ActiveAbilityManager] 右键回调执行失败:", error)
                        newError(["右键回调执行失败"])
                    }
                } else {
                    newError(["右键配置错误：缺少 callback"])
                }
                break

            default:
                newError(["未知的右键类型"])
        }
    }

    /**
     * 显示能力菜单
     */
    async showAbilityMenu(
        item: Entity,
        owner: Entity,
        abilities: ActiveAbility[],
        menuConfig: AbilityMenuConfig
    ): Promise<void> {
        // 这里需要调用UI组件显示菜单
        // 暂时使用动态导入避免循环依赖
        const { showAbilityMenuUI } = await import("@/ui/hooks/interaction/abilityMenu")

        await showAbilityMenuUI({
            item,
            owner,
            abilities,
            menuConfig,
            onSelectAbility: async (abilityKey: string) => {
                await this.executeAbilityByKey(item, owner, abilities, abilityKey)
            },
            onSelectCallback: async (callback: Function) => {
                try {
                    await callback(item, owner)
                } catch (error) {
                    console.error("[ActiveAbilityManager] 菜单回调执行失败:", error)
                    newError(["回调执行失败"])
                }
            }
        })
    }

    /**
     * 通过key执行能力
     */
    async executeAbilityByKey(
        item: Entity,
        owner: Entity,
        abilities: ActiveAbility[],
        abilityKey: string
    ): Promise<boolean> {
        const ability = abilities.find(a => a.key === abilityKey)
        if (!ability) {
            newError([`未找到能力: ${abilityKey}`])
            return false
        }

        return await this.executeAbility(item, owner, ability)
    }

    /**
     * 执行能力
     */
    async executeAbility(
        item: Entity,
        owner: Entity,
        ability: ActiveAbility,
        selectedTargets?: Entity[]
    ): Promise<boolean> {
        // 1. 检查能力是否可用
        const usageState = usageTracker.getUsageState(item)
        const checkResult = this.restrictionChecker.checkAbility(item, ability, owner, usageState)

        if (!checkResult.canUse) {
            newError([`无法使用 ${ability.label}:`, checkResult.reason || "未知原因"])
            return false
        }

        // 2. 根据使用方式处理
        switch (ability.usage.type) {
            case "direct":
                return await this.executeDirectAbility(item, owner, ability)

            case "selectTarget":
                return await this.executeTargetAbility(item, owner, ability, selectedTargets)

            case "toggle":
                return await this.executeToggleAbility(item, owner, ability)

            default:
                newError([`未知的使用方式: ${ability.usage.type}`])
                return false
        }
    }

    /**
     * 执行直接起效的能力
     */
    private async executeDirectAbility(
        item: Entity,
        owner: Entity,
        ability: ActiveAbility
    ): Promise<boolean> {
        // 应用消耗
        if (ability.restrictions) {
            const costApplied = this.restrictionChecker.applyCosts(ability.restrictions, owner)
            if (!costApplied) {
                newError(["应用消耗失败"])
                return false
            }
        }

        // 执行自定义逻辑或效果
        if (ability.onActivate) {
            try {
                await ability.onActivate(item, owner, { ability })
            } catch (error) {
                console.error("[ActiveAbilityManager] 自定义执行逻辑失败:", error)
                newError(["能力执行失败"])
                return false
            }
        } else {
            // 执行效果
            doEvent({
                key: "abilityActivate",
                source: owner,
                medium: item,
                target: owner,
                effectUnits: ability.effects
            })
        }

        // 记录使用
        this.recordAbilityUsage(item, owner, ability)

        newLog([`使用了 ${ability.label}`])
        return true
    }

    /**
     * 执行需要选择目标的能力
     */
    private async executeTargetAbility(
        item: Entity,
        owner: Entity,
        ability: ActiveAbility,
        selectedTargets?: Entity[]
    ): Promise<boolean> {
        // 如果没有提供目标，需要进入目标选择模式
        if (!selectedTargets || selectedTargets.length === 0) {
            // 调用目标选择UI
            const { chooseTarget } = await import("@/ui/interaction/target/chooseTarget")

            const targets = await chooseTarget({
                targetType: { faction: ability.usage.targetType || "enemy" } as TargetType,
                amount: 1,
                title: `选择 ${ability.label} 的目标`
            })

            if (!targets || targets.length === 0) {
                // 用户取消选择
                return false
            }

            selectedTargets = targets
        }

        // 应用消耗
        if (ability.restrictions) {
            const costApplied = this.restrictionChecker.applyCosts(ability.restrictions, owner)
            if (!costApplied) {
                newError(["应用消耗失败"])
                return false
            }
        }

        // 执行自定义逻辑或效果
        if (ability.onActivate) {
            try {
                await ability.onActivate(item, owner, { ability, selectedTargets })
            } catch (error) {
                console.error("[ActiveAbilityManager] 自定义执行逻辑失败:", error)
                newError(["能力执行失败"])
                return false
            }
        } else {
            // 对每个目标执行效果
            for (const target of selectedTargets!) {
                doEvent({
                    key: "abilityActivate",
                    source: owner,
                    medium: item,
                    target: target,
                    effectUnits: ability.effects
                })
            }
        }

        // 记录使用
        this.recordAbilityUsage(item, owner, ability)

        newLog([`对 ${selectedTargets!.map(t => t.label).join(", ")} 使用了 ${ability.label}`])
        return true
    }

    /**
     * 执行开关切换能力
     */
    private async executeToggleAbility(
        item: Entity,
        owner: Entity,
        ability: ActiveAbility
    ): Promise<boolean> {
        const currentState = usageTracker.getToggleState(item, ability.key)
        const newState = !currentState

        // 应用消耗（只在激活时消耗）
        if (newState && ability.restrictions) {
            const costApplied = this.restrictionChecker.applyCosts(ability.restrictions, owner)
            if (!costApplied) {
                newError(["应用消耗失败"])
                return false
            }
        }

        // 更新开关状态
        usageTracker.setToggleState(item, ability.key, newState)

        // 执行自定义逻辑或效果
        if (ability.onActivate) {
            try {
                await ability.onActivate(item, owner, { ability, toggleState: newState })
            } catch (error) {
                console.error("[ActiveAbilityManager] 自定义执行逻辑失败:", error)
                newError(["能力执行失败"])
                return false
            }
        } else {
            // 执行效果
            doEvent({
                key: newState ? "abilityActivate" : "abilityDeactivate",
                source: owner,
                medium: item,
                target: owner,
                effectUnits: ability.effects,
                info: { toggleState: newState }
            })
        }

        // 只在激活时记录使用
        if (newState) {
            this.recordAbilityUsage(item, owner, ability)
        }

        newLog([`${newState ? "激活" : "关闭"}了 ${ability.label}`])
        return true
    }

    /**
     * 记录能力使用
     */
    private recordAbilityUsage(item: Entity, owner: Entity, ability: ActiveAbility): void {
        // 记录次数使用
        usageTracker.recordUsage(item, ability.key, ability)

        // 应用冷却
        if (ability.restrictions?.cooldown) {
            usageTracker.applyCooldown(item, ability.key, ability.restrictions.cooldown)
        }

        // 消耗充能
        if (ability.restrictions?.charges) {
            usageTracker.consumeCharges(item, ability.key, ability.restrictions.charges.required)
        }
    }

    /**
     * 获取显示管理器
     */
    getDisplayManager(): DisplayManager {
        return this.displayManager
    }

    /**
     * 获取限制检查器
     */
    getRestrictionChecker(): RestrictionChecker {
        return this.restrictionChecker
    }
}

// 全局主动能力管理器实例
export const activeAbilityManager = new ActiveAbilityManager()