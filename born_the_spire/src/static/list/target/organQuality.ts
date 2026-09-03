/**
 * 器官稀有度系统
 */

import { applyVariance } from "@/core/hooks/variance"
import { OrganRarity } from "@/core/types/OrganTypes"
import type { RarityConfig } from "@/core/types/OrganTypes"
import { getRarityColor, getRarityLabel } from "@/static/list/system/rarityPalette"

/** 打开升级列表时默认波动 */
const DEFAULT_UPGRADE_VARIANCE = 0.1

/**
 * 稀有度配置列表
 */
export const qualityConfigList: RarityConfig[] = [
    {
        key: OrganRarity.Common,
        label: getRarityLabel(OrganRarity.Common),
        color: getRarityColor(OrganRarity.Common),
        baseAbsorbValue: 20,        // 吞噬获得 20 物质
        upgradeCostMultiplier: 1.1, // 升级消耗 110% 吞噬获取量
        upgradeVariance: DEFAULT_UPGRADE_VARIANCE,
        repairCostMultiplier: 0.6,  // 修复消耗 60% 吞噬获取量
        assimilateCostMultiplier: 0.2, // 同化消耗 20% 吞噬获取量
        blackStorePrice: 100        // 黑市售价 100 金币
    },
    {
        key: OrganRarity.Uncommon,
        label: getRarityLabel(OrganRarity.Uncommon),
        color: getRarityColor(OrganRarity.Uncommon),
        baseAbsorbValue: 35,
        upgradeCostMultiplier: 1.1,
        upgradeVariance: DEFAULT_UPGRADE_VARIANCE,
        repairCostMultiplier: 0.6,
        assimilateCostMultiplier: 0.2,
        blackStorePrice: 180
    },
    {
        key: OrganRarity.Rare,
        label: getRarityLabel(OrganRarity.Rare),
        color: getRarityColor(OrganRarity.Rare),
        baseAbsorbValue: 55,
        upgradeCostMultiplier: 1.1,
        upgradeVariance: DEFAULT_UPGRADE_VARIANCE,
        repairCostMultiplier: 0.6,
        assimilateCostMultiplier: 0.2,
        blackStorePrice: 280
    }
]

/**
 * 根据稀有度获取配置
 */
export function getQualityConfig(quality: OrganRarity): RarityConfig {
    const config = qualityConfigList.find(c => c.key === quality)
    if (!config) {
        throw new Error(`未找到稀有度配置: ${quality}`)
    }
    return config
}

/**
 * 根据稀有度获取显示名称
 */
export function getQualityLabel(quality: OrganRarity): string {
    return getRarityLabel(quality)
}

/**
 * 根据稀有度获取颜色
 */
export function getQualityColor(quality: OrganRarity): string {
    return getRarityColor(quality)
}

/**
 * 计算器官的吞噬获取量
 * @param quality 稀有度
 * @param customValue 自定义值（可选）
 * @returns 吞噬获取量
 */
export function calculateAbsorbValue(quality: OrganRarity, customValue?: number): number {
    if (customValue !== undefined) {
        return customValue
    }
    return getQualityConfig(quality).baseAbsorbValue
}

/**
 * 计算默认升级成本（无自定义 cost 时）
 * 吞噬获取量 × 110% × (1 + (当前等级 - 1) × 20%)
 * 1 级升 2 级用基础价，之后每高一级贵 20%，与黑市等级加价同一斜率
 * rollVariance：打开升级列表时掷一次；预览和实扣必须用锁死的结果，不要在这里各掷一次
 */
export function calculateUpgradeCost(
    quality: OrganRarity,
    absorbValue: number,
    level: number = 1,
    rollVariance: boolean = false
): number {
    const config = getQualityConfig(quality)
    const baseCost = Math.floor(absorbValue * config.upgradeCostMultiplier)
    const scaled = Math.floor(baseCost * (1 + (level - 1) * 0.2))
    if (!rollVariance) {
        return scaled
    }
    const variance = config.upgradeVariance ?? DEFAULT_UPGRADE_VARIANCE
    return applyVariance(scaled, { variance })
}

export type OrganUpgradeCostSource = {
    rarity: OrganRarity
    absorbValue: number
    level: number
    isDisabled?: boolean
    upgradeConfig?: {
        maxLevel?: number
        cost?: number | ((organ: OrganUpgradeCostSource) => number)
        milestones?: { level: number }[]
    }
}

/**
 * 预览和实扣共用。自定义 cost 不再掷波动。
 * 默认公式仅在 rollVariance 时掷骰；调用方负责锁死结果。
 */
export function resolveOrganUpgradeCost(
    organ: OrganUpgradeCostSource,
    options?: { rollVariance?: boolean }
): number {
    const custom = organ.upgradeConfig?.cost
    if (custom !== undefined) {
        return typeof custom === "function" ? custom(organ) : custom
    }
    return calculateUpgradeCost(
        organ.rarity,
        organ.absorbValue,
        organ.level,
        options?.rollVariance === true
    )
}

export function getOrganMilestones(organ: OrganUpgradeCostSource): { level: number }[] {
    return [...(organ.upgradeConfig?.milestones ?? [])].sort((a, b) => a.level - b.level)
}

/**
 * 可升到的最高级 = 写过的最高里程碑，若同时写了 maxLevel 取更小者。
 * 没有里程碑则不能在水池升级。
 */
export function getOrganUpgradeCap(organ: OrganUpgradeCostSource): number | null {
    const milestones = getOrganMilestones(organ)
    if (milestones.length === 0) {
        return null
    }
    const last = milestones[milestones.length - 1].level
    const maxLevel = organ.upgradeConfig?.maxLevel
    return maxLevel !== undefined ? Math.min(last, maxLevel) : last
}

export function canContinueOrganUpgrade(organ: OrganUpgradeCostSource): boolean {
    if (organ.isDisabled) {
        return false
    }
    const cap = getOrganUpgradeCap(organ)
    return cap !== null && organ.level < cap
}

/**
 * 计算修复成本
 * @param quality 稀有度
 * @param absorbValue 吞噬获取量
 * @returns 修复成本
 */
export function calculateRepairCost(quality: OrganRarity, absorbValue: number): number {
    const config = getQualityConfig(quality)
    return Math.floor(absorbValue * config.repairCostMultiplier)
}

/**
 * 计算同化成本
 * @param quality 稀有度
 * @param absorbValue 吞噬获取量
 * @returns 同化成本
 */
export function calculateAssimilateCost(quality: OrganRarity, absorbValue: number): number {
    const config = getQualityConfig(quality)
    return Math.floor(absorbValue * config.assimilateCostMultiplier)
}

/**
 * 计算黑市价格
 * @param quality 稀有度
 * @param level 器官等级
 * @returns 黑市价格
 */
export function calculateBlackStorePrice(quality: OrganRarity, level: number): number {
    const config = getQualityConfig(quality)
    // 基础价格 + 等级加成（每级增加 20%）
    return Math.floor(config.blackStorePrice * (1 + (level - 1) * 0.2))
}
