/**
 * 遗物过滤系统
 * 提供基于白名单、黑名单和稀有度权重的遗物选择功能
 */

import { RelicMap } from "@/core/objects/item/Subclass/Relic"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { randomWeightedChoices, randomChoices, randomChoicesWithReplacement } from "@/core/hooks/random"

/**
 * 遗物过滤配置
 */
export interface RelicFilterConfig {
    whitelist?: string[]        // 白名单（只允许这些遗物key）
    blacklist?: string[]        // 黑名单（排除这些遗物key）
    rarityWeights?: {           // 稀有度权重（3级系统）
        common?: number
        uncommon?: number
        rare?: number
    }
    count: number               // 选择数量
    allowDuplicates?: boolean   // 是否允许重复（默认 false）
}

/**
 * 根据配置选择遗物
 * @param config 过滤配置
 * @returns 选中的遗物配置数组
 */
export function selectRelicsWithFilter(config: RelicFilterConfig): RelicMap[] {
    // 1. 加载所有遗物
    const relicList = getLazyModule<RelicMap[]>('relicList')
    let availableRelics = [...relicList]

    // 2. 应用白名单过滤（如果有）
    if (config.whitelist && config.whitelist.length > 0) {
        availableRelics = availableRelics.filter(relic =>
            config.whitelist!.includes(relic.key)
        )
    }

    // 3. 应用黑名单过滤（如果有）
    if (config.blacklist && config.blacklist.length > 0) {
        availableRelics = availableRelics.filter(relic =>
            !config.blacklist!.includes(relic.key)
        )
    }

    // 4. 如果没有可用遗物，返回空数组
    if (availableRelics.length === 0) {
        console.warn("[RelicFilter] 没有可用的遗物")
        return []
    }

    // 5. 如果没有指定稀有度权重，随机选择
    if (!config.rarityWeights) {
        if (config.allowDuplicates) {
            // 允许重复：使用 randomChoicesWithReplacement
            return randomChoicesWithReplacement(availableRelics, config.count, "relicFilter:withDuplicates")
        } else {
            // 不允许重复：使用 randomChoices
            return randomChoices(availableRelics, config.count, "relicFilter:noDuplicates")
        }
    }

    // 6. 按稀有度权重选择
    const rarityWeights = {
        common: config.rarityWeights.common ?? 60,
        uncommon: config.rarityWeights.uncommon ?? 30,
        rare: config.rarityWeights.rare ?? 10
    }

    // 7. 按稀有度分组
    const relicsByRarity: Record<string, RelicMap[]> = {
        common: [],
        uncommon: [],
        rare: []
    }

    for (const relic of availableRelics) {
        const rarity = relic.rarity || "common"  // 默认为 common
        if (relicsByRarity[rarity]) {
            relicsByRarity[rarity].push(relic)
        }
    }

    // 8. 构建权重数组
    const items: RelicMap[] = []
    const weights: number[] = []

    for (const [rarity, relics] of Object.entries(relicsByRarity)) {
        const weight = rarityWeights[rarity as keyof typeof rarityWeights]
        for (const relic of relics) {
            items.push(relic)
            weights.push(weight)
        }
    }

    // 9. 如果没有可选项，返回空数组
    if (items.length === 0) {
        console.warn("[RelicFilter] 没有符合稀有度条件的遗物")
        return []
    }

    // 10. 使用权重随机选择
    if (config.allowDuplicates) {
        // 允许重复：多次调用 weightedChoice
        const selected: RelicMap[] = []
        for (let i = 0; i < config.count; i++) {
            const choices = randomWeightedChoices(items, weights, 1, `relicFilter:${i}`)
            if (choices.length > 0) {
                selected.push(choices[0])
            }
        }
        return selected
    } else {
        // 不允许重复：一次性选择
        const actualCount = Math.min(config.count, items.length)
        return randomWeightedChoices(items, weights, actualCount, "relicFilter")
    }
}

/**
 * 获取指定稀有度的所有遗物
 * @param rarity 稀有度
 * @returns 遗物配置数组
 */
export function getRelicsByRarity(rarity: "common" | "uncommon" | "rare"): RelicMap[] {
    const relicList = getLazyModule<RelicMap[]>('relicList')
    return relicList.filter(relic => (relic.rarity || "common") === rarity)
}

/**
 * 获取所有遗物的稀有度统计
 * @returns 稀有度统计对象
 */
export function getRelicRarityStats(): Record<string, number> {
    const relicList = getLazyModule<RelicMap[]>('relicList')
    const stats: Record<string, number> = {
        common: 0,
        uncommon: 0,
        rare: 0
    }

    for (const relic of relicList) {
        const rarity = relic.rarity || "common"
        stats[rarity] = (stats[rarity] || 0) + 1
    }

    return stats
}
