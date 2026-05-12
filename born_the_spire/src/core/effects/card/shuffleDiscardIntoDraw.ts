/**
 * 将弃牌堆洗入抽牌堆
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Player } from "@/core/objects/target/Player"

export const shuffleDiscardIntoDraw: EffectFunc = (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!(target instanceof Player)) return

    const discardPile = target.cardPiles.discardPile
    if (discardPile.length === 0) return

    target.fillDrawPile()
}
