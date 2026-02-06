/**
 * 黑市物品池配置
 * 定义黑市中可以出现的器官、遗物、药水
 */

import type { OrganMap } from "@/static/list/target/organList"
import type { RelicMap } from "@/static/list/item/relicList"
import type { PotionMap } from "@/static/list/item/potionList"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { getContextRandom } from "@/core/hooks/random"

/**
 * 稀有度类型
 */
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary"

/**
 * 稀有度权重配置
 */
export interface RarityWeights {
    common?: number      // 普通（默认 100）
    uncommon?: number    // 罕见（默认 50）
    rare?: number        // 稀有（默认 20）
    epic?: number        // 史诗（默认 5）
    legendary?: number   // 传说（默认 1）
}

/**
 * 物品池配置
 */
export interface ItemPoolConfig<T> {
    items: T[]                      // 物品列表
    weights?: number[]              // 权重列表（可选，默认均等）
    rarityWeights?: RarityWeights   // 稀有度权重（可选）
    whitelist?: string[]            // 白名单（只允许这些 key）
    blacklist?: string[]            // 黑名单（排除这些 key）
}

/**
 * 黑市器官池
 * Mod 制作者可以添加自定义器官到此池中
 */
export const blackStoreOrganPool: ItemPoolConfig<OrganMap> = {
    items: [],
    weights: [],
    rarityWeights: {
        common: 100,
        uncommon: 50,
        rare: 20,
        epic: 5,
        legendary: 1
    }
}

/**
 * 黑市遗物池
 */
export const blackStoreRelicPool: ItemPoolConfig<RelicMap> = {
    items: [],
    weights: [],
    rarityWeights: {
        common: 100,
        uncommon: 50,
        rare: 20,
        epic: 5,
        legendary: 1
    }
}

/**
 * 黑市药水池
 */
export const blackStorePotionPool: ItemPoolConfig<PotionMap> = {
    items: [],
    weights: [],
    rarityWeights: {
        common: 100,
        uncommon: 50,
        rare: 20
    }
}

/**
 * 已出现的遗物记录（全局，跨黑市房间）
 */
const appearedRelics = new Set<string>()

/**
 * 重置已出现的遗物记录
 * 在新游戏开始时调用
 */
export function resetAppearedRelics(): void {
    appearedRelics.clear()
}

/**
 * 标记遗物已出现
 */
export function markRelicAsAppeared(relicKey: string): void {
    appearedRelics.add(relicKey)
}

/**
 * 检查遗物是否已出现
 */
export function hasRelicAppeared(relicKey: string): boolean {
    return appearedRelics.has(relicKey)
}

/**
 * 获取稀有度对应的权重
 */
function getRarityWeight(rarity: Rarity | undefined, rarityWeights?: RarityWeights): number {
    if (!rarity || !rarityWeights) return 1

    const defaultWeights: RarityWeights = {
        common: 100,
        uncommon: 50,
        rare: 20,
        epic: 5,
        legendary: 1
    }

    return rarityWeights[rarity] ?? defaultWeights[rarity] ?? 1
}

/**
 * 初始化黑市物品池
 * 从全局列表中加载物品
 */
export function initBlackStoreItemPools(): void {

    // 加载器官（使用懒加载）
    const organList = getLazyModule<OrganMap[]>('organList')
    blackStoreOrganPool.items = [...organList]
    // 根据稀有度设置权重
    blackStoreOrganPool.weights = organList.map(organ =>
        getRarityWeight(organ.rarity as Rarity, blackStoreOrganPool.rarityWeights)
    )

    // 加载遗物（使用懒加载）
    const relicList = getLazyModule<RelicMap[]>('relicList')
    blackStoreRelicPool.items = [...relicList]
    // 根据稀有度设置权重
    blackStoreRelicPool.weights = relicList.map(relic =>
        getRarityWeight(relic.rarity as Rarity, blackStoreRelicPool.rarityWeights)
    )

    // 加载药水（使用懒加载）
    const potionList = getLazyModule<PotionMap[]>('potionList')
    blackStorePotionPool.items = [...potionList]
    // 根据稀有度设置权重
    blackStorePotionPool.weights = potionList.map(potion =>
        getRarityWeight(potion.rarity as Rarity, blackStorePotionPool.rarityWeights)
    )

}


/**
 * 批量添加器官到黑市池
 * @param organs 器官配置数组
 * @param weight 统一权重（默认 1），或为每个器官指定权重的数组
 */
export function addOrgansToBlackStorePool(organs: OrganMap[], weight: number | number[] = 1): void {
    organs.forEach((organ, index) => {
        const w = Array.isArray(weight) ? (weight[index] ?? 1) : weight
        blackStoreOrganPool.items.push(organ)
        blackStoreOrganPool.weights?.push(w)
    })
}

/**
 * 批量添加遗物到黑市池
 */
export function addRelicsToBlackStorePool(relics: RelicMap[], weight: number | number[] = 1): void {
    relics.forEach((relic, index) => {
        const w = Array.isArray(weight) ? (weight[index] ?? 1) : weight
        blackStoreRelicPool.items.push(relic)
        blackStoreRelicPool.weights?.push(w)
    })
}

/**
 * 批量添加药水到黑市池
 */
export function addPotionsToBlackStorePool(potions: PotionMap[], weight: number | number[] = 1): void {
    potions.forEach((potion, index) => {
        const w = Array.isArray(weight) ? (weight[index] ?? 1) : weight
        blackStorePotionPool.items.push(potion)
        blackStorePotionPool.weights?.push(w)
    })
}

/**
 * 添加器官到黑市池
 * @param organ 器官配置
 * @param weight 权重（默认 1）
 */
