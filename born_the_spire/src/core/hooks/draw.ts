/**
 * 物品抽选工具
 * 从全局物品列表或自定义列表中，按条件筛选并随机抽取物品
 */

import { getLazyModule } from "@/core/utils/lazyLoader"
import { randomWeightedChoice, randomChoice } from "@/core/hooks/random"
import type { ItemMap } from "@/core/objects/item/Item"

/**
 * 物品类型
 */
export type DrawItemType = "relic" | "card" | "organ" | "potion" | "custom"

/**
 * 抽选配置
 */
export interface DrawConfig {
    pool?: string | string[]            // 限定池（如 "shop"、["shop", "common"]）
    rarity?: string | string[]          // 限定稀有度（如 "rare"、["uncommon", "rare"]）
    tags?: string | string[]            // 限定标签（如 "attack"、["attack", "skill"]）
    exclude?: string[]                  // 排除的key列表（防重复）
    rarityWeights?: Record<string, number>  // 稀有度权重（如 { common: 70, uncommon: 25, rare: 5 }）
    context?: string                    // 随机数上下文
}

/**
 * 懒加载模块名映射
 */
const typeToModule: Record<string, string> = {
    relic: "relicList",
    card: "cardList",
    organ: "organList",
    potion: "potionList",
}

/**
 * 将字符串或字符串数组统一为数组
 */
function toArray(value?: string | string[]): string[] {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
}

/**
 * 获取物品列表
 */
function getItemList(type: DrawItemType, customList?: ItemMap[]): ItemMap[] {
    if (type === "custom") {
        return customList ?? []
    }
    const moduleName = typeToModule[type]
    if (!moduleName) return []
    return getLazyModule<ItemMap[]>(moduleName)
}

/**
 * 获取物品的实际 pool（未定义视为 ["common"]）
 */
function getItemPool(item: ItemMap): string[] {
    const pool = (item as any).pool as string[] | undefined
    return (pool && pool.length > 0) ? pool : ["common"]
}

/**
 * 按条件过滤物品列表
 */
function filterItems(items: ItemMap[], config: DrawConfig): ItemMap[] {
    let filtered = items

    // 按 pool 过滤（未指定时默认筛选 "common"）
    const pools = toArray(config.pool)
    const targetPools = pools.length > 0 ? pools : ["common"]
    filtered = filtered.filter(item =>
        getItemPool(item).some(p => targetPools.includes(p))
    )

    // 按稀有度过滤
    const rarities = toArray(config.rarity)
    if (rarities.length > 0) {
        filtered = filtered.filter(item => {
            const rarity = (item as any).rarity as string | undefined
            return rarity ? rarities.includes(rarity) : false
        })
    }

    // 按标签过滤
    const tags = toArray(config.tags)
    if (tags.length > 0) {
        filtered = filtered.filter(item => {
            const itemTags = (item as any).tags as string[] | undefined
            return itemTags?.some(t => tags.includes(t)) ?? false
        })
    }

    // 排除已抽到的
    if (config.exclude && config.exclude.length > 0) {
        filtered = filtered.filter(item => !config.exclude!.includes(item.key))
    }

    return filtered
}

/**
 * 从物品列表中按条件抽取一个物品
 *
 * @param type - 物品类型，或 "custom" 使用自定义列表
 * @param config - 抽选配置
 * @param customList - 自定义列表（仅 type 为 "custom" 时使用）
 * @returns 抽中的物品，无可选项时返回 null
 *
 * @example
 * // 抽一个商店遗物
 * drawItem("relic", { pool: "shop" })
 *
 * // 抽一个罕见以上遗物
 * drawItem("relic", { rarity: ["uncommon", "rare"] })
 *
 * // 从通用池按权重抽遗物
 * drawItem("relic", { rarityWeights: { common: 70, uncommon: 25, rare: 5 } })
 *
 * // 从自定义列表抽
 * drawItem("custom", { rarity: "rare" }, myList)
 */
export function drawItem(
    type: DrawItemType,
    config: DrawConfig = {},
    customList?: ItemMap[]
): ItemMap | null {
    const items = getItemList(type, customList)
    const filtered = filterItems(items, config)

    if (filtered.length === 0) return null

    // 如果有稀有度权重，按权重抽
    if (config.rarityWeights) {
        const weights = filtered.map(item => {
            const rarity = (item as any).rarity as string | undefined
            return rarity ? (config.rarityWeights![rarity] ?? 1) : 1
        })
        return randomWeightedChoice(filtered, weights, config.context ?? `draw:${type}`)
    }

    // 否则均等随机
    return randomChoice(filtered, config.context ?? `draw:${type}`)
}

/**
 * 从物品列表中按条件抽取多个物品（不重复）
 *
 * @param type - 物品类型
 * @param count - 抽取数量
 * @param config - 抽选配置
 * @param customList - 自定义列表
 * @returns 抽中的物品数组
 *
 * @example
 * // 抽3个通用遗物
 * drawItems("relic", 3, { rarityWeights: { common: 70, uncommon: 25, rare: 5 } })
 */
export function drawItems(
    type: DrawItemType,
    count: number,
    config: DrawConfig = {},
    customList?: ItemMap[]
): ItemMap[] {
    const result: ItemMap[] = []
    const exclude = [...(config.exclude ?? [])]

    for (let i = 0; i < count; i++) {
        const item = drawItem(type, { ...config, exclude, context: config.context ?? `draw:${type}:${i}` }, customList)
        if (!item) break
        result.push(item)
        exclude.push(item.key)
    }

    return result
}
