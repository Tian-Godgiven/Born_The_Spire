import type { Entity } from "../Entity"
import type { Card } from "../../item/Subclass/Card"
import type { Player } from "../../target/Player"
import type { Chara } from "../../target/Target"
import type { LogUnit } from "@/ui/hooks/global/log"
import type { Organ } from "../../target/Organ"

import { newLog } from "@/ui/hooks/global/log"
import { reactive, toRaw } from "vue"

import { nowBattle } from "../../game/battle"
import { getCardByKey, getAllCards } from "@/static/list/item/cardList"
import { isPlayer, isOrgan } from "@/core/utils/typeGuards"
import { doEvent } from "../ActionEvent"
import { ifHaveStatus, getStatusValue } from "../status/Status"

/**
 * 卡牌修饰器管理器
 *
 * 专门用于管理角色牌组中来自不同来源（器官、遗物等）的卡牌
 * 当挂载来源被移除时，自动移除当前挂在它上面的卡。锻牌认 provider，不跟移植走。
 * 支持 Player 和 Enemy
 */
export class CardModifier {
    private readonly owner: Chara
    // 记录每个来源（器官/遗物）提供的卡牌
    private cardsFromSources: Map<Entity, Card[]> = reactive(new Map())

    constructor(owner: Chara) {
        this.owner = owner
    }