export function addOrganToBlackStorePool(organ: OrganMap, weight: number = 1): void {
    blackStoreOrganPool.items.push(organ)
    blackStoreOrganPool.weights?.push(weight)
}

/**
 * 添加遗物到黑市池
 */
export function addRelicToBlackStorePool(relic: RelicMap, weight: number = 1): void {
    blackStoreRelicPool.items.push(relic)
    blackStoreRelicPool.weights?.push(weight)
}

/**
 * 添加药水到黑市池
 */
export function addPotionToBlackStorePool(potion: PotionMap, weight: number = 1): void {
    blackStorePotionPool.items.push(potion)
    blackStorePotionPool.weights?.push(weight)
}

/**
 * 设置黑市池的黑白名单
 */
export function setBlackStorePoolFilters(
    poolType: "organ" | "relic" | "potion",
    filters: { whitelist?: string[], blacklist?: string[] }
): void {
    const pool = poolType === "organ" ? blackStoreOrganPool :
                 poolType === "relic" ? blackStoreRelicPool :
                 blackStorePotionPool

    if (filters.whitelist) {
        pool.whitelist = filters.whitelist
    }
    if (filters.blacklist) {
        pool.blacklist = filters.blacklist
    }
}

/**
 * 应用黑白名单过滤
 */
function applyFilters<T extends { key: string }>(
    items: T[],
    whitelist?: string[],
    blacklist?: string[]
): T[] {
    let filtered = items

    // 应用白名单（如果存在）
    if (whitelist && whitelist.length > 0) {
        filtered = filtered.filter(item => whitelist.includes(item.key))
    }

    // 应用黑名单（如果存在）
    if (blacklist && blacklist.length > 0) {
        filtered = filtered.filter(item => !blacklist.includes(item.key))
    }

    return filtered
}

/**
 * 选择配置
 */
export interface SelectionConfig {
    rarityWeights?: RarityWeights           // 稀有度权重（覆盖池的默认权重）
    whitelist?: string[]                    // 白名单
    blacklist?: string[]                    // 黑名单
    uniqueConfig?: {                        // 不重复配置
        scope: "global" | "room"            // 范围
        roomAppearedSet?: Set<string>       // 房间级别的已出现集合
    }
}

/**
 * 根据权重随机选择物品
 * @param pool 物品池
 * @param count 选择数量
 * @param allowDuplicate 是否允许重复（默认 false）
 * @param context 随机数上下文
 * @param config 选择配置
 */
export function selectRandomItemsFromPool<T extends { key: string, rarity?: string }>(
    pool: ItemPoolConfig<T>,
    count: number,
    allowDuplicate: boolean = false,
    context: string = "blackStore",
    config?: SelectionConfig
): T[] {
    if (pool.items.length === 0) {
        return []
    }

    // 应用黑白名单过滤
    let availableItems = applyFilters(
        pool.items,
        config?.whitelist ?? pool.whitelist,
        config?.blacklist ?? pool.blacklist
    )

    // 如果启用了不重复配置
    if (config?.uniqueConfig) {
        if (config.uniqueConfig.scope === "global") {
            // 全局不重复：过滤掉已出现的物品
            availableItems = availableItems.filter(item => !hasRelicAppeared(item.key))
        } else if (config.uniqueConfig.scope === "room" && config.uniqueConfig.roomAppearedSet) {
            // 房间不重复：过滤掉本房间已出现的物品
            availableItems = availableItems.filter(item => !config.uniqueConfig!.roomAppearedSet!.has(item.key))
        }
    }

    if (availableItems.length === 0) {
        return []
    }

    const selected: T[] = []

    // 使用配置的稀有度权重或池的默认权重
    const rarityWeights = config?.rarityWeights ?? pool.rarityWeights

    // 为每个可用物品计算权重
    const itemWeights = availableItems.map(item => {
        const originalIndex = pool.items.indexOf(item)
        const baseWeight = pool.weights?.[originalIndex] ?? 1

        // 如果有稀有度权重配置，应用稀有度权重
        if (rarityWeights && item.rarity) {
            const rarityWeight = getRarityWeight(item.rarity as Rarity, rarityWeights)
            return baseWeight * rarityWeight
        }

        return baseWeight
    })

    // 创建可用索引列表
    let availableIndices = [...Array(availableItems.length).keys()]

    // 使用确定性随机数生成器
    const rng = getContextRandom(context)

    for (let i = 0; i < count; i++) {
        if (availableIndices.length === 0) {
            break
        }

        // 计算总权重
        const totalWeight = availableIndices.reduce((sum, idx) => sum + itemWeights[idx], 0)
        let random = rng.next() * totalWeight

        // 根据权重选择
        let selectedIndex = -1
        for (const idx of availableIndices) {
            random -= itemWeights[idx]
            if (random <= 0) {
                selectedIndex = idx
                break
            }
        }

        if (selectedIndex === -1) {
            selectedIndex = availableIndices[availableIndices.length - 1]
        }

        const selectedItem = availableItems[selectedIndex]
        selected.push(selectedItem)

        // 如果启用了不重复配置，标记为已出现
        if (config?.uniqueConfig) {
            if (config.uniqueConfig.scope === "global") {
                markRelicAsAppeared(selectedItem.key)
            } else if (config.uniqueConfig.scope === "room" && config.uniqueConfig.roomAppearedSet) {
                config.uniqueConfig.roomAppearedSet.add(selectedItem.key)
            }
        }

        // 如果不允许重复，移除已选择的索引
        if (!allowDuplicate) {
            const indexInAvailable = availableIndices.indexOf(selectedIndex)
            if (indexInAvailable > -1) {
                availableIndices.splice(indexInAvailable, 1)
            }
        }
    }

    return selected
}
