/**
 * 黑市房间（重构版）
 * 支持买卖器官、遗物、药水，以及出售生命值
 */

import { Room, RoomConfig } from "./Room"
import { nowPlayer } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"
import type { OrganMap } from "@/static/list/target/organList"
import type { Organ } from "@/core/objects/target/Organ"
import type { Relic } from "@/core/objects/item/Subclass/Relic"
import type { RelicMap } from "@/static/list/item/relicList"
import type { PotionMap } from "@/static/list/item/potionList"
import {
    blackStoreOrganPool,
    blackStoreRelicPool,
    blackStorePotionPool,
    selectRandomItemsFromPool,
    RarityWeights
} from "@/static/list/room/blackStore/blackStoreItemPool"
import { calculateBlackStorePrice } from "@/static/list/target/organQuality"
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { getRelicModifier } from "@/core/objects/system/modifier/RelicModifier"
import { getCurrentValue } from "@/core/objects/system/Current/current"
import { doEvent } from "@/core/objects/system/ActionEvent"

/**
 * 商品类型
 */
export type StoreItemType = "organ" | "relic" | "potion"

/**
 * 商品接口
 */
export interface StoreItem {
    id: string                      // 商品唯一标识
    type: StoreItemType             // 商品类型
    name: string                    // 商品名称
    description?: string            // 商品描述
    price: number                   // 价格（金钱）
    data: OrganMap | RelicMap | PotionMap  // 商品数据
    isPurchased: boolean            // 是否已购买
    rarity?: string                 // 稀有度
}

/**
 * 可出售器官信息
 */
export interface SellableOrgan {
    organ: Organ                    // 器官实例
    basePrice: number               // 基础价格
    sellPrice: number               // 实际售价
    discount: number                // 折扣（0-1，例如 0.6 表示 60% 折扣）
    discountPercent: string         // 折扣百分比显示（例如 "60%"）
}

/**
 * 黑市房间配置
 */
export interface BlackStoreRoomConfig extends RoomConfig {
    type: "blackStore"
    organCount?: number             // 器官数量（默认 5）
    relicCount?: number             // 遗物数量（默认 3）
    potionCount?: number            // 药水数量（默认 3）
    allowSellOrgan?: boolean        // 是否允许出售器官（默认 true）
    allowSellHealth?: boolean       // 是否允许出售生命值（默认 true）

    // 稀有度权重配置
    rarityWeights?: {
        organ?: RarityWeights       // 器官稀有度权重
        relic?: RarityWeights       // 遗物稀有度权重
        potion?: RarityWeights      // 药水稀有度权重
    }

    // 器官折扣范围
    organDiscountRange?: {
        min?: number                // 最小折扣（默认 0.5，即 50%）
        max?: number                // 最大折扣（默认 0.7，即 70%）
    }

    // 遗物不重复配置
    relicUnique?: {
        enabled?: boolean           // 是否启用遗物不重复（默认 true）
        scope?: "global" | "room"   // 不重复范围：global=全局，room=单个房间（默认 global）
    }

    // 黑白名单配置
    filters?: {
        organ?: {
            whitelist?: string[]    // 器官白名单
            blacklist?: string[]    // 器官黑名单
        }
        relic?: {
            whitelist?: string[]    // 遗物白名单
            blacklist?: string[]    // 遗物黑名单
        }
        potion?: {
            whitelist?: string[]    // 药水白名单
            blacklist?: string[]    // 药水黑名单
        }
    }
}

/**
 * 黑市房间类
 * 提供买卖交易功能
 */
export class BlackStoreRoom extends Room {
    public readonly organCount: number
    public readonly relicCount: number
    public readonly potionCount: number
    public readonly allowSellOrgan: boolean
    public readonly allowSellHealth: boolean

    // 配置
    private readonly rarityWeights: BlackStoreRoomConfig["rarityWeights"]
    private readonly organDiscountRange: { min: number, max: number }
    private readonly relicUniqueConfig: { enabled: boolean, scope: "global" | "room" }
    private readonly filters: BlackStoreRoomConfig["filters"]

    // 商品列表
    private storeItems: StoreItem[] = []

    // 出售生命值的次数（用于计算贬值）
    private healthSoldCount: number = 0

    // 器官折扣缓存（器官ID -> 折扣）
    private organDiscounts: Map<string, number> = new Map()

