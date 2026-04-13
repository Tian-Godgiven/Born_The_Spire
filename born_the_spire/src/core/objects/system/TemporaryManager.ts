import { Entity } from "./Entity"
import { Card } from "../item/Subclass/Card"
import { Organ, removeOrgan } from "../target/Organ"
import { Player } from "../target/Player"
import { ActionEvent } from "./ActionEvent"
import { leaveHand } from "@/core/effects/card"

/**
 * 临时物品管理器
 * 负责管理临时卡牌和临时器官的生命周期
 */
export class TemporaryManager {
    private temporaryItems: Set<Card | Organ> = new Set()
    private removeCallbacks: Map<Card | Organ, () => void | Promise<void>> = new Map()

    /**
     * 注册临时物品
     * @param item 临时物品（卡牌或器官）
     * @param owner 持有者
     */
    registerTemporary(item: Card | Organ, owner: Entity) {
        if (!item.isTemporary || !item.temporaryRemoveOn) {
            console.warn("[TemporaryManager] 尝试注册非临时物品:", item)
            return
        }

        this.temporaryItems.add(item)

        // 创建移除回调
        const removeCallback = async () => {
            await this.removeTemporaryItem(item, owner)
        }
        this.removeCallbacks.set(item, removeCallback)

        // 根据移除时机添加触发器
        const triggerConfig = this.getTriggerConfig(item.temporaryRemoveOn)
        const { remove } = owner.appendTrigger({
            when: triggerConfig.when,
            how: triggerConfig.how,
            key: triggerConfig.key,
            callback: async (event) => {
                // 检查是否应该移除此物品
                if (this.shouldRemoveItem(item, event)) {
                    await removeCallback()
                }
            }
        })

        // 保存触发器移除函数
        const originalRemove = this.removeCallbacks.get(item)!
        this.removeCallbacks.set(item, async () => {
            await originalRemove()
            remove() // 同时移除触发器
        })
    }

    /**
     * 移除临时物品
     */
    private async removeTemporaryItem(item: Card | Organ, owner: Entity) {
        if (!this.temporaryItems.has(item)) return

        this.temporaryItems.delete(item)
        const removeCallback = this.removeCallbacks.get(item)
        if (removeCallback) {
            this.removeCallbacks.delete(item)
        }

        // 根据物品类型执行移除逻辑
        if ('itemType' in item && item.itemType === 'card') {
            this.removeTemporaryCard(item as Card, owner as Player)
        } else if ('targetType' in item && item.targetType === 'organ') {
            await this.removeTemporaryOrgan(item as Organ, owner)
        }
    }

    /**
     * 移除临时卡牌
     */
    private removeTemporaryCard(card: Card, player: Player) {
        // 从所有牌堆中移除卡牌
        const piles = ['handPile', 'drawPile', 'discardPile', 'exhaustPile'] as const
        for (const pileName of piles) {
            const pile = player.cardPiles[pileName]
            const index = pile.indexOf(card)
            if (index !== -1) {
                if (pileName === 'handPile') {
                    leaveHand(card, pile)
                } else {
                    pile.splice(index, 1)
                }
                break
            }
        }
    }

    /**
     * 移除临时器官
     */
    private async removeTemporaryOrgan(organ: Organ, owner: Entity) {
        removeOrgan(owner, organ, false) // 不触发失去效果
    }

    /**
     * 获取触发器配置
     */
    private getTriggerConfig(removeOn: "battleEnd" | "turnEnd" | "floorEnd") {
        switch (removeOn) {
            case "battleEnd":
                return { when: "after" as const, how: "make" as const, key: "battleEnd" }
            case "turnEnd":
                return { when: "after" as const, how: "make" as const, key: "turnEnd" }
            case "floorEnd":
                return { when: "after" as const, how: "make" as const, key: "floorEnd" }
            default:
                throw new Error(`[TemporaryManager] 未知的移除时机: ${removeOn}`)
        }
    }

    /**
     * 检查是否应该移除物品
     */
    private shouldRemoveItem(item: Card | Organ, event: ActionEvent): boolean {
        // 简单实现：只要事件类型匹配就移除
        // 可以根据需要添加更复杂的条件判断
        return true
    }

    /**
     * 手动移除临时物品（用于清理）
     */
    async removeItem(item: Card | Organ) {
        const removeCallback = this.removeCallbacks.get(item)
        if (removeCallback) {
            await removeCallback()
        }
    }

    /**
     * 获取所有临时物品
     */
    getTemporaryItems(): (Card | Organ)[] {
        return Array.from(this.temporaryItems)
    }

    /**
     * 清理所有临时物品
     */
    async clear() {
        for (const item of this.temporaryItems) {
            const removeCallback = this.removeCallbacks.get(item)
            if (removeCallback) {
                await removeCallback()
            }
        }
        this.temporaryItems.clear()
        this.removeCallbacks.clear()
    }
}

// 全局临时物品管理器实例
export const temporaryManager = new TemporaryManager()