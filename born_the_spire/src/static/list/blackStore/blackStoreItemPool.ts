/**
 * 黑市物品池配置
 * 定义黑市中可以出现的器官、遗物、药水
 */

import { OrganMap } from "@/static/list/target/organList"
import { RelicMap } from "@/static/list/item/relicList"
import { PotionMap } from "@/static/list/item/potionList"

/**
 * 物品池配置
 */
export interface ItemPoolConfig<T> {
    items: T[]                      // 物品列表
    weights?: number[]              // 权重列表（可选，默认均等）
}

/**
 * 黑市器官池
 * Mod 制作者可以添加自定义器官到此池中
 */
export const blackStoreOrganPool: ItemPoolConfig<OrganMap> = {
    items: [],
    weights: []
}

/**
 * 黑市遗物池
 */
export const blackStoreRelicPool: ItemPoolConfig<RelicMap> = {
    items: [],
    weights: []
}

/**
 * 黑市药水池
 */
export const blackStorePotionPool: ItemPoolConfig<PotionMap> = {
    items: [],
    weights: []
}

/**
 * 初始化黑市物品池
 * 从全局列表中加载物品
 */
export function initBlackStoreItemPools(): void {
    console.log("[BlackStorePool] 开始初始化黑市物品池")

    // 加载器官
    const { organList } = require("@/static/list/target/organList")
    blackStoreOrganPool.items = [...organList]
    blackStoreOrganPool.weights = new Array(organList.length).fill(1)

    // 加载遗物
    const { relicList } = require("@/static/list/item/relicList")
    blackStoreRelicPool.items = [...relicList]
    blackStoreRelicPool.weights = new Array(relicList.length).fill(1)

    // 加载药水
    const { potionList } = require("@/static/list/item/potionList")
    blackStorePotionPool.items = [...potionList]
    blackStorePotionPool.weights = new Array(potionList.length).fill(1)

    console.log(`[BlackStorePool] 器官池: ${blackStoreOrganPool.items.length} 个`)
    console.log(`[BlackStorePool] 遗物池: ${blackStoreRelicPool.items.length} 个`)
    console.log(`[BlackStorePool] 药水池: ${blackStorePotionPool.items.length} 个`)
}

/**
 * 添加器官到黑市池
 * @param organ 器官配置
 * @param weight 权重（默认 1）
 */
export function addOrganToBlackStorePool(organ: OrganMap, weight: number = 1): void {
    blackStoreOrganPool.items.push(organ)
    blackStoreOrganPool.weights?.push(weight)
    console.log(`[BlackStorePool] 添加器官到黑市池: ${organ.label}`)
}

/**
 * 添加遗物到黑市池
 */
export function addRelicToBlackStorePool(relic: RelicMap, weight: number = 1): void {
    blackStoreRelicPool.items.push(relic)
    blackStoreRelicPool.weights?.push(weight)
    console.log(`[BlackStorePool] 添加遗物到黑市池: ${relic.label}`)
}

/**
 * 添加药水到黑市池
 */
export function addPotionToBlackStorePool(potion: PotionMap, weight: number = 1): void {
    blackStorePotionPool.items.push(potion)
    blackStorePotionPool.weights?.push(weight)
    console.log(`[BlackStorePool] 添加药水到黑市池: ${potion.label}`)
}

/**
 * 根据权重随机选择物品
 * @param pool 物品池
 * @param count 选择数量
 * @param allowDuplicate 是否允许重复（默认 false）
 */
export function selectRandomItemsFromPool<T>(
    pool: ItemPoolConfig<T>,
    count: number,
    allowDuplicate: boolean = false
): T[] {
    if (pool.items.length === 0) {
        return []
    }

    const selected: T[] = []
    const availableIndices = [...Array(pool.items.length).keys()]
    const weights = pool.weights || new Array(pool.items.length).fill(1)

    for (let i = 0; i < count; i++) {
        if (availableIndices.length === 0) {
            break
        }

        // 计算总权重
        const totalWeight = availableIndices.reduce((sum, idx) => sum + weights[idx], 0)
        let random = Math.random() * totalWeight

        // 根据权重选择
        let selectedIndex = -1
        for (const idx of availableIndices) {
            random -= weights[idx]
            if (random <= 0) {
                selectedIndex = idx
                break
            }
        }

        if (selectedIndex === -1) {
            selectedIndex = availableIndices[availableIndices.length - 1]
        }

        selected.push(pool.items[selectedIndex])

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
