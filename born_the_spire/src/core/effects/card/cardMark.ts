import type { Card } from "@/core/objects/item/Subclass/Card"
import type { Entity } from "@/core/objects/system/Entity"

/**
 * 写在卡牌实例上的展示用标记（现行：口香糖选中的那张）。
 * 不参与结算，也不改卡牌描述。只在卡组悬停时用来弹出遗物。
 */
export type CardMark = {
    sourceId: string
    relicKeys: string[]
}

export function normalizeRelicKeys(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map(item => String(item)).filter(key => key.length > 0)
    }
    if (typeof value === "string" && value.length > 0) return [value]
    return []
}

function marksOf(card: Card): CardMark[] {
    if (!card._cardMarks) card._cardMarks = []
    return card._cardMarks
}

export function addCardMark(card: Card, mark: CardMark) {
    const list = marksOf(card)
    const index = list.findIndex(item => item.sourceId === mark.sourceId)
    if (index >= 0) list[index] = mark
    else list.push(mark)
}

export function removeCardMarksFromSource(card: Card, sourceId: string) {
    if (!card._cardMarks || card._cardMarks.length === 0) return
    card._cardMarks = card._cardMarks.filter(item => item.sourceId !== sourceId)
}

export function getCardMarkRelicKeys(card: Card): string[] {
    const list = card._cardMarks
    if (!list || list.length === 0) return []
    const seen = new Set<string>()
    const keys: string[] = []
    for (const mark of list) {
        for (const key of mark.relicKeys ?? []) {
            if (!key || seen.has(key)) continue
            seen.add(key)
            keys.push(key)
        }
    }
    return keys
}

function collectCardsFromOwner(owner: Entity): Card[] {
    const seen = new Set<string>()
    const out: Card[] = []
    const add = (card: Card | undefined) => {
        if (!card?.__id || seen.has(card.__id)) return
        seen.add(card.__id)
        out.push(card)
    }

    const getCardGroup = (owner as { getCardGroup?: () => Card[] }).getCardGroup
    if (typeof getCardGroup === "function") {
        for (const card of getCardGroup.call(owner) ?? []) add(card)
    }

    const piles = (owner as { cardPiles?: Record<string, Card[]> }).cardPiles
    if (piles) {
        for (const name of ["handPile", "drawPile", "discardPile", "exhaustPile"] as const) {
            for (const card of piles[name] ?? []) add(card)
        }
    }

    return out
}

export function findOwnedCardById(owner: Entity, cardId: string): Card | null {
    if (!cardId) return null
    return collectCardsFromOwner(owner).find(card => card.__id === cardId) ?? null
}

/** 物品失去时清掉它写在牌上的展示标记。 */
export function clearCardMarksFromSource(source: Entity, owner: Entity) {
    const sourceId = source.__id
    if (!sourceId) return
    for (const card of collectCardsFromOwner(owner)) {
        removeCardMarksFromSource(card, sourceId)
    }
}
