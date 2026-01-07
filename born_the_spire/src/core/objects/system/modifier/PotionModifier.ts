import { Entity } from "../Entity"
import { Potion } from "../../item/Subclass/Potion"
import { ItemModifier } from "./ItemModifier"
import { newLog, LogUnit } from "@/ui/hooks/global/log"
import { computed } from "vue"

/**
 * 药水管理器
 *
 * 专门用于管理角色的药水及其产生的副作用（触发器、修饰器等）
 * 每个角色应该有一个 PotionModifier 实例
 */
export class PotionModifier extends ItemModifier {
    public potions = computed(() => this.units.map(u => u.item as Potion))

    constructor(owner: Entity) {
        super(owner)
    }

    /**
     * 获得药水
     *
     * 完整流程（使用基类的通用方法）：
     * 1. 调用基类 acquireItem 处理 possess 和 get 交互
     * 2. 药水没有额外的特殊逻辑
     */
    acquirePotion(potion: Potion, source: Entity, parentLog?: LogUnit) {
        const log = parentLog || newLog([this.owner, "获得了药水", potion])

        // 使用基类的通用方法处理获得逻辑
        this.acquireItem(potion, source, log)
    }

    /**
     * 失去药水
     *
     * 完整流程：
     * 1. 调用基类 loseItem 清理所有副作用
     * 2. 可选：触发 lose 交互
     */
    losePotion(potion: Potion, triggerLoseEffect: boolean = false, parentLog?: LogUnit) {
        const log = parentLog || newLog([this.owner, "失去了药水", potion])

        // 使用基类的通用方法处理失去逻辑
        this.loseItem(potion, triggerLoseEffect, log)
    }

    /**
     * 移除药水（通过药水对象）
     * @alias losePotion
     */
    removePotion(potion: Potion, triggerLoseEffect: boolean = false, parentLog?: LogUnit): boolean {
        this.losePotion(potion, triggerLoseEffect, parentLog)
        return true
    }

    /**
     * 移除药水（通过药水 key）
     */
    removePotionByKey(potionKey: string, triggerLoseEffect: boolean = false, parentLog?: LogUnit): boolean {
        const potion = this.getPotionByKey(potionKey)
        if (potion) {
            this.losePotion(potion, triggerLoseEffect, parentLog)
            return true
        }
        return false
    }

    /**
     * 获取所有药水（响应式）
     */
    getPotions(): Potion[] {
        return this.potions.value
    }

    /**
     * 获取指定 key 的药水
     */
    getPotionByKey(potionKey: string): Potion | undefined {
        const unit = this.units.find(u => (u.item as any).key === potionKey)
        return unit?.item as Potion | undefined
    }

    /**
     * 检查是否拥有指定药水
     */
    hasPotion(potionKey: string): boolean {
        return this.units.some(u => (u.item as any).key === potionKey)
    }

    /**
     * 使用药水（指定使用方式）
     * @param potion 要使用的药水
     * @param useIndex use 交互的索引（默认 0）
     * @param targets 目标实体数组
     * @returns "cant" 表示无法使用，"success" 表示成功
     */
    usePotion(potion: Potion, useIndex: number = 0, targets: Entity[]) {
        // 使用基类的 useItemByIndex 方法
        const result = this.useItemByIndex(potion, useIndex, targets)

        // 如果使用成功，移除药水（药水使用后通常会消失）
        if (result === "success") {
            this.losePotion(potion, false)
        }

        return result
    }

    /**
     * 丢弃药水
     *
     * 药水的特殊行为：纯粹的移除，不触发 lose 交互的效果
     * （但如果药水定义了 lose 交互，仍会触发）
     *
     * @param potion 要丢弃的药水
     * @returns "cant" 表示无法丢弃，"success" 表示成功
     */
    discardPotion(potion: Potion): "cant" | "success" {
        // 检查是否可丢弃
        if (!potion.canDrop) {
            newLog([potion, "无法被丢弃"])
            return "cant"
        }

        // 检查是否拥有该药水
        if (!this.units.some(u => u.item === potion)) {
            newLog([this.owner, "未拥有药水", potion])
            return "cant"
        }

        // 直接移除，不触发 lose 效果
        this.loseItem(potion, false)

        newLog([this.owner, "丢弃了", potion])
        return "success"
    }
}

/**
 * 为实体初始化药水管理器
 */
export function initPotionModifier(entity: Entity): PotionModifier {
    const modifier = new PotionModifier(entity)
    Object.defineProperty(entity, '_potionModifier', {
        value: modifier,
        writable: false,
        enumerable: false,
        configurable: false
    })
    return modifier
}

/**
 * 获取实体的药水管理器
 */
export function getPotionModifier(entity: Entity): PotionModifier {
    const modifier = (entity as any)._potionModifier
    if (!modifier) {
        return initPotionModifier(entity)
    }
    return modifier
}
