/**
 * 向指定牌堆添加卡牌
 *
 * @params {
 *   count: number              - 添加数量
 *   cardKey?: string           - 指定卡牌 key；给出时跳过随机筛选，直接加 count 张该卡
 *   tags?: string | string[]   - 筛选标签（如 "skill"）
 *   pool?: string | string[]   - 筛选池（默认 "common"）
 *   cost?: number              - 筛选卡牌费用（按 status.cost.base 精确匹配）
 *   pileName?: string          - 目标牌堆（默认 "drawPile"）
 *   overrideCost?: number      - 覆盖卡牌费用（通过修饰器实现，保留原始值）
 * }
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Player } from "@/core/objects/target/Player"
import { drawItem } from "@/core/hooks/draw"
import { getCardByKey } from "@/static/list/item/cardList"
import type { CardPiles } from "@/core/objects/target/Player"
import { washPile } from "."

export const addRandomCardsToPile: EffectFunc = async (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!(target instanceof Player)) return

    const {
        count = 1,
        cardKey,
        tags,
        pool,
        cost,
        pileName = "drawPile",
        overrideCost
    } = effect.params

    const pile = target.cardPiles[pileName as keyof CardPiles]
    if (!pile) return

    const exclude: string[] = []

    for (let i = 0; i < Number(count); i++) {
        let resolvedKey: string | undefined = cardKey ? String(cardKey) : undefined
        if (!resolvedKey) {
            const cardMap = drawItem("card", {
                tags: tags as string | string[] | undefined,
                pool: pool as string | string[] | undefined,
                cost: cost !== undefined ? Number(cost) : undefined,
                exclude,
                context: `addRandomCards:${i}`
            })
            if (!cardMap) break
            resolvedKey = cardMap.key
        }

        const card = await getCardByKey(resolvedKey)
        if (!card) continue

        // 通过 function 修饰器覆盖费用，保留原始 base value
        if (overrideCost !== undefined && card.status?.["cost"]) {
            const overrideValue = Number(overrideCost)
            card.status["cost"].addByJSON(event.source, {
                targetLayer: "base",
                modifierType: "function",
                modifierValue: overrideValue,
                modifierFunc: (_owner, _currentValue, value) => value,
                clearable: false
            })
        }

        pile.push(card)
    }

    // 洗牌
    washPile(pile)
}
