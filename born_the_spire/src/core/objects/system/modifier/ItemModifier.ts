import { nanoid } from "nanoid"
import { Entity } from "../Entity"
import type { Item } from "../../item/Item"
import type { Interaction } from "../../item/Item"
import type { Organ } from "../../target/Organ"
import { reactive, toRaw } from "vue"
import { newLog } from "@/ui/hooks/global/log"
import type { LogUnit } from "@/ui/hooks/global/log"
import { doEvent } from "../ActionEvent"
import type { EffectUnit } from "../effect/EffectUnit"
import { resolveTriggerEventTarget } from "../trigger/resolveTriggerEventTarget"
import { nowBattle } from "@/core/objects/game/battle"
import { isEntity } from "@/core/utils/typeGuards"
import { checkCondition as checkConditionExpr } from "@/core/types/ConditionSystem"
import type { ConditionContext, Condition } from "@/core/types/ConditionSystem"
import type { ActionEvent } from "../ActionEvent"
import type { Effect } from "../effect/Effect"

import type { TriggerEventConfig, TriggerMapItemWithAction, ImportantTriggerMapItem, TriggerCondition, TriggerMapItem } from "@/core/types/object/trigger"

/**
 * 构建条件检查上下文
 */
function buildConditionContext(
    item: Item,
    owner: Entity,
    triggerEvent: ActionEvent,
    triggerEffect: Effect | null
): ConditionContext {
    return {
        item: item as any,
        owner,
        source: item as any,  // trigger source = 触发器所在的物品
        target: triggerEvent?.target as any,
        event: triggerEvent,
        triggerSource: item as any,
        triggerOwner: owner,
        triggerEffect: triggerEffect ?? undefined,
        battle: nowBattle.value
    }
}

/**
 * 检查条件是否满足（支持新字符串格式和旧对象格式）
 */
function evaluateCondition(
    condition: Condition | TriggerCondition,
    item: Item,
    owner: Entity,
    triggerEvent: ActionEvent,
    triggerEffect: Effect | null
): boolean {
    if (!condition) return true

    // 新格式：字符串/数组/ConditionGroup
    if (typeof condition === "string" || Array.isArray(condition) ||
        (typeof condition === "object" && ('and' in condition || 'or' in condition || 'not' in condition))) {
        const ctx = buildConditionContext(item, owner, triggerEvent, triggerEffect)
        return checkConditionExpr(condition as Condition, ctx)
    }

    // 旧格式兼容（deprecated）
    return true
}

/**
 * 执行物品的 reaction 事件（统一入口）
 *
 * 所有 item（器官/遗物）的 reaction 都通过这里执行，包括 possess 和 work 触发器。
 * 在这里统一检查 item.isDisabled，以及条件检查、$triggerValue 解析等。
 *
 * @param item - 触发 reaction 的物品（器官/遗物）
 * @param reactionEvents - 要执行的 reaction 事件配置
 * @param triggerEvent - 触发该 reaction 的原始事件
 * @param owner - 物品持有者（玩家/敌人）
 * @param triggerEffect - 触发该 reaction 的效果对象（可能为 null）
 * @param options - 额外选项（条件检查、disableUntil 等）
 */
