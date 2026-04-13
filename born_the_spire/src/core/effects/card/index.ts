import { Card } from "@/core/objects/item/Subclass/Card"
import { newError } from "@/ui/hooks/global/alert"
import { shuffle } from "lodash"
import * as addTemporaryEffect from "./addTemporaryEffect"
import type { Entity } from "@/core/objects/system/Entity"

// ==================== 手牌进出的底层操作 ====================

/**
 * 卡牌进入手牌（所有加入手牌的操作都应走这里）
 */
export function enterHand(card: Card, handPile: Card[], owner: Entity) {
    handPile.push(card)
    card.mountInHand(owner)
}

/**
 * 卡牌离开手牌（所有离开手牌的操作都应走这里）
 */
export function leaveHand(card: Card, handPile: Card[]) {
    const index = handPile.findIndex(c => c.__id === card.__id)
    if (index >= 0) {
        handPile.splice(index, 1)
    }
    card.unmountInHand()
}

// ==================== 通用牌堆操作 ====================

/**
 * 将卡牌从一个牌堆放到另一个牌堆
 *
 * @param from 来源牌堆
 * @param card 目标卡牌
 * @param to 目标牌堆
 * @param handContext 手牌上下文（当 from 或 to 是手牌时必须提供）
 */
export function cardMove(
    from: Card[],
    card: Card,
    to: Card[],
    handContext?: { handPile: Card[], owner: Entity }
) {
    if (!card) { newError(["没有指定移动的卡牌！"]) }
    if (!from || !to) { newError(["没有指定来源牌堆或目标牌堆！"]) }

    const index = from.findIndex(tmp => tmp.__id == card.__id)
    if (index >= 0) {
        const handPile = handContext?.handPile
        const isLeavingHand = handPile && from === handPile
        const isEnteringHand = handPile && to === handPile

        // 离开来源牌堆
        if (isLeavingHand) {
            from.splice(index, 1)
            card.unmountInHand()
        } else {
            from.splice(index, 1)
        }

        // 进入目标牌堆
        if (isEnteringHand) {
            enterHand(card, to, handContext!.owner)
        } else {
            to.push(card)
        }

        return true
    }

    newError(["没有在来源牌堆找到目标卡牌！"])
}

//打乱牌堆
export function washPile(pile:Card[]){
    const newPiles = shuffle(pile);
    pile.length = 0;
    pile.push(...newPiles)
}

// 导出临时效果相关函数
export { addTemporaryEffect }
