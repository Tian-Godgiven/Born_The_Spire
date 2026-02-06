/**
 * 游戏机制注册表
 * 管理所有游戏机制的注册、启用、禁用
 */

import { MechanismConfig } from "@/core/types/MechanismConfig"
import { Entity } from "@/core/objects/system/Entity"
import { getMechanismManager } from "@/core/objects/system/mechanism/MechanismManager"
import { Current } from "@/core/objects/system/Current/current"
import { Status, appendStatus } from "@/core/objects/system/status/Status"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 机制投票
 */
export interface MechanismVote {
    source: any                        // 投票来源（遗物、buff、debuff等）
    priority: number                   // 优先级
    vote: "enable" | "disable"         // 投票：启用或禁用
}

/**
 * Trigger 移除器
 */
export interface TriggerRemover {
    remove: () => void
}

/**
 * 全局机制配置表
 */
const mechanismConfigMap = new Map<string, MechanismConfig>()

/**
 * 注册游戏机制
 */
export function registerMechanism(config: MechanismConfig): void {
    if (mechanismConfigMap.has(config.key)) {
        console.warn(`[MechanismRegistry] 机制已存在: ${config.key}，将被覆盖`)
    }
    mechanismConfigMap.set(config.key, config)
    console.log(`[MechanismRegistry] 注册机制: ${config.key} - ${config.label}`)
}

/**
 * 获取机制配置
 */
export function getMechanismConfig(key: string): MechanismConfig | undefined {
    return mechanismConfigMap.get(key)
}

/**
 * 获取所有机制配置
 */
export function getAllMechanisms(): MechanismConfig[] {
    return Array.from(mechanismConfigMap.values())
}

/**
 * 为实体投票启用/禁用机制
 * @returns 移除投票的函数
 */
export function voteMechanismForEntity(
    entity: Entity,
    mechanismKey: string,
    vote: "enable" | "disable",
    source: any,
    priority: number = 0
): () => void {
    const config = getMechanismConfig(mechanismKey)
    if (!config) {
        throw new Error(`[MechanismRegistry] 未找到机制: ${mechanismKey}`)
    }

    // 获取机制管理器
    const manager = getMechanismManager(entity)

    // 添加投票
    manager.addVote(mechanismKey, { source, priority, vote })

    // 重新计算并应用机制状态
    updateMechanismState(entity, mechanismKey, config)

    // 返回移除函数
    return () => {
        removeVoteForEntity(entity, mechanismKey, source)
    }
}

/**
 * 移除实体的机制投票
 */
export function removeVoteForEntity(
    entity: Entity,
    mechanismKey: string,
    source: any
): void {
    const manager = getMechanismManager(entity)

    // 移除投票
    const removed = manager.removeVote(mechanismKey, source)
    if (!removed) {
        console.warn(`[MechanismRegistry] 未找到投票来源: ${mechanismKey}`)
        return
    }

    // 重新计算并应用机制状态
    const config = getMechanismConfig(mechanismKey)
    if (config) {
        updateMechanismState(entity, mechanismKey, config)
    }
}

/**
 * 计算并应用机制的最终状态
 */
function updateMechanismState(
    entity: Entity,
    mechanismKey: string,
    config: MechanismConfig
): void {
    const manager = getMechanismManager(entity)
    const finalVote = manager.getFinalVote(mechanismKey)

    // 如果没有投票，禁用机制
    if (finalVote === null) {
        disableMechanism(entity, mechanismKey)
        return
    }

    // 获取当前状态
    const currentState = manager.getState(mechanismKey)
    const shouldEnable = finalVote === "enable"

    // 如果状态没有变化，不做任何操作
    if (currentState === shouldEnable) {
        return
    }

    // 应用新状态
    if (shouldEnable) {
        enableMechanism(entity, mechanismKey, config)
    } else {
        disableMechanism(entity, mechanismKey)
    }
}

/**
 * 启用机制（内部函数）
 */
function enableMechanism(
    entity: Entity,
    mechanismKey: string,
    config: MechanismConfig
): void {
    console.log(`[enableMechanism] 开始启用机制: ${mechanismKey} for ${entity.label}`)
    const manager = getMechanismManager(entity)

    // 标记为已启用
    manager.setState(mechanismKey, true)
    console.log(`[enableMechanism] 状态已标记为启用`)

    // 1. 创建数据存储
    console.log(`[enableMechanism] 准备调用 createMechanismData`)
    createMechanismData(entity, config)
    console.log(`[enableMechanism] createMechanismData 调用完成`)

    // 2. 生成并添加 Triggers
    console.log(`[enableMechanism] 准备生成触发器`)
    const triggers = generateTriggersForMechanism(entity, config)
    manager.addTriggers(mechanismKey, triggers)
    console.log(`[enableMechanism] 触发器已添加，数量: ${triggers.length}`)

    console.log(`[MechanismRegistry] 启用机制: ${mechanismKey} for ${entity.label}`)
}

/**
 * 禁用机制（内部函数）
 */
function disableMechanism(
    entity: Entity,
    mechanismKey: string
): void {
    const manager = getMechanismManager(entity)

    // 标记为已禁用
    manager.setState(mechanismKey, false)

    // 移除所有 Triggers
    manager.removeTriggers(mechanismKey)

    console.log(`[MechanismRegistry] 禁用机制: ${mechanismKey} for ${entity.label}`)
}

/**
 * 创建机制的数据存储
 */
function createMechanismData(entity: Entity, config: MechanismConfig): void {
    const { location, key, defaultValue } = config.data
    const storageKey = key || config.key

    console.log(`[createMechanismData] ${entity.label} - ${storageKey}, location: ${location}`)
    console.log(`[createMechanismData] 当前 entity.current[${storageKey}]:`, entity.current[storageKey])

    if (location === "current") {
        // 在 current 中创建 Current 实例
        if (!entity.current[storageKey]) {
            console.log(`[createMechanismData] 创建新的 Current 实例: ${storageKey}`)
            const current = new Current(
                entity,  // source
                entity,  // owner
                storageKey,  // key
                defaultValue as number,  // startValue
                {  // options
                    minBy: 0,
                    maxBy: Infinity,
                    allowOverMin: true,
                    allowOverMax: true
                },
                []  // triggers
            )
            // Current 构造函数会自动调用 appendCurrent
            console.log(`[createMechanismData] Current 创建完成，检查 entity.current[${storageKey}]:`, entity.current[storageKey])
        } else {
            console.log(`[createMechanismData] ${storageKey} 已存在，跳过创建`)
        }
    } else if (location === "status") {
        // 在 status 中创建 Status 实例
        if (!entity.status[storageKey]) {
            const status = new Status(
                entity,  // owner
                storageKey,  // key
                defaultValue as number  // baseValue
            )
            appendStatus(entity, status)
        }
    } else if (location === "custom") {
        // 自定义存储位置
        // 暂不实现，需要时再扩展
        console.warn(`[MechanismRegistry] 自定义存储位置暂未实现，请使用 current 或 status`)
    }
}

/**
 * 为机制生成 Triggers
 */
function generateTriggersForMechanism(
    entity: Entity,
    config: MechanismConfig
): TriggerRemover[] {
    const removers: TriggerRemover[] = []
    const logic = config.logic

    if (!logic) return removers

    const storageKey = config.data.key || config.key

    // 1. 生成吸收伤害的 Trigger
    if (logic.absorbDamage?.enabled) {
        const { remove } = entity.trigger.appendTrigger({
            when: "before",
            how: "take",
            key: "damage",
            level: logic.absorbDamage.priority || 0,
            callback: async (event, effect) => {
                const mechanismValue = entity.current[storageKey]?.value || 0
                if (mechanismValue <= 0) return

                const damageAmount = effect.params.value || 0
                const absorbed = logic.absorbDamage!.absorb(mechanismValue, damageAmount, event)

                // 更新机制值
                entity.current[storageKey].value -= absorbed

                // 更新伤害值
                effect.params.value -= absorbed

                // 记录日志
                if (absorbed > 0) {
                    newLog([`${config.label} 吸收了 ${absorbed} 点伤害`])
                }
            }
        })
        removers.push({ remove })
    }

    // 2. 生成清零 Triggers
    if (logic.clear) {
        const clearRule = logic.clear

        // 回合开始清零
        if (clearRule.onTurnStart) {
            const { remove } = entity.trigger.appendTrigger({
                when: "after",
                how: "make",
                key: "turnStart",
                callback: async () => {
                    if (entity.current[storageKey]) {
                        entity.current[storageKey].value = 0
                    }
                }
            })
            removers.push({ remove })
        }

        // 回合结束清零
        if (clearRule.onTurnEnd) {
            const { remove } = entity.trigger.appendTrigger({
                when: "after",
                how: "make",
                key: "turnEnd",
                callback: async () => {
                    if (entity.current[storageKey]) {
                        entity.current[storageKey].value = 0
                    }
                }
            })
            removers.push({ remove })
        }

        // 战斗结束清零
        if (clearRule.onBattleEnd) {
            const { remove } = entity.trigger.appendTrigger({
                when: "after",
                how: "make",
                key: "battleEnd",
                callback: async () => {
                    if (entity.current[storageKey]) {
                        entity.current[storageKey].value = 0
                    }
                }
            })
            removers.push({ remove })
        }

        // 受到伤害后清零
        if (clearRule.onDamaged) {
            const { remove } = entity.trigger.appendTrigger({
                when: "after",
                how: "take",
                key: "damage",
                callback: async () => {
                    if (entity.current[storageKey]) {
                        entity.current[storageKey].value = 0
                    }
                }
            })
            removers.push({ remove })
        }

        // TODO: 持续回合数和自定义清零条件
    }

    // 3. 生成自定义 Triggers
    if (logic.customTriggers) {
        for (const triggerConfig of logic.customTriggers) {
            const { remove } = entity.trigger.appendTrigger({
                when: triggerConfig.when,
                how: triggerConfig.how,
                key: triggerConfig.key,
                level: triggerConfig.level,
                callback: async (event, effect) => {
                    const mechanismValue = entity.current[storageKey]?.value || 0
                    await triggerConfig.callback(event, effect, mechanismValue, entity)
                }
            })
            removers.push({ remove })
        }
    }

    return removers
}

// ============ 内置游戏机制 ============

/**
 * 护甲机制
 * 吸收伤害，回合结束时清零
 */
registerMechanism({
    key: "armor",
    label: "护甲",
    icon: "🛡️",
    description: "吸收伤害，回合结束时清零",

    // 数据层：存储在 current.armor
    data: {
        location: "current",
        key: "armor",
        defaultValue: 0
    },

    // 逻辑层
    logic: {
        // 吸收伤害
        absorbDamage: {
            enabled: true,
            priority: 100,
            absorb: (armorValue, damageAmount, event) => {
                // 100% 吸收伤害
                return Math.min(armorValue, damageAmount)
            }
        },

        // 清零规则
        clear: {
            onTurnStart: true,    // 每个角色自己回合开始时清零
            onBattleEnd: true,    // 战斗结束时清零
            onDamaged: false,     // 受到伤害后不清零
            duration: 0           // 不使用持续回合数
        }
    },

    // UI层
    ui: {
        position: "healthBarRight",
        showWhen: (value) => value > 0,
        icon: "🛡️"
    }
})