export function executeItemReaction(params: {
    item: Item,
    reactionEvents: TriggerEventConfig[],
    triggerEvent: ActionEvent,
    owner: Entity,
    triggerEffect: Effect | null,
    condition?: Condition | TriggerCondition,
    disableUntil?: string,
    unit?: ItemModifierUnit,
    triggerMountTarget?: Entity,
    triggerDefKey?: string,
}): void {
    const { item, reactionEvents, triggerEvent, owner, triggerEffect, condition, disableUntil, unit, triggerMountTarget, triggerDefKey } = params

    // 检查物品是否被禁用
    if (item.isDisabled) return

    // 条件检查（新格式字符串/数组/ConditionGroup）
    if (condition && !evaluateCondition(condition, item, owner, triggerEvent, triggerEffect)) return

    for (const eventConfig of reactionEvents) {
        if (eventConfig.targetType === "triggerEffect" && !triggerEffect) continue

        // 通用条件检查（新格式）
        if (eventConfig.condition && !evaluateCondition(eventConfig.condition, item, owner, triggerEvent, triggerEffect)) continue

        // 解析 source
        const source = eventConfig.sourceTargetType
            ? resolveTriggerEventTarget(eventConfig.sourceTargetType, triggerEvent, triggerEffect, item, owner, { allowNull: true })
            : item

        // 解析 medium
        const medium = eventConfig.mediumTargetType
            ? resolveTriggerEventTarget(eventConfig.mediumTargetType, triggerEvent, triggerEffect, item, owner, { allowNull: true })
            : item

        // 解析 target
        const target = resolveTriggerEventTarget(eventConfig.targetType, triggerEvent, triggerEffect, item, owner, { allowNull: true })

        const newEvent = doEvent({
            key: eventConfig.key,
            source: (source ?? item) as any,
            medium: (medium ?? item) as any,
            target: (target ?? item) as any,
            info: eventConfig.info || {},
            effectUnits: eventConfig.effect ?? []
        })

        // 设置触发器上下文
        newEvent.triggerContext = triggerEvent.triggerContext || {
            source: item,
            owner: triggerMountTarget ?? owner,
        }

        // disableUntil：触发后禁用物品直到指定事件
        if (disableUntil && !item.isDisabled && unit) {
            item.isDisabled = true
            if (disableUntil === "battleEnd") {
                const restore = owner.appendTrigger({
                    when: "after",
                    how: "take",
                    key: "battleEnd",
                    callback: () => {
                        item.isDisabled = false
                        restore.remove()
                    }
                })
                unit.registerTriggerRemover(restore.remove, `restore-${triggerDefKey || "item"}`)
            }
        }
    }
}

/**
 * 物品修饰单元 - 记录单个物品（器官/遗物/卡牌等）产生的所有副作用
 *
 * 当物品被添加到实体时，会创建一个 ItemModifierUnit
 * 所有产生的副作用（触发器、修饰器等）的清理函数都会被收集到这里
 * 当物品被移除时，自动清理所有副作用
 */
export class ItemModifierUnit {
    public readonly id: string = nanoid()
    public readonly item: Item  // 产生副作用的物品
    public readonly owner: Entity  // 拥有该物品的实体
    private removers: Array<{
        type: 'trigger' | 'modifier' | 'custom',
        name?: string,  // 用于调试
        remove: () => void
    }> = []

    constructor(item: Item, owner: Entity) {
        this.item = item
        this.owner = owner
    }

    /**
     * 注册一个触发器的移除函数
     */
    registerTriggerRemover(remover: () => void, triggerName?: string) {
        this.removers.push({
            type: 'trigger',
            name: triggerName,
            remove: remover
        })
    }

    /**
     * 注册一个修饰器的移除函数
     */
    registerModifierRemover(remover: () => void, modifierName?: string) {
        this.removers.push({
            type: 'modifier',
            name: modifierName,
            remove: remover
        })
    }

    /**
     * 注册自定义清理函数
     */
    registerCustomRemover(remover: () => void, name?: string) {
        this.removers.push({
            type: 'custom',
            name,
            remove: remover
        })
    }

    /**
     * 清理所有副作用
     * @param parentLog 可选的父日志，如果提供则将清理日志作为子日志
     */
    cleanup(parentLog?: LogUnit) {
        // 逆序清理（后添加的先清理）
        for (let i = this.removers.length - 1; i >= 0; i--) {
            const { type, name, remove } = this.removers[i]
            try {
                // 如果有父日志，添加子日志
                if(parentLog) {
                    const typeName = type === 'trigger' ? '触发器' : type === 'modifier' ? '修饰器' : '副作用'
                    newLog([`移除${typeName}:`, name || '未命名'], parentLog)
                }
                remove()
            } catch (error) {
                console.error(`[ItemModifierUnit] 清理失败:`, {
                    item: this.item.label,
                    type,
                    name,
                    error
                })
            }
        }
        this.removers = []
    }

    /**
     * 获取副作用统计（用于调试）
     */
    getStats() {
        const byType: Record<string, number> = {}
        for (const r of this.removers) {
            byType[r.type] = (byType[r.type] || 0) + 1
        }
        return {
            itemLabel: this.item.label,
            itemKey: this.item.key,
            owner: this.owner.label,
            total: this.removers.length,
            byType
        }
    }
}

/**
 * 物品修饰器管理器
 *
 * 管理实体上所有物品（器官/遗物/卡牌等）的修饰单元
 * 每个实体应该有一个 ItemModifier 实例
 */
