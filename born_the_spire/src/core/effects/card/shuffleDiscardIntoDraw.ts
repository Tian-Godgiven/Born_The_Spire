/**
 * 将弃牌堆洗入抽牌堆
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { getActingPlayer } from "@/core/utils/typeGuards"

export const shuffleDiscardIntoDraw: EffectFunc = (event, effect) => {
    const player = getActingPlayer(event.source, event.target)
    if (!player) return

    if (player.cardPiles.discardPile.length === 0) return

    player.fillDrawPile()
}
