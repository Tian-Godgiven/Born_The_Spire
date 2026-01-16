import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Card } from "@/core/objects/item/Subclass/Card"
import { Player } from "@/core/objects/target/Player"
import { cardMove } from "@/core/effects/card"
import { getEntryModifier } from "@/core/objects/system/modifier/EntryModifier"

/**
 * 虚无词条效果：若卡牌在手牌中，则移入消耗堆
 */
export const voidExhaust: EffectFunc = (event, effect) => {
    const { source, target } = event

    // 只有玩家对象具备卡牌
    if (!(source instanceof Player)) return
    // 目标必须是卡牌
    if (!(target instanceof Card)) return

    const player = source
    const card = target

    // 检查卡牌是否在手牌中
    const inHand = player.cardPiles.handPile.includes(card)
    if (!inHand) return  // 不在手牌中，不执行

    // 移动到消耗堆
    cardMove(player.cardPiles.handPile, card, player.cardPiles.exhaustPile)
}

/**
 * 固有词条效果：将所有固有卡牌移入手牌
 */
export const moveInherentToHand: EffectFunc = (event, effect) => {
    const { target } = event

    // 只有玩家对象具备卡牌
    if (!(target instanceof Player)) {
        return
    }

    const player = target
    const drawPile = player.cardPiles.drawPile

    // 遍历抽牌堆，找到所有固有卡牌并移到手牌
    // 需要倒序遍历，因为移动卡牌会改变数组
    for (let i = drawPile.length - 1; i >= 0; i--) {
        const card = drawPile[i]
        const entryModifier = getEntryModifier(card)

        if (entryModifier.hasEntry("inherent")) {
            // 将固有卡牌移到手牌
            cardMove(drawPile, card, player.cardPiles.handPile)
        }
    }
}
