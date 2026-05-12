/**
 * 向指定牌堆添加随机卡牌
 *
 * @params {
 *   count: number              - 添加数量
 *   tags?: string | string[]   - 筛选标签（如 "skill"）
 *   pool?: string | string[]   - 筛选池（默认 "common"）
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
        tags,
        pool,
        pileName = "drawPile",
        overrideCost
    } = effect.params

    const pile = target.cardPiles[pileName as keyof CardPiles]
    if (!pile) return

    const exclude: string[] = []

    for (let i = 0; i < Number(count); i++) {
        const cardMap = drawItem("card", {
            tags: tags as string | string[] | undefined,
            pool: pool as string | string[] | undefined,
            exclude,
            context: `addRandomCards:${i}`
        })

        if (!cardMap) break

        const card = await getCardByKey(cardMap.key)
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