export class ItemModifier {
    protected units: ItemModifierUnit[] = reactive([])
    protected readonly owner: Entity

    constructor(owner: Entity) {
        this.owner = owner
    }

    private resolvePossessTriggerMountTarget(triggerDef: TriggerMapItemWithAction | ImportantTriggerMapItem): Entity | null {
        // 如果 triggerDef 中显式指定了 triggerTarget，使用它
        if (triggerDef.triggerTarget?.participantType === "entity" && triggerDef.triggerTarget.key === "player") {
            const battle = nowBattle.value
            if (!battle) {
                return null
            }
            const player = battle.getTeam("player")?.[0]
            return player && isEntity(player) ? player : null
        }

        // 默认行为：挂载到物品的拥有者（this.owner）
        // 对于遗物：this.owner = 玩家
        // 对于器官：this.owner = 敌人
        // 这样触发器可以监听拥有者的事件（如玩家抽牌、敌人行动等）
        return this.owner
    }

    private mountPossessTrigger(
        item: Item,
        triggerDef: TriggerMapItemWithAction | ImportantTriggerMapItem,
        triggerMountTarget: Entity,
        unit: ItemModifierUnit
    ) {
        const when = triggerDef.when || "before"
        const how = triggerDef.how
        const key = triggerDef.key
        const level = triggerDef.level || 0
        const disableUntil = triggerDef.disableUntil as string | undefined

        // 获取 reaction 事件配置
        const reactionEvents = item.reaction?.[triggerDef.action]
        if (!reactionEvents) {
            console.error(`触发器 action "${triggerDef.action}" 在 item 上找不到对应的 reaction`, item)
            return
        }

        const triggerRemover = triggerMountTarget.appendTrigger({
            when,
            how,
            key,
            level,
            callback: (event, _effect, _triggerLevel) => {
                // 检查物品是否被禁用（器官损坏等情况）
                if (item.isDisabled) return

                // 执行反应事件（统一的方法，在 executeItemReaction 中检查所有条件）
                executeItemReaction({
                    item,
                    reactionEvents,
                    triggerEvent: event,
                    owner: this.owner,
                    triggerEffect: _effect,
                    condition: triggerDef.condition,
                    disableUntil,
                    unit,
                    triggerMountTarget,
                    triggerDefKey: ('importantKey' in triggerDef ? triggerDef.importantKey : undefined) || triggerDef.key,
                })
            }
        })

        unit.registerTriggerRemover(triggerRemover.remove, `${('importantKey' in triggerDef ? triggerDef.importantKey : undefined) || triggerDef.key}`)

        // 当触发器挂载到非 owner（如 player）时，需要额外的清理机制
        if (triggerMountTarget !== this.owner) {
            // 1. 战斗结束清理：监听 owner 的 battleEnd 事件
            const battleEndCleanup = this.owner.appendTrigger({
                when: "after",
                how: "take",
                key: "battleEnd",
                callback: () => {
                    triggerRemover.remove()
                    battleEndCleanup.remove()
                    ownerDeathCleanup?.remove()
                }
            })
            unit.registerTriggerRemover(battleEndCleanup.remove, `battleEnd-cleanup-${('importantKey' in triggerDef ? triggerDef.importantKey : undefined) || triggerDef.key}`)

            // 2. 拥有者死亡清理：监听 owner 的 death 事件
            const ownerDeathCleanup = this.owner.appendTrigger({
                when: "after",
                how: "take",
                key: "death",
                callback: () => {
                    triggerRemover.remove()
                    battleEndCleanup.remove()
                    ownerDeathCleanup.remove()
                }
            })
            unit.registerTriggerRemover(ownerDeathCleanup.remove, `ownerDeath-cleanup-${('importantKey' in triggerDef ? triggerDef.importantKey : undefined) || triggerDef.key}`)
        }
    }

    private registerBattleStartDeferredTrigger(
        item: Item | Organ,
        triggerDef: TriggerMapItemWithAction | ImportantTriggerMapItem,
        unit: ItemModifierUnit
    ) {
        const deferRemover = this.owner.appendTrigger({
            when: "after",
            how: "take",
            key: "battleStart",
            callback: () => {
                const triggerMountTarget = this.resolvePossessTriggerMountTarget(triggerDef)
                if (!triggerMountTarget) return

                this.mountPossessTrigger(item as Item, triggerDef, triggerMountTarget, unit)
                deferRemover.remove()
            }
        })

        unit.registerTriggerRemover(deferRemover.remove, `defer-${('importantKey' in triggerDef ? triggerDef.importantKey : undefined) || triggerDef.key}`)
    }

