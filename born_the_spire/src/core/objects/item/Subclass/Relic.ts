import { Item } from "../Item";
import type { ItemMap } from "../Item";
import { Entity } from "../../system/Entity";
import { getRelicModifier } from "../../system/modifier/RelicModifier";
import type { LogUnit } from "@/ui/hooks/global/log";
import type { ActiveAbility } from "@/core/types/ActiveAbility";
import type { BadgeConfig } from "@/core/types/BadgeConfig";

export type RelicMap = ItemMap & {
    // 遗物稀有度（3级系统）
    rarity?: "common" | "uncommon" | "rare"
    // 是否为商店限定遗物（仅在黑市出现，不会在普通奖励中掉落）
    storeOnly?: boolean
    // 主动能力配置
    activeAbilities?: ActiveAbility[]
    // 角标配置
    badges?: BadgeConfig[]
}

/**
 * 遗物类
 *
 * 被遗落在荒凉高塔中，但仍然具备力量的奇物。
 * 能够在获取后的游戏全局中产生各种效果的强力道具，以被动效果为主，少数遗物能够主动使用。
 */
export class Relic extends Item {
    public readonly itemType = 'relic' as const  // 类型标识
    public rarity?: "common" | "uncommon" | "rare"  // 遗物稀有度
    public storeOnly?: boolean  // 是否为商店限定
    public activeAbilities?: ActiveAbility[]  // 主动能力列表
    public badges?: BadgeConfig[]  // 角标配置

    constructor(map: RelicMap) {
        super(map)
        this.rarity = map.rarity
        this.storeOnly = map.storeOnly
        this.activeAbilities = map.activeAbilities
        this.badges = map.badges
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
export function removeRelic(entity: Entity, relic: Relic, parentLog?: LogUnit) {
    const relicModifier = getRelicModifier(entity)
    relicModifier.loseRelic(relic, parentLog)
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
