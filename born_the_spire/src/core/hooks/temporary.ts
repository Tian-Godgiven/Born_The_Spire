import type { Card } from "@/core/objects/item/Subclass/Card"
import type { Organ } from "@/core/objects/target/Organ"
import type { Player } from "@/core/objects/target/Player"
import type { Entity } from "@/core/objects/system/Entity"
import { temporaryManager } from "@/core/objects/system/TemporaryManager"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { createCard, createOrgan } from "@/core/factories"
import { getOrgan } from "@/core/objects/target/Organ"

/**
 * 创建临时卡牌并添加到玩家手牌
 * @param cardKey 卡牌key
 * @param player 玩家
 * @param removeOn 移除时机
 * @returns 创建的临时卡牌
 */
export async function addTemporaryCard(
    cardKey: string,
    player: Player,
    removeOn: "battleEnd" | "turnEnd" | "floorEnd" = "battleEnd"
): Promise<Card> {
    const cardList = getLazyModule('cardList') as Record<string, any>
    const cardMap = cardList[cardKey]

    if (!cardMap) {
        throw new Error(`[addTemporaryCard] 未找到卡牌: ${cardKey}`)
    }

    // 使用工厂创建卡牌实例
    const card = await createCard(cardMap)
    card.isTemporary = true
    card.temporaryRemoveOn = removeOn
    card.setOwner(player, cardMap.entry)

    // 添加到手牌
    player.cardPiles.handPile.push(card)

    // 注册到临时管理器
    temporaryManager.registerTemporary(card, player)

    return card
}

/**
 * 创建临时器官并添加到实体
 * @param organKey 器官key
 * @param owner 持有者
 * @param removeOn 移除时机
 * @returns 创建的临时器官
 */
export async function addTemporaryOrgan(
    organKey: string,
    owner: Entity,
    removeOn: "battleEnd" | "turnEnd" | "floorEnd" = "battleEnd"
): Promise<Organ> {
    const organList = getLazyModule('organList') as Record<string, any>
    const organMap = organList[organKey]

    if (!organMap) {
        throw new Error(`[addTemporaryOrgan] 未找到器官: ${organKey}`)
    }

    // 使用工厂创建器官实例
    const organ = await createOrgan(organMap)
    organ.isTemporary = true
    organ.temporaryRemoveOn = removeOn

    // 使用现有的器官获得逻辑
    getOrgan(owner, owner, organ) // source设为owner自己

    // 注册到临时管理器
    temporaryManager.registerTemporary(organ, owner)

    return organ
}

/**
 * 将现有卡牌标记为临时
 * @param card 卡牌
 * @param owner 持有者
 * @param removeOn 移除时机
 */
export function markCardAsTemporary(
    card: Card,
    owner: Entity,
    removeOn: "battleEnd" | "turnEnd" | "floorEnd" = "battleEnd"
) {
    if (card.isTemporary) {
        console.warn(`[markCardAsTemporary] 卡牌 ${card.label} 已经是临时的`)
        return
    }

    card.isTemporary = true
    card.temporaryRemoveOn = removeOn

    // 注册到临时管理器
    temporaryManager.registerTemporary(card, owner)

}

/**
 * 将现有器官标记为临时
 * @param organ 器官
 * @param owner 持有者
 * @param removeOn 移除时机
 */
export function markOrganAsTemporary(
    organ: Organ,
    owner: Entity,
    removeOn: "battleEnd" | "turnEnd" | "floorEnd" = "battleEnd"
) {
    if (organ.isTemporary) {
        console.warn(`[markOrganAsTemporary] 器官 ${organ.label} 已经是临时的`)
        return
    }

    organ.isTemporary = true
    organ.temporaryRemoveOn = removeOn

    // 注册到临时管理器
    temporaryManager.registerTemporary(organ, owner)

}

/**
 * 移除临时标记（将临时物品变为永久）
 * @param item 物品
 */
export async function makeItemPermanent(item: Card | Organ) {
    if (!item.isTemporary) {
        console.warn(`[makeItemPermanent] 物品 ${item.label} 不是临时的`)
        return
    }

    item.isTemporary = false
    item.temporaryRemoveOn = undefined

    // 从临时管理器中移除（但不删除物品本身）
    await temporaryManager.removeItem(item)

}

/**
 * 检查物品是否为临时
 * @param item 物品
 * @returns 是否为临时
 */
export function isTemporary(item: Card | Organ): boolean {
    return item.isTemporary
}

/**
 * 获取所有临时物品
 * @returns 临时物品列表
 */
export function getAllTemporaryItems(): (Card | Organ)[] {
    return temporaryManager.getTemporaryItems()
}