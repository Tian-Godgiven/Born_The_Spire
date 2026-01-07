import { Item, ItemMap } from "../Item";
import { Entity } from "../../system/Entity";
import { getRelicModifier } from "../../system/modifier/RelicModifier";

export type RelicMap = ItemMap & {
    // 未来可以添加遗物特有的属性，如稀有度、类型等
    // rarity?: "common" | "uncommon" | "rare" | "boss" | "shop"
    // type?: "normal" | "boss" | "event" | "shop"
}

/**
 * 遗物类
 *
 * 被遗落在荒凉高塔中，但仍然具备力量的奇物。
 * 能够在获取后的游戏全局中产生各种效果的强力道具，以被动效果为主，少数遗物能够主动使用。
 */
export class Relic extends Item {
    constructor(map: RelicMap) {
        super(map)
    }
}

/**
 * 获得遗物（包装函数）
 */
export function getRelic(entity: Entity, source: Entity, relic: Relic) {
    const relicModifier = getRelicModifier(entity)
    relicModifier.acquireRelic(relic, source)
}

/**
 * 失去遗物（包装函数）
 */
export function removeRelic(entity: Entity, relic: Relic, triggerLoseEffect: boolean = false) {
    const relicModifier = getRelicModifier(entity)
    relicModifier.loseRelic(relic, triggerLoseEffect)
}

/**
 * 使用遗物（包装函数）
 */
export function useRelic(entity: Entity, relic: Relic, targets: Entity[]) {
    const relicModifier = getRelicModifier(entity)
    return relicModifier.useRelic(relic, targets)
}

/**
 * 使遗物失效（包装函数）
 */
export function disableRelic(entity: Entity, relic: Relic) {
    const relicModifier = getRelicModifier(entity)
    return relicModifier.disableRelic(relic)
}

/**
 * 使遗物恢复（包装函数）
 */
export function enableRelic(entity: Entity, relic: Relic) {
    const relicModifier = getRelicModifier(entity)
    return relicModifier.enableRelic(relic)
}
