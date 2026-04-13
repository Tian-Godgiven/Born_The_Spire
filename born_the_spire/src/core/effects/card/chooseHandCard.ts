/**
 * 从手牌选择卡牌（使用战斗内手牌选择器UI）
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Player } from "@/core/objects/target/Player"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { selectFromHand } from "@/ui/hooks/interaction/handCardSelector"

/**
 * 从手牌选择卡牌丢弃
 *
 * @params {
 *   count?: number - 需要选择的数量（默认1）
 *   cancelable?: boolean - 是否可取消（默认false）
 * }
 */
export const chooseHandCardDiscard: EffectFunc = async (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!(target instanceof Player)) return

    const count = Number(effect.params.count ?? 1)
    const cancelable = Boolean(effect.params.cancelable ?? false)

    const selectedCards = await selectFromHand({
        title: `选择${count}张卡牌来丢弃`,
        minSelect: count,
        maxSelect: count,
        cancelable,
        event
    })

    if (selectedCards.length === 0) return

    for (const card of selectedCards) {
        await doEvent({
            key: "discard",
            source: target,
            medium: target,
            target: card,
            effectUnits: [{
                key: "discard",
                params: { sourcePileName: "handPile" }
            }]
        })
    }
}