    // 本房间已出现的遗物（用于 room scope）
    private roomAppearedRelics: Set<string> = new Set()

    constructor(config: BlackStoreRoomConfig) {
        super(config)

        this.organCount = config.organCount ?? 5
        this.relicCount = config.relicCount ?? 3
        this.potionCount = config.potionCount ?? 3
        this.allowSellOrgan = config.allowSellOrgan ?? true
        this.allowSellHealth = config.allowSellHealth ?? true

        // 稀有度权重配置
        this.rarityWeights = config.rarityWeights

        // 器官折扣范围配置
        this.organDiscountRange = {
            min: config.organDiscountRange?.min ?? 0.5,
            max: config.organDiscountRange?.max ?? 0.7
        }

        // 遗物不重复配置
        this.relicUniqueConfig = {
            enabled: config.relicUnique?.enabled ?? true,
            scope: config.relicUnique?.scope ?? "global"
        }

        // 黑白名单配置
        this.filters = config.filters

        // 生成商品列表
        this.generateStoreItems()
    }

    /**
     * 生成商品列表
     */
    private generateStoreItems(): void {
        this.storeItems = []

        // 生成器官商品
        const organs = this.selectRandomOrgans(this.organCount)
        organs.forEach((organ, index) => {
            this.storeItems.push({
                id: `organ_${index}`,
                type: "organ",
                name: organ.label,
                description: organ.describe ? this.formatDescribe(organ.describe) : undefined,
                price: this.calculateOrganPrice(organ),
                data: organ,
                isPurchased: false,
                rarity: organ.rarity
            })
        })

        // 生成遗物商品
        const relics = this.selectRandomRelics(this.relicCount)
        relics.forEach((relic, index) => {
            this.storeItems.push({
                id: `relic_${index}`,
                type: "relic",
                name: relic.label,
                description: relic.describe ? this.formatDescribe(relic.describe) : undefined,
                price: this.calculateRelicPrice(relic),
                data: relic,
                isPurchased: false,
                rarity: relic.rarity
            })
        })

        // 生成药水商品
        const potions = this.selectRandomPotions(this.potionCount)
        potions.forEach((potion, index) => {
            this.storeItems.push({
                id: `potion_${index}`,
                type: "potion",
                name: potion.label,
                description: potion.describe ? this.formatDescribe(potion.describe) : undefined,
                price: this.calculatePotionPrice(potion),
                data: potion,
                isPurchased: false,
                rarity: potion.rarity
            })
        })
    }

    /**
     * 格式化描述（简化处理）
     */
    private formatDescribe(describe: any): string {
        if (Array.isArray(describe)) {
            return describe.map(item => {
                if (typeof item === 'string') return item
                return JSON.stringify(item)
            }).join('')
        }
        return String(describe)
    }

    /**
     * 从黑市器官池中随机选择器官
     */
    private selectRandomOrgans(count: number): OrganMap[] {
        return selectRandomItemsFromPool(
            blackStoreOrganPool,
            count,
            false,
            "blackStore:organ",
            {
                rarityWeights: this.rarityWeights?.organ,
                whitelist: this.filters?.organ?.whitelist,
                blacklist: this.filters?.organ?.blacklist,
                uniqueConfig: undefined // 器官不需要不重复配置
            }
        )
    }

    /**
     * 随机选择遗物
     */
    private selectRandomRelics(count: number): RelicMap[] {
        return selectRandomItemsFromPool(
            blackStoreRelicPool,
            count,
            false,
            "blackStore:relic",
            {
                rarityWeights: this.rarityWeights?.relic,
                whitelist: this.filters?.relic?.whitelist,
                blacklist: this.filters?.relic?.blacklist,
                uniqueConfig: this.relicUniqueConfig.enabled ? {
                    scope: this.relicUniqueConfig.scope,
                    roomAppearedSet: this.roomAppearedRelics
                } : undefined
            }
        )
    }

    /**
     * 随机选择药水
     */
    private selectRandomPotions(count: number): PotionMap[] {
        return selectRandomItemsFromPool(
            blackStorePotionPool,
            count,
            false,
            "blackStore:potion",
            {
                rarityWeights: this.rarityWeights?.potion,
                whitelist: this.filters?.potion?.whitelist,
                blacklist: this.filters?.potion?.blacklist,
                uniqueConfig: undefined // 药水不需要不重复配置
            }
        )
    }

