import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Player } from "@/core/objects/target/Player"
import { showCardChoice } from "@/ui/hooks/interaction/cardChoice"
import type { Card } from "@/core/objects/item/Subclass/Card"
import { Entity } from "@/core/objects/system/Entity"
import { appendStatus, createStatusFromMap, ifHaveStatus } from "@/core/objects/system/status/Status"

/**
 * 弹卡牌选择框，把选中卡的 __id 记到 event.medium（通常是物品自身）的 status 上。
 * 后续可通过 $owner.status(storeKey) 读回。
 * 若 storeKey 对应的 status 未预声明，会自动创建为隐藏的字符串型 status（不显示为徽章）。
 *
 * params:
 *   title:string            弹窗标题
 *   description?:string     弹窗说明
 *   fromPile?:string        deck / handPile / drawPile / discardPile / exhaustPile（默认 deck）
 *   storeKey:string         写到 event.medium.status 上的属性名
 */
export const chooseAndMarkCard: EffectFunc = async (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    const item = event.medium
    if (!(target instanceof Player) || !(item instanceof Entity)) return false

    const { title, description, fromPile = "deck", storeKey } = effect.params
    if (!storeKey) return false
    const key = String(storeKey)

    let cards: Card[]
    if (fromPile === "deck") {
        cards = target.getCardGroup()
    } else {
        const pileName = String(fromPile)
        cards = (target as any).cardPiles?.[pileName] ?? []
    }
    if (cards.length === 0) return false

    const selected = await showCardChoice({
        title: String(title ?? "选择一张牌"),
        description: description ? String(description) : undefined,
        cards,
        minSelect: 1,
        maxSelect: 1,
        cancelable: false
    })
    if (selected.length === 0) return false

    if (!ifHaveStatus(item, key)) {
        const status = createStatusFromMap(item, key, {
            label: key,
            value: "",
            hidden: true,
            display: false,
            calc: false
        })
        appendStatus(item, status)
    }
    item.status[key].setOriginalBaseValue(String(selected[0].__id))
    return true
}
