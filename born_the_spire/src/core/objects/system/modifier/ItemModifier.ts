import { nanoid } from "nanoid"
import { Entity } from "../Entity"
import { Item } from "../../item/Item"
import { reactive, toRaw } from "vue"
import { newLog, LogUnit } from "@/ui/hooks/global/log"
import { doEvent } from "../ActionEvent"
import { EffectUnit } from "../effect/EffectUnit"
import { resolveTriggerEventTarget } from "../trigger/Trigger"

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
                    item: (this.item as any).label || (this.item as any).name || 'Unknown',
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
            itemLabel: (this.item as any).label || (this.item as any).name || 'Unknown',
            itemKey: (this.item as any).key || 'unknown',
            owner: (this.owner as any).label || 'Unknown',
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
        const index = this.units.findIndex(u => (u.item as any).key === itemKey)
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
     * 处理 possess 交互（持有期间的持续效果）
     * 从 OrganModifier 提取的通用逻辑
     */
    private processPossessInteraction(
        item: Item,
        possessInteraction: any,
        unit: ItemModifierUnit,
        _parentLog?: LogUnit
    ) {
        // 使用事件系统处理 possess 效果
        doEvent({
            key: "possessItem",
            source: item,
            medium: item,
            target: this.owner,
            doWhat: () => {
                // 2.1. 处理 triggers - 挂载触发器
                if (possessInteraction.triggers) {
                    for (const triggerDef of possessInteraction.triggers) {
                        const when = triggerDef.when || "before"
                        const how = triggerDef.how
                        const key = triggerDef.key
                        const level = triggerDef.level || 0

                        // 为每个 event 创建触发器
                        for (const eventConfig of triggerDef.event) {
                            const triggerRemover = this.owner.appendTrigger({
                                when,
                                how,
                                key,
                                level,
                                callback: (event, _effect, _triggerLevel) => {
                                    // 使用公共的目标解析函数
                                    const target = resolveTriggerEventTarget(
                                        eventConfig.targetType,
                                        event,
                                        _effect,
                                        item,           // triggerSource: 物品本身
                                        this.owner      // triggerOwner: 拥有者
                                    )

                                    // 执行事件
                                    doEvent({
                                        key: eventConfig.key,
                                        source: item,
                                        medium: item,
                                        target,
                                        info: eventConfig.info || {},
                                        effectUnits: eventConfig.effect
                                    })
                                }
                            })

                            // 收集 remover
                            unit.registerTriggerRemover(triggerRemover.remove, `${triggerDef.importantKey || triggerDef.key}`)
                        }
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
     * 通用交互处理：失去物品
     *
     * 处理流程：
     * 1. 从 units 中移除对应的 ItemModifierUnit
     * 2. 清理所有副作用（触发器、修饰器等）
     * 3. 可选：触发 lose 交互（失去时的一次性效果）
     *
     * @param item 要失去的物品
     * @param triggerLoseEffect 是否触发 lose 交互
     * @param parentLog 可选的父日志
     */
    protected loseItem(item: Item, triggerLoseEffect: boolean = false, parentLog?: LogUnit): boolean {
        const log = parentLog || newLog([this.owner, "失去了", item])

        // 1. 找到并清理副作用
        const removed = this.removeByItem(item, log)
        if (!removed) {
            console.warn(`[ItemModifier] 未找到物品 ${item.label}，可能已经被移除`)
            return false
        }

        // 2. 可选：触发 lose 交互（失去物品时的一次性效果）
        if (triggerLoseEffect) {
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

// 使用 WeakMap 存储 ItemModifier 实例，避免与 Vue reactive 冲突
const itemModifierMap = new WeakMap<Entity, ItemModifier>()

/**
 * 为实体初始化物品修饰器管理器
 */
export function initItemModifier(entity: Entity): ItemModifier {
    const rawEntity = toRaw(entity)
    const modifier = new ItemModifier(rawEntity)
    itemModifierMap.set(rawEntity, modifier)
    return modifier
}

/**
 * 获取实体的物品修饰器管理器
 */
export function getItemModifier(entity: Entity): ItemModifier {
    const rawEntity = toRaw(entity)
    let modifier = itemModifierMap.get(rawEntity)
    if (!modifier) {
        modifier = initItemModifier(rawEntity)
    }
    return modifier
}