    /**
     * 计算器官价格
     * 基于稀有度和等级
     */
    private calculateOrganPrice(organ: OrganMap): number {
        const level = organ.level ?? 1
        return calculateBlackStorePrice(organ.quality, level)
    }

    /**
     * 计算遗物价格
     */
    private calculateRelicPrice(_relic: RelicMap): number {
        // TODO: 根据遗物稀有度计算
        return 200
    }

    /**
     * 计算药水价格
     */
    private calculatePotionPrice(_potion: PotionMap): number {
        // 药水价格相对便宜
        return 75
    }

    /**
     * 进入黑市房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog(["===== 进入黑市 ====="])
        newLog(["一个进行着可疑交易的窝点..."])
        newLog([`商品列表：${this.storeItems.length} 件商品`])
    }

    /**
     * 处理黑市房间
     * 显示商店界面
     */
    async process(): Promise<void> {
        // 黑市房间的处理由 UI 驱动
        // 玩家通过 UI 进行买卖交易
    }

    /**
     * 完成黑市房间
     */
    async complete(): Promise<void> {
        this.state = "completed"
        newLog(["===== 离开黑市 ====="])
    }

    /**
     * 离开黑市房间
     */
    async exit(): Promise<void> {
        // 清理状态
    }

    /**
     * 购买商品
     */
    async purchaseItem(itemId: string): Promise<boolean> {
        const item = this.storeItems.find(i => i.id === itemId)
        if (!item) {
            newLog(["商品不存在！"])
            return false
        }

        if (item.isPurchased) {
            newLog(["该商品已售出！"])
            return false
        }

        // 检查玩家金钱是否足够
        const reserveModifier = getReserveModifier(nowPlayer)
        const playerGold = reserveModifier.getReserve("gold")

        if (playerGold < item.price) {
            newLog(["金钱不足！", `需要 ${item.price} 金币，当前 ${playerGold} 金币`])
            return false
        }

        newLog([`购买了 ${item.name}，花费 ${item.price} 金钱`])

        // 扣除金钱
        reserveModifier.spendReserve("gold", item.price)

        // 给予商品
        switch (item.type) {
            case "organ": {
                const organData = item.data as OrganMap
                // 使用 getOrganByKey 创建 Organ 实例
                const { getOrganByKey } = await import("@/static/list/target/organList")
                const organ = getOrganByKey(organData.key)
                const organModifier = getOrganModifier(nowPlayer)
                organModifier.acquireOrgan(organ, nowPlayer)
                newLog([`获得器官: ${item.name}`])
                break
            }
            case "relic": {
                const relicList = getLazyModule<RelicMap[]>('relicList')
                const relicData = item.data as RelicMap
                const relicConfig = relicList.find(r => r.key === relicData.key)
                if (!relicConfig) throw new Error(`未找到遗物: ${relicData.key}`)

                // 创建 Relic 实例
                const relic = new Relic(relicConfig)
                const relicModifier = getRelicModifier(nowPlayer)
                relicModifier.acquireRelic(relic, nowPlayer)
                newLog([`获得遗物: ${item.name}`])
                break
            }
            case "potion": {
                const potionList = getLazyModule<PotionMap[]>('potionList')
                const potionData = item.data as PotionMap
                const potion = potionList.find(p => p.key === potionData.key)
                if (!potion) throw new Error(`未找到药水: ${potionData.key}`)
                nowPlayer.getPotion(potionData.key)
                newLog([`获得药水: ${item.name}`])
                break
            }
        }

        item.isPurchased = true
        return true
    }

    /**
     * 出售器官
     */
    async sellOrgan(organ: Organ): Promise<number> {
        if (!this.allowSellOrgan) {
            newLog(["此黑市不接受器官交易"])
            return 0
        }

        // 检查玩家是否拥有该器官
        const organModifier = getOrganModifier(nowPlayer)
        const playerOrgans = organModifier.getOrgans()

        if (!playerOrgans.includes(organ)) {
            newLog(["你没有这个器官！"])
            return 0
        }

        // 计算售价
        const price = this.calculateOrganSellPrice(organ)

        newLog([`出售了器官 ${organ.label}，获得 ${price} 金钱`])

        // 移除器官
        organModifier.loseOrgan(organ, false)

        // 给予金钱
        const reserveModifier = getReserveModifier(nowPlayer)
        reserveModifier.gainReserve("gold", price, nowPlayer)

        return price
    }