    private processPossessTrigger(
        item: Item | Organ,
        triggerDef: TriggerMapItem | ImportantTriggerMapItem,
        unit: ItemModifierUnit
    ): void {
        // 只处理新格式（有 action 属性的）
        if (!('action' in triggerDef)) {
            return
        }

        const timing = triggerDef.timing || "immediate"
        const triggerMountTarget = this.resolvePossessTriggerMountTarget(triggerDef)

        if (timing === "battleStart") {
            if (triggerMountTarget) {
                this.mountPossessTrigger(item as Item, triggerDef, triggerMountTarget, unit)
                return
            }

            this.registerBattleStartDeferredTrigger(item as Item, triggerDef, unit)
            return
        }

        if (!triggerMountTarget) {
            console.warn(`[ItemModifier] 无法解析触发器挂载目标: ${('importantKey' in triggerDef ? triggerDef.importantKey : undefined) || triggerDef.key}`)
            return
        }

        this.mountPossessTrigger(item as Item, triggerDef, triggerMountTarget, unit)
    }

    /**
     * 添加物品，创建并返回修饰单元
     * 返回的单元用于后续注册副作用的清理函数
     */
    add(item: Item): ItemModifierUnit {
        const unit = new ItemModifierUnit(item, this.owner)
        this.units.push(unit)
        return unit
    }

    /**
     * 通过单元 ID 移除物品
     * @param parentLog 可选的父日志
     */
    remove(unitId: string, parentLog?: LogUnit): boolean {
        const index = this.units.findIndex(u => u.id === unitId)
        if (index >= 0) {
            const unit = this.units[index]
            unit.cleanup(parentLog)
            this.units.splice(index, 1)
            return true
        }
        return false
    }

    /**
     * 通过物品本身移除（查找第一个匹配的）
     * @param parentLog 可选的父日志
     */
    removeByItem(item: Item, parentLog?: LogUnit): boolean {
        const index = this.units.findIndex(u => u.item === item)
        if (index >= 0) {
            const unit = this.units[index]
            unit.cleanup(parentLog)
            this.units.splice(index, 1)
            return true
        }
        return false
    }

    /**
     * 通过物品 key 移除（查找第一个匹配的）
     * @param parentLog 可选的父日志
     */
    removeByKey(itemKey: string, parentLog?: LogUnit): boolean {
        const index = this.units.findIndex(u => u.item.key === itemKey)
        if (index >= 0) {
            const unit = this.units[index]
            unit.cleanup(parentLog)
            this.units.splice(index, 1)
            return true
        }
        return false
    }

    /**
     * 获取指定物品的修饰单元
     */
    getUnit(item: Item): ItemModifierUnit | undefined {
        return this.units.find(u => u.item === item)
    }

    /**
     * 获取所有修饰单元
     */
    getUnits(): ItemModifierUnit[] {
        return [...this.units]
    }

    /**
     * 清理所有物品的副作用
     */
    clearAll() {
        for (let i = this.units.length - 1; i >= 0; i--) {
            this.units[i].cleanup()
        }
        this.units = []
    }

    /**
     * 获取统计信息（用于调试）
     */
    getStats() {
        return this.units.map(u => u.getStats())
    }

    /**
     * 处理 possess 交互（持有期间的持续效果）
     * 从 OrganModifier 提取的通用逻辑
     */
    private processPossessInteraction(
        item: Item | Organ,
        possessInteraction: Interaction,
        unit: ItemModifierUnit,
        _parentLog?: LogUnit
    ) {

        // 使用事件系统处理 possess 效果
        doEvent({
            key: "possessItem",
            source: item,
            medium: item,
            target: this.owner,
            effectUnits: possessInteraction.effects || [],
            onComplete: (event) => {
                // 收集 effects 产生的副作用
                const sideEffects = event.getSideEffects()
                for (const remover of sideEffects) {
                    unit.registerCustomRemover(remover, "possess effect")
                }
            },
            doWhat: () => {
                // 2.1. 处理 triggers - 挂载触发器
                if (possessInteraction.triggers) {
                    for (const triggerDef of possessInteraction.triggers) {
                        this.processPossessTrigger(item, triggerDef, unit)
                    }
                }

                // 2.2. 处理 modifiers - 添加属性修饰器
                if (possessInteraction.modifiers) {
                    for (const modifierDef of possessInteraction.modifiers) {
                        const statusKey = modifierDef.statusKey
                        const label = modifierDef.label || statusKey

                        // 获取目标的 Status 对象
                        const status = this.owner.status[statusKey]
                        if (!status) {
                            console.warn(`[ItemModifier] 实体 ${this.owner.label} 没有属性 ${statusKey}，跳过修饰器`)
                            continue
                        }

                        // 添加修饰器
                        const remover = status.addByJSON(item, {
                            targetLayer: modifierDef.targetLayer || "current",
                            modifierType: modifierDef.modifierType || "additive",
                            applyMode: modifierDef.applyMode || "absolute",
                            modifierValue: modifierDef.modifierValue || 0,
                            clearable: modifierDef.clearable,
                            modifierFunc: modifierDef.modifierFunc
                        })

                        // 收集 remover
                        unit.registerModifierRemover(remover, label)
                    }
                }
            }
        })
    }

    /**
     * 通用交互处理：获得物品
     *
     * 处理流程：
     * 1. 创建 ItemModifierUnit
     * 2. 处理 possess 交互（持有期间的持续效果）
     *    - 添加 triggers
     *    - 添加 modifiers
     * 3. 触发 get 交互（获得时的一次性效果）
     *
     * @param item 要获得的物品
     * @param source 物品来源
     * @param parentLog 可选的父日志
     * @returns ItemModifierUnit 用于子类注册额外的副作用
     */
    protected acquireItem(item: Item, source: Entity, parentLog?: LogUnit): ItemModifierUnit {
        const log = parentLog || newLog([this.owner, "获得了", item])

        // 1. 创建 ItemModifierUnit
        const unit = this.add(item)

        // 2. 处理 possess 交互（持有期间的持续效果）
        const possessInteraction = item.getInteraction("possess")
        if (possessInteraction) {
            this.processPossessInteraction(item, possessInteraction, unit, log)
        }

        // 3. 处理 get 交互（获得时的一次性效果）
        const getInteraction = item.getInteraction("get")
        let effectUnits: EffectUnit[] = []
        if (getInteraction) {
            effectUnits = getInteraction.effects || []
        }

        // 触发 getItem 事件
        doEvent({
            key: "getItem",
            source,
            medium: item,
            target: this.owner,
            effectUnits
        })

        return unit
    }

    /**
     * 通用交互处理：失去物品
     *
     * 处理流程：
     * 1. 从 units 中移除对应的 ItemModifierUnit
     * 2. 清理所有副作用（触发器、修饰器等）
     * 3. 触发 lose 交互（失去时的一次性效果）
     *
     * @param item 要失去的物品
     * @param parentLog 可选的父日志
     */
    protected loseItem(item: Item, parentLog?: LogUnit): boolean {
        const log = parentLog || newLog([this.owner, "失去了", item])

        // 1. 找到并清理副作用
        const removed = this.removeByItem(item, log)
        if (!removed) {
            console.warn(`[ItemModifier] 未找到物品 ${item.label}，可能已经被移除`)
            return false
        }

        // 2. 触发 lose 交互（失去物品时的一次性效果）
        const loseInteraction = item.getInteraction("lose")
        if (loseInteraction) {
            doEvent({
                key: "loseItem",
                source: this.owner,
                medium: item,
                target: this.owner,
                effectUnits: loseInteraction.effects || []
            })
        }

        return true
    }

    /**
     * 通用交互处理：使用物品
     *
     * @param item 要使用的物品
     * @param targets 目标实体数组
     * @returns "cant" 表示无法使用，"success" 表示成功
     */
    protected useItem(item: Item, targets: Entity[]): "cant" | "success" {
        // 检查是否拥有该物品
        if (!this.units.some(u => u.item === item)) {
            newLog([this.owner, "未拥有", item])
            return "cant"
        }

        // 检查是否失效
        if (item.isDisabled) {
            newLog([item, "已失效，无法使用"])
            return "cant"
        }

        // 获取 use 交互
        const useInteraction = item.getInteraction("use")
        if (!useInteraction) {
            newLog([item, "无法被使用"])
            return "cant"
        }

        // 触发 useItem 事件
        for (const target of targets) {
            doEvent({
                key: "useItem",
                source: this.owner,
                medium: item,
                target: target,
                effectUnits: useInteraction.effects || []
            })
        }

        newLog([this.owner, "使用了", item])
        return "success"
    }

