import { reactive, toRaw } from "vue"
import { Entity } from "../Entity"
import { Card } from "../../item/Subclass/Card"
import { Player } from "../../target/Player"
import { getCardByKey } from "@/static/list/item/cardList"
import { newLog, LogUnit } from "@/ui/hooks/global/log"
import { Organ } from "../../target/Organ"

/**
 * 卡牌修饰器管理器
 *
 * 专门用于管理角色牌组中来自不同来源（器官、遗物等）的卡牌
 * 当来源（如器官）被移除时，自动移除对应的卡牌
 * 每个 Player 应该有一个 CardModifier 实例
 */
export class CardModifier {
    private readonly owner: Player
    // 记录每个来源（器官/遗物）提供的卡牌
    private cardsFromSources: Map<Entity, Card[]> = reactive(new Map())

    constructor(owner: Player) {
        this.owner = owner
    }

    /**
     * 从指定来源添加卡牌到牌组
     * @param source 来源实体（如器官）
     * @param cardKeys 要添加的卡牌 key 列表
     * @param parentLog 可选的父日志，用于嵌套显示
     * @returns 添加的卡牌对象数组
     */
    addCardsFromSource(source: Entity, cardKeys: string[], parentLog?: LogUnit): Card[] {
        const addedCards: Card[] = []

        // 安全检查：确保 cards 数组已初始化
        if (!this.owner.cards) {
            this.owner.cards = []
        }

        for (const cardKey of cardKeys) {
            // 创建卡牌实例
            const card = getCardByKey(cardKey)

            // 设置卡牌来源
            card.source = source

            // 添加到玩家卡组
            this.owner.cards.push(card)

            // 记录到来源映射
            if (!this.cardsFromSources.has(source)) {
                this.cardsFromSources.set(source, [])
            }
            this.cardsFromSources.get(source)!.push(card)

            addedCards.push(card)

            // 记录日志
            if (parentLog) {
                newLog(["添加卡牌:", card], parentLog)
            }
        }

        return addedCards
    }

    /**
     * 移除指定来源提供的所有卡牌
     * @param source 来源实体（如器官）
     * @param parentLog 可选的父日志，用于嵌套显示
     * @returns 是否成功移除
     */
    removeCardsFromSource(source: Entity, parentLog?: LogUnit): boolean {
        const cards = this.cardsFromSources.get(source)
        if (!cards || cards.length === 0) {
            return false
        }

        // 安全检查：确保 cards 数组已初始化
        if (!this.owner.cards) {
            this.owner.cards = []
            return false
        }

        // 从玩家卡组中移除所有该来源的卡牌
        for (const card of cards) {
            const index = this.owner.cards.indexOf(card)
            if (index >= 0) {
                this.owner.cards.splice(index, 1)

                // 记录日志
                if (parentLog) {
                    newLog(["移除卡牌:", card], parentLog)
                }
            }
        }

        // 清除来源映射
        this.cardsFromSources.delete(source)
        return true
    }

    /**
     * 检查卡牌是否可以打出
     * @param card 要检查的卡牌
     * @returns 如果卡牌可以打出返回 true，否则返回失败原因
     */
    canPlayCard(card: Card): true | string {
        // 如果卡牌没有来源，说明是初始卡组的卡牌，总是可以打出
        if (!card.source) {
            return true
        }

        const source = card.source

        // 如果来源是器官，检查是否损坏
        if (source instanceof Organ) {
            if (source.isBroken) {
                return `来源器官 ${source.label} 已损坏`
            }
        }

        // 检查来源是否仍然存在（是否仍在 cardsFromSources 中）
        const sourceCards = this.cardsFromSources.get(source)
        if (!sourceCards || !sourceCards.includes(card)) {
            return `来源 ${source.label} 已失效`
        }

        return true
    }

    /**
     * 获取指定来源提供的卡牌列表
     */
    getCardsFromSource(source: Entity): Card[] {
        return this.cardsFromSources.get(source) || []
    }

    /**
     * 获取所有有来源的卡牌及其来源的映射
     */
    getAllSourcedCards(): Map<Entity, Card[]> {
        return new Map(this.cardsFromSources)
    }

    /**
     * 清理所有有来源的卡牌（用于战斗结束等场景）
     */
    clearAll() {
        for (const [source, cards] of this.cardsFromSources.entries()) {
            for (const card of cards) {
                const index = this.owner.cards.indexOf(card)
                if (index >= 0) {
                    this.owner.cards.splice(index, 1)
                }
            }
        }
        this.cardsFromSources.clear()
    }

    /**
     * 获取统计信息（用于调试）
     */
    getStats() {
        const stats: Array<{
            source: string,
            sourceKey: string,
            cardCount: number,
            cards: string[]
        }> = []

        for (const [source, cards] of this.cardsFromSources.entries()) {
            stats.push({
                source: (source as any).label || 'Unknown',
                sourceKey: (source as any).key || 'unknown',
                cardCount: cards.length,
                cards: cards.map(c => c.label || c.key)
            })
        }

        return {
            owner: (this.owner as any).label || 'Unknown',
            totalSourcedCards: Array.from(this.cardsFromSources.values()).reduce((sum, cards) => sum + cards.length, 0),
            sources: stats
        }
    }
}

// 使用 WeakMap 存储 CardModifier 实例，避免与 Vue reactive 冲突
const cardModifierMap = new WeakMap<Player, CardModifier>()

/**
 * 为玩家初始化卡牌修饰器管理器
 */
export function initCardModifier(player: Player): CardModifier {
    const modifier = new CardModifier(player)
    cardModifierMap.set(player, modifier)
    return modifier
}

/**
 * 获取玩家的卡牌修饰器管理器
 */
export function getCardModifier(player: Player): CardModifier {
    let modifier = cardModifierMap.get(player)
    if (!modifier) {
        modifier = initCardModifier(player)
    }
    return modifier
}