    /**
     * 计算器官售价
     * 售价是购买价的配置范围内随机折扣（但对同一器官固定）
     */
    private calculateOrganSellPrice(organ: Organ): number {
        // 基础购买价格
        const baseBuyPrice = this.calculateOrganPrice(organ as any)

        // 检查是否已有缓存的折扣
        let discount = this.organDiscounts.get(organ.__key)

        if (discount === undefined) {
            // 使用确定性随机数生成折扣
            const { randomFloat } = require("@/core/hooks/random")
            discount = randomFloat(
                this.organDiscountRange.min,
                this.organDiscountRange.max,
                `organDiscount:${organ.__key}`
            )
            this.organDiscounts.set(organ.__key, discount)
        }

        return Math.floor(baseBuyPrice * discount)
    }

    /**
     * 获取器官的折扣信息
     */
    private getOrganDiscount(organ: Organ): number {
        let discount = this.organDiscounts.get(organ.__key)

        if (discount === undefined) {
            const { randomFloat } = require("@/core/hooks/random")
            discount = randomFloat(
                this.organDiscountRange.min,
                this.organDiscountRange.max,
                `organDiscount:${organ.__key}`
            )
            this.organDiscounts.set(organ.__key, discount)
        }

        return discount
    }

    /**
     * 获取可出售的器官列表（带折扣信息）
     */
    getSellableOrgans(): SellableOrgan[] {
        const organModifier = getOrganModifier(nowPlayer)
        const playerOrgans = organModifier.getOrgans()

        return playerOrgans.map(organ => {
            const basePrice = this.calculateOrganPrice(organ as any)
            const discount = this.getOrganDiscount(organ)
            const sellPrice = Math.floor(basePrice * discount)

            return {
                organ,
                basePrice,
                sellPrice,
                discount,
                discountPercent: `${Math.round(discount * 100)}%`
            }
        })
    }

    /**
     * 出售生命值
     */
    async sellHealth(amount: number): Promise<number> {
        if (!this.allowSellHealth) {
            newLog(["此黑市不接受生命值交易"])
            return 0
        }

        // 检查玩家当前生命值是否足够
        const currentHealth = getCurrentValue(nowPlayer, "health")

        if (currentHealth <= amount) {
            newLog(["生命值不足！", `需要保留至少 1 点生命值`])
            return 0
        }

        // 计算售价（随着售出次数增加不断贬值）
        const price = this.calculateHealthSellPrice(amount)

        newLog([`出售了 ${amount} 生命值，获得 ${price} 金钱`])

        // 扣除最大生命值和当前生命值
        doEvent({
            key: "loseMaxHealth",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "addStatusBaseCurrentValue",
                params: {
                    value: -amount,
                    statusKey: "max-health",
                    currentKey: "health"
                }
            }]
        })

        // 给予金钱
        const reserveModifier = getReserveModifier(nowPlayer)
        reserveModifier.gainReserve("gold", price, nowPlayer)

        // 增加售出次数
        this.healthSoldCount++

        return price
    }

    /**
     * 计算生命值售价（贬值机制）
     */
    private calculateHealthSellPrice(amount: number): number {
        // 基础价格：1生命 = 5金钱
        const basePrice = amount * 5

        // 贬值系数：每次售出后降低 20%
        const depreciationRate = Math.pow(0.8, this.healthSoldCount)

        return Math.floor(basePrice * depreciationRate)
    }

    /**
     * 获取生命值售价预览（用于 UI 显示）
     */
    getHealthSellPricePreview(amount: number): number {
        return this.calculateHealthSellPrice(amount)
    }

    /**
     * 获取商品列表
     */
    getStoreItems(): StoreItem[] {
        return this.storeItems
    }

    /**
     * 获取可购买的商品列表
     */
    getAvailableItems(): StoreItem[] {
        return this.storeItems.filter(item => !item.isPurchased)
    }

    /**
     * 获取已售出的商品数量
     */
    getSoldItemCount(): number {
        return this.storeItems.filter(item => item.isPurchased).length
    }

    /**
     * 获取生命值售出次数
     */
    getHealthSoldCount(): number {
        return this.healthSoldCount
    }

    getDisplayName(): string {
        return this.name || "黑市"
    }

    getIcon(): string {
        return "$"
    }
}

// ==================== 自动注册 ====================