    /**
     * 添加卡牌到牌组
     * @param source 来源实体（器官、遗物或玩家自身）
     * @param cardKeys 要添加的卡牌 key 列表
     * @param parentLog 可选的父日志，用于嵌套显示
     * @param announce 是否播「获得飞向卡组」。开局自带牌传 false。
     */
    async addCardsFromSource(source: Entity, cardKeys: string[], parentLog?: LogUnit, announce: boolean = true): Promise<Card[]> {
        const addedCards: Card[] = []

        // 检查是否在战斗中
        const isInBattle = nowBattle.value !== null

        for (const cardKey of cardKeys) {
            // 创建卡牌实例
            const card = await getCardByKey(cardKey)

            // 从 cardList 获取 CardMap 以获取词条定义
            const cardMap = getAllCards().find(c => c.key === cardKey)
            const entries = cardMap?.entry ?? []

            card.source = source
            card.provider = source

            // 设置持有者（会自动应用词条）
            card.setOwner(this.owner, entries)

            // 如果在战斗中且 owner 是 Player，将卡牌添加到弃牌堆
            if (isInBattle && isPlayer(this.owner)) {
                (this.owner as Player).cardPiles.discardPile.push(card)
            }

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

        if (announce && isPlayer(this.owner) && addedCards.length > 0) {
            const { flyGainedCards } = await import("@/ui/animation/cardFlight")
            await flyGainedCards(addedCards)
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

        // 检查是否在战斗中
        const isInBattle = nowBattle.value !== null

        // 如果在战斗中且 owner 是 Player，从各个牌堆中移除
        if (isInBattle && isPlayer(this.owner)) {
            for (const card of cards) {
                const piles: (keyof typeof this.owner.cardPiles)[] = ['drawPile', 'discardPile', 'handPile', 'exhaustPile']
                for (const pileName of piles) {
                    const pile = this.owner.cardPiles[pileName]
                    const pileIndex = pile.indexOf(card)
                    if (pileIndex >= 0) {
                        pile.splice(pileIndex, 1)
                    }
                }

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
     *
     * "不可打出"判断走 status 而非 hasEntry —— 任意来源（card_cannot_play 词条 / 效果 /
     * 未来任意机制）只要给卡挂 "cannot-play" status > 0 都能生效
     *
     * @param card 要检查的卡牌
     * @returns 如果卡牌可以打出返回 true，否则返回失败原因
     */
    canPlayCard(card: Card): true | string {
        // 检查卡牌是否被禁用（status 语法糖类词条 / 任意效果均可挂）
        if (
            ifHaveStatus(card, "cannot-play") &&
            (getStatusValue(card, "cannot-play") as number) > 0
        ) {
            return `该卡牌无法被打出`
        }

        // 如果卡牌没有来源，说明是初始卡组的卡牌，总是可以打出
        if (!card.source) {
            return true
        }

        const source = card.source

        // 如果来源是 Player 类型（玩家的初始卡组），总是可以打出
        if (isPlayer(source)) {
            return true
        }

        // 如果来源是器官，检查是否损坏
        if (isOrgan(source)) {
            if (source.isDisabled) {
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
     * 获取所有卡牌（从所有来源）
     */
    getAllCards(): Card[] {
        const allCards: Card[] = []
        for (const cards of this.cardsFromSources.values()) {
            allCards.push(...cards)
        }
        return allCards
    }

    /**
     * 从牌组中移除单张卡牌（按 key 匹配）
     */
    removeCard(card: Card): boolean {
        for (const [, cards] of this.cardsFromSources) {
            const index = cards.findIndex(c => c.key === card.key)
            if (index >= 0) {
                cards.splice(index, 1)
                return true
            }
        }
        return false
    }

    /**
     * 转移当前归属：把 card 从其当前 source 挪到 newSource。
     * 不改 provider、owner、词条、牌堆。移植手术走这里。
     */
    transferCardOwnership(card: Card, newSource: Entity): boolean {
        let currentSource: Entity | undefined
        for (const [source, cards] of this.cardsFromSources) {
            if (cards.includes(card)) {
                currentSource = source
                break
            }
        }

        if (!currentSource) {
            newLog(["转移失败：卡牌", card, "未在任何来源下"])
            return false
        }

        if (currentSource === newSource) return true

        const oldCards = this.cardsFromSources.get(currentSource)!
        oldCards.splice(oldCards.indexOf(card), 1)
        if (oldCards.length === 0) {
            this.cardsFromSources.delete(currentSource)
        }

        if (!this.cardsFromSources.has(newSource)) {
            this.cardsFromSources.set(newSource, [])
        }
        this.cardsFromSources.get(newSource)!.push(card)

        card.source = newSource

        newLog(["卡牌", card, "归属从", currentSource, "转移到", newSource])
        return true
    }

    /**
     * 当前挂在这个来源上的卡（丢掉/损坏认这个）。移植后跟着新器官。
     */
    getCardsFromSource(source: Entity): Card[] {
        return this.cardsFromSources.get(source) || []
    }

    /**
     * 这个来源当初给出的卡（锻牌 / 改提供牌数值认这个）。移植不改。
     */
    getCardsFromProvider(provider: Entity): Card[] {
        const raw = toRaw(provider)
        const result: Card[] = []
        for (const cards of this.cardsFromSources.values()) {
            for (const card of cards) {
                if (toRaw(card.provider ?? card.source) === raw) result.push(card)
            }
        }
        return result
    }

    /**
     * 获取所有有来源的卡牌及其来源的映射
     */
    getAllSourcedCards(): Map<Entity, Card[]> {
        return new Map(this.cardsFromSources)
    }

    /**
     * 手牌自动弃牌：跳过带 "retain-on-turn-end" > 0 的卡，并对被保留的卡触发 retain 事件
     *
     * 保留判断走 status 而非直接查词条 —— 任何来源（card_retain 词条 / 效果 / 未来任意机制）
     * 只要给卡挂 "retain-on-turn-end" status 都能生效
     *
     * 事件顺序：先 retain（对保留下来的卡）再 discard（对剩下的卡）
     * retain 事件 effectUnits 为空，纯触发器容器
     *
     * @param source 触发事件的来源（通常是玩家自己）
     * @param player 手牌所属的玩家
     */
    discardHandOnTurnEnd(source: Entity, player: Player) {
        const handPile = player.cardPiles.handPile
        if (handPile.length === 0) return

        const retained: Card[] = []
        const cardsToDiscard: Card[] = []
        for (const card of handPile) {
            if (
                ifHaveStatus(card, "retain-on-turn-end") &&
                (getStatusValue(card, "retain-on-turn-end") as number) > 0
            ) {
                retained.push(card)
            } else {
                cardsToDiscard.push(card)
            }
        }

        if (retained.length > 0) {
            doEvent({
                key: "retain",
                source,
                medium: player,
                target: retained,
                effectUnits: []
            })
        }

        if (cardsToDiscard.length === 0) return

        doEvent({
            key: "discard",
            source,
            medium: player,
            target: cardsToDiscard,
            effectUnits: [{
                key: "discard",
                describe: ["回合结束丢弃手牌"],
                params: { sourcePileName: "handPile" }
            }]
        })
    }

    /**
     * 清理所有有来源的卡牌（用于战斗结束等场景）
     */
    clearAll() {
        for (const [_source, _cards] of this.cardsFromSources.entries()) {
            // 不需要从 player.cards 中移除，因为已经不存在了
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
const cardModifierMap = new WeakMap<Chara, CardModifier>()

/**
 * 为角色初始化卡牌修饰器管理器
 */
export function initCardModifier(chara: Chara): CardModifier {
    const rawChara = toRaw(chara)
    const modifier = new CardModifier(rawChara)
    cardModifierMap.set(rawChara, modifier)
    return modifier
}

/**
 * 获取角色的卡牌修饰器管理器
 */
export function getCardModifier(chara: Chara): CardModifier {
    const rawChara = toRaw(chara)
    let modifier = cardModifierMap.get(rawChara)
    if (!modifier) {
        modifier = initCardModifier(rawChara)
    }
    return modifier
}