    /**
     * 通用交互处理：使用物品（指定使用方式索引）
     *
     * @param item 要使用的物品
     * @param useIndex use 交互的索引（用于多个 use 的情况）
     * @param targets 目标实体数组
     * @returns "cant" 表示无法使用，"success" 表示成功
     */
    protected useItemByIndex(item: Item, useIndex: number, targets: Entity[]): "cant" | "success" {
        // 检查是否拥有该物品
        if (!this.units.some(u => u.item === item)) {
            newLog([this.owner, "未拥有", item])
            return "cant"
        }

        // 检查是否失效
        if (item.isDisabled) {
            newLog([item, "已失效，无法使用"])
            return "cant"
        }

        // 获取指定索引的 use 交互
        const useInteraction = item.getUse(useIndex)
        if (!useInteraction) {
            newLog([item, `无法执行第 ${useIndex} 个使用方式`])
            return "cant"
        }

        // 触发 useItem 事件
        for (const target of targets) {
            doEvent({
                key: "useItem",
                source: this.owner,
                medium: item,
                target: target,
                effectUnits: useInteraction.effects || []
            })
        }

        const actionLabel = useInteraction.label || "使用了"
        newLog([this.owner, actionLabel, item])
        return "success"
    }

    /**
     * 通用交互处理：使物品失效
     *
     * @param item 要失效的物品
     */
    protected disableItem(item: Item): boolean {
        // 检查是否拥有该物品
        if (!this.units.some(u => u.item === item)) {
            newLog([this.owner, "未拥有", item])
            return false
        }

        // 如果已经失效，直接返回
        if (item.isDisabled) {
            return false
        }

        // 设置失效状态
        item.isDisabled = true

        // 触发 disable 交互（一次性效果）
        const disableInteraction = item.getInteraction("disable")
        if (disableInteraction && disableInteraction.effects) {
            doEvent({
                key: "disableItem",
                source: this.owner,
                medium: item,
                target: this.owner,
                effectUnits: disableInteraction.effects
            })
        }

        newLog([item, "已失效"])
        return true
    }

    /**
     * 通用交互处理：使物品恢复
     *
     * @param item 要恢复的物品
     */
    protected enableItem(item: Item): boolean {
        // 检查是否拥有该物品
        if (!this.units.some(u => u.item === item)) {
            newLog([this.owner, "未拥有", item])
            return false
        }

        // 如果未失效，直接返回
        if (!item.isDisabled) {
            return false
        }

        // 设置恢复状态
        item.isDisabled = false

        // 触发 enable 交互（一次性效果）
        const enableInteraction = item.getInteraction("enable")
        if (enableInteraction && enableInteraction.effects) {
            doEvent({
                key: "enableItem",
                source: this.owner,
                medium: item,
                target: this.owner,
                effectUnits: enableInteraction.effects
            })
        }

        newLog([item, "已恢复"])
        return true
    }
}

/**
 * 为实体初始化物品修饰器管理器
 */
export function initItemModifier(entity: Entity): ItemModifier {
    const rawEntity = toRaw(entity)
    const modifier = new ItemModifier(rawEntity)

    // 注册到全局 ModifierManager
    import("@/core/managers/ModifierManager").then(({ modifierManager }) => {
        modifierManager.registerItemModifier(rawEntity, modifier)
    })

    return modifier
}

/**
 * 获取实体的物品修饰器管理器
 */
export async function getItemModifier(entity: Entity): Promise<ItemModifier> {
    const rawEntity = toRaw(entity)

    // 先尝试从 ModifierManager 获取
    let modifier: ItemModifier | undefined

    // 异步导入检查
    try {
        const { modifierManager } = await import("@/core/managers/ModifierManager")
        modifier = modifierManager.getItemModifier(rawEntity)
    } catch {
        // ModifierManager 未加载，创建新实例
    }

    if (!modifier) {
        modifier = initItemModifier(rawEntity)
    }

    return modifier
}
