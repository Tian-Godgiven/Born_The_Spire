import { nanoid } from "nanoid"
import { Entity } from "../Entity"
import { Organ } from "../../target/Organ"
import { Relic } from "../../item/Subclass/Relic"
import { reactive } from "vue"
import { newLog, LogUnit } from "@/ui/hooks/global/log"

/**
 * 物品修饰单元 - 记录单个物品（器官/遗物）产生的所有副作用
 *
 * 当器官或遗物被添加到实体时，会创建一个 ItemModifierUnit
 * 所有产生的副作用（触发器、修饰器等）的清理函数都会被收集到这里
 * 当物品被移除时，自动清理所有副作用
 */
export class ItemModifierUnit {
    public readonly id: string = nanoid()
    public readonly item: Organ | Relic  // 产生副作用的物品
    public readonly owner: Entity  // 拥有该物品的实体
    private removers: Array<{
        type: 'trigger' | 'modifier' | 'custom',
        name?: string,  // 用于调试
        remove: () => void
    }> = []

    constructor(item: Organ | Relic, owner: Entity) {
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
 * 管理实体上所有物品（器官/遗物）的修饰单元
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
    add(item: Organ | Relic): ItemModifierUnit {
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
    removeByItem(item: Organ | Relic, parentLog?: LogUnit): boolean {
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
    getUnit(item: Organ | Relic): ItemModifierUnit | undefined {
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
}

/**
 * 为实体初始化物品修饰器管理器
 */
export function initItemModifier(entity: Entity): ItemModifier {
    const modifier = new ItemModifier(entity)
    // 将修饰器挂载到实体的私有属性上
    Object.defineProperty(entity, '_itemModifier', {
        value: modifier,
        writable: false,
        enumerable: false,
        configurable: false
    })
    return modifier
}

/**
 * 获取实体的物品修饰器管理器
 */
export function getItemModifier(entity: Entity): ItemModifier {
    const modifier = (entity as any)._itemModifier
    if (!modifier) {
        // 如果不存在，自动初始化
        return initItemModifier(entity)
    }
    return modifier
}
