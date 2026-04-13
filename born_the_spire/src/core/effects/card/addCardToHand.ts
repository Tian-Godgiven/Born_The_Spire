/**
 * 向指定目标的手牌添加卡牌
 *
 * 用于从卡牌 key 获取卡牌实例并添加到 hand pile
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { newLog } from "@/ui/hooks/global/log"
import { getCardByKey } from "@/static/list/item/cardList"
import { isEnemy, isEntity, isPlayer } from "@/core/utils/typeGuards"
import type { Player } from "@/core/objects/target/Player"
import { enterHand } from "."

/**
 * 向指定目标的手牌添加卡牌
 *
 * @param effect.params.cardKey - 卡牌 key
 * @param effect.params.count   - 添加数量，默认 1
 * @param effect.params.target  - 目标对象（可选，不指定则使用 event.target）
 *
 * 卡牌会被添加到目标的 handPile
 */
export const addCardToHand: EffectFunc = async (event, effect) => {
    const params = effect.params || {}
    const cardKey = String(params.cardKey)
    const count = Number(params.count ?? 1)

    if (!cardKey) {
        console.error("[addCardToHand] 缺少必要参数 cardKey", effect.params)
        return
    }

    if (count <= 0) {
        console.warn("[addCardToHand] count 必须大于 0", count)
        return
    }

    // 确定目标（优先使用 params.target，否则用 event.target）
    let target = event.target
    if (params.target && isEntity(params.target)) {
        target = params.target
    }

    if (Array.isArray(target)) {
        console.error("[addCardToHand] target 不能是数组")
        return
    }

    if (!isEntity(target)) {
        console.error("[addCardToHand] target 必须是实体")
        return
    }

    // 检查是否是 Player 或 Enemy 类型
    if (!(isPlayer(target)) && !(isEnemy(target))) {
        console.error("[addCardToHand] target 必须是 Player 或 Enemy")
        return
    }

    // 获取卡牌实例并添加（每次都创建新实例）
    const targetAny = target as any
    if (!targetAny.cardPiles) {
        console.error("[addCardToHand] 目标没有 cardPiles")
        return
    }

    for (let i = 0; i < count; i++) {
        const card = await getCardByKey(cardKey)
        if (!card) {
            console.error("[addCardToHand] 未找到卡牌", cardKey)
            return
        }
        enterHand(card, targetAny.cardPiles.handPile, target)
    }

    newLog([target, `获得了 ${count} 张卡牌`, cardKey])
}
