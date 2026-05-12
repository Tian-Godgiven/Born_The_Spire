/**
 * 黑市房间（重构版）
 * 支持买卖器官、遗物、药水，以及出售生命值
 */

import { Room } from "./Room"
import type { RoomConfig } from "./Room"
import { nowPlayer } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"
import type { OrganMap } from "@/core/objects/target/Organ"
import type { Organ } from "@/core/objects/target/Organ"
import type { Relic } from "@/core/objects/item/Subclass/Relic"
import type { RelicMap } from "@/core/objects/item/Subclass/Relic"
import type { PotionMap } from "@/core/objects/item/Subclass/Potion"
import type { CardMap } from "@/core/objects/item/Subclass/Card"
import { createRelic, createOrgan, createPotion, createCard } from "@/core/factories"
import { randomFloatRange, randomWeightedChoice } from "@/core/hooks/random"
import { getOrganByKey } from "@/static/list/target/organList"
import type { RarityWeights } from "@/static/list/room/blackStore/blackStoreItemPool"
import { calculateBlackStorePrice } from "@/static/list/target/organQuality"
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import {
    relicPriceByRarity, relicDefaultPrice,
    potionDefaultPrice,
    cardPriceConfig,
    organDiscountRange,
    healthSellConfig,
    defaultRelicSlots,
} from "@/static/config/blackStoreBalance"
import type { RelicSlotConfig } from "@/static/config/blackStoreBalance"
import { drawItem, drawItems } from "@/core/hooks/draw"
import type { DrawConfig } from "@/core/hooks/draw"
import { getRelicModifier } from "@/core/objects/system/modifier/RelicModifier"
import { getCurrentValue } from "@/core/objects/system/Current/current"
import { getStatusValue } from "@/core/objects/system/status/Status"
import { doEvent } from "@/core/objects/system/ActionEvent"

/**
 * 商品类型
 */
export type StoreItemType = "organ" | "relic" | "potion" | "card"

/**
 * 商品接口
 */
export interface StoreItem {
    id: string                      // 商品唯一标识
    type: StoreItemType             // 商品类型
    name: string                    // 商品名称
    description?: string            // 商品描述
    price: number                   // 价格（金钱）
    data: OrganMap | RelicMap | PotionMap | CardMap  // 商品数据
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
    relicSlots?: RelicSlotConfig[]  // 遗物栏位配置（默认使用 defaultRelicSlots）
    potionCount?: number            // 药水数量（默认 3）
    cardCount?: number              // 卡牌数量（默认取卡牌池全部，池为空则不显示）
    allowSellOrgan?: boolean        // 是否允许出售器官（默认 true）
    allowSellHealth?: boolean       // 是否允许出售生命值（默认 true）

    // 稀有度权重配置
    rarityWeights?: {
        organ?: RarityWeights       // 器官稀有度权重
        potion?: RarityWeights      // 药水稀有度权重
    }

    // 器官折扣范围
    organDiscountRange?: {
        min?: number                // 最小折扣（默认 0.5，即 50%）
        max?: number                // 最大折扣（默认 0.7，即 70%）
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
        card?: {
            whitelist?: string[]    // 卡牌白名单
            blacklist?: string[]    // 卡牌黑名单
        }
    }
}

/**
 * 黑市房间类
 * 提供买卖交易功能
 */
export class BlackStoreRoom extends Room {
    public readonly organCount: number
    public readonly relicSlots: RelicSlotConfig[]
    public readonly potionCount: number
    public readonly cardCount: number
    public readonly allowSellOrgan: boolean
    public readonly allowSellHealth: boolean

    // 配置
    private readonly rarityWeights: BlackStoreRoomConfig["rarityWeights"]
    private readonly organDiscountRange: { min: number, max: number }
    private readonly filters: BlackStoreRoomConfig["filters"]

    // 商品列表
    private storeItems: StoreItem[] = []

    // 出售生命值的次数（用于计算贬值）
    private healthSoldCount: number = 0

    // 器官折扣缓存（器官ID -> 折扣）
    private organDiscounts: Map<string, number> = new Map()

    // 展示用实例缓存（商品ID -> 实例）
    private previewInstances: Map<string, any> = new Map()

    constructor(config: BlackStoreRoomConfig) {
        super(config)

        this.organCount = config.organCount ?? 5
        this.relicSlots = config.relicSlots ?? defaultRelicSlots
        this.potionCount = config.potionCount ?? 3
        this.cardCount = config.cardCount ?? 999  // 默认取商店池中所有卡牌
        this.allowSellOrgan = config.allowSellOrgan ?? true
        this.allowSellHealth = config.allowSellHealth ?? true

        // 稀有度权重配置
        this.rarityWeights = config.rarityWeights

        // 器官折扣范围配置
        this.organDiscountRange = {
            min: config.organDiscountRange?.min ?? organDiscountRange.min,
            max: config.organDiscountRange?.max ?? organDiscountRange.max
        }

        // 黑白名单配置
        this.filters = config.filters

        // 生成商品列表
        this.generateStoreItems()

        // 应用商店折扣（来自玩家 shopDiscount 属性）
        this.applyShopDiscount()
    }

    /**
     * 生成商品列表
     */
    private generateStoreItems(): void {
        this.storeItems = []

        // 生成器官商品
        const organs = drawItems("organ", this.organCount, {
            rarityWeights: this.rarityWeights?.organ as Record<string, number> | undefined,
            context: "blackStore:organ"
        }) as OrganMap[]
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

        // 生成遗物商品（按栏位配置逐个抽取）
        const relics = this.generateRelicsBySlots()
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
        const potions = drawItems("potion", this.potionCount, {
            rarityWeights: this.rarityWeights?.potion as Record<string, number> | undefined,
            context: "blackStore:potion"
        }) as PotionMap[]
        potions.forEach((potion, index) => {
            this.storeItems.push({
                id: `potion_${index}`,
                type: "potion",
                name: potion.label,
                description: potion.describe ? this.formatDescribe(potion.describe) : undefined,
                price: this.calculatePotionPrice(potion),
                data: potion,
                isPurchased: false,
                rarity: undefined  // PotionMap 暂无 rarity 属性
            })
        })

        // 生成卡牌商品（从商店卡牌池）
        const cards = drawItems("card", this.cardCount, {
            pool: "shop",
            context: "blackStore:card"
        }) as CardMap[]
        if (cards.length > 0) {
            cards.forEach((card, index) => {
                this.storeItems.push({
                    id: `card_${index}`,
                    type: "card",
                    name: card.label,
                    description: card.describe ? this.formatDescribe(card.describe) : undefined,
                    price: this.calculateCardPrice(card),
                    data: card,
                    isPurchased: false
                })
            })
        }
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
     * 按栏位配置生成遗物
     */
    private generateRelicsBySlots(): RelicMap[] {
        const result: RelicMap[] = []
        const exclude: string[] = []

        for (let i = 0; i < this.relicSlots.length; i++) {
            const slot = this.relicSlots[i]

            // 解析栏位配置：概率规则或固定规则
            let config: DrawConfig
            if ("chances" in slot) {
                // 按权重随机选择一条规则
                const weights = slot.chances.map(c => c.weight)
                const configs = slot.chances.map(c => c.drawConfig)
                config = randomWeightedChoice(configs, weights, `blackStore:relicSlot:${i}:chance`)
            } else {
                config = slot
            }

            // 抽取遗物
            const relic = drawItem("relic", {
                ...config,
                exclude,
                context: `blackStore:relicSlot:${i}`,
            }) as RelicMap | null

            if (relic) {
                result.push(relic)
                exclude.push(relic.key)
            }
        }

        return result
    }

    /**
     * 应用商店折扣
     * 读取玩家 shopDiscount 属性（初始值1，会员卡等通过乘法修饰器降低）
     */
    private applyShopDiscount(): void {
        const multiplier = Number(getStatusValue(nowPlayer, "shopDiscount", 1))
        if (multiplier >= 1) return

        for (const item of this.storeItems) {
            item.price = Math.max(1, Math.floor(item.price * multiplier))
        }
    }

    /**
     * 计算器官价格
     * 基于稀有度和等级
     */
    private calculateOrganPrice(organ: OrganMap): number {
        const level = organ.level ?? 1
        return calculateBlackStorePrice(organ.rarity, level)
    }

    /**
     * 计算遗物价格
     */
    private calculateRelicPrice(relic: RelicMap): number {
        return relicPriceByRarity[relic.rarity ?? "common"] ?? relicDefaultPrice
    }

    /**
     * 计算药水价格
     */
    private calculatePotionPrice(_potion: PotionMap): number {
        return potionDefaultPrice
    }

    /**
     * 计算卡牌价格
     */
    private calculateCardPrice(card: CardMap): number {
        const cost = card.status?.cost ?? 1
        return cardPriceConfig.base + cost * cardPriceConfig.costMultiplier
    }

    /**
     * 为所有商品预创建展示用实例
     */
    async createPreviewInstances(): Promise<void> {
        for (const item of this.storeItems) {
            try {
                let instance: any = null
                switch (item.type) {
                    case "organ":
                        instance = await createOrgan(item.data)
                        break
                    case "relic":
                        instance = await createRelic(item.data)
                        break
                    case "potion":
                        instance = await createPotion(item.data)
                        break
                    case "card":
                        instance = await createCard(item.data)
                        break
                }
                if (instance) {
                    this.previewInstances.set(item.id, instance)
                }
            } catch (e) {
                console.warn(`[BlackStore] 创建展示实例失败: ${item.name}`, e)
            }
        }
    }

    /**
     * 获取商品的展示用实例
     */
    getPreviewInstance(itemId: string): any | null {
        return this.previewInstances.get(itemId) ?? null
    }

    /**
     * 进入黑市房间
     */
    async enter(): Promise<void> {
        this.state = "active"

        // 预创建展示实例
        await this.createPreviewInstances()

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
        // 清理展示实例
        this.previewInstances.clear()
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
                const organ = await getOrganByKey(organData.key)
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

                // 使用工厂创建 Relic 实例
                const relic = await createRelic(relicConfig)
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
            case "card": {
                const cardData = item.data as CardMap
                const { getCardModifier } = await import("@/core/objects/system/modifier/CardModifier")
                const cardModifier = getCardModifier(nowPlayer)
                cardModifier.addCardsFromSource(nowPlayer, [cardData.key])
                newLog([`获得卡牌: ${item.name}`])
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
        let discount = this.organDiscounts.get(organ.key)

        if (discount === undefined) {
            // 使用确定性随机数生成折扣

            const discountValue = randomFloatRange(
                this.organDiscountRange.min,
                this.organDiscountRange.max,
                `organDiscount:${organ.key}`
            ) ?? 0.5  // 添加默认值
            discount = discountValue
            this.organDiscounts.set(organ.key, discountValue)
        }

        return Math.floor(baseBuyPrice * (discount ?? 0.5))
    }

    /**
     * 获取器官的折扣信息
     */
    private getOrganDiscount(organ: Organ): number {
        let discount = this.organDiscounts.get(organ.key)

        if (discount === undefined) {

            const discountValue = randomFloatRange(
                this.organDiscountRange.min,
                this.organDiscountRange.max,
                `organDiscount:${organ.key}`
            ) ?? 0.5  // 添加默认值
            discount = discountValue
            this.organDiscounts.set(organ.key, discountValue)
        }

        return discount ?? 0.5
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
        const basePrice = amount * healthSellConfig.pricePerHp
        const depreciationRate = Math.pow(healthSellConfig.depreciationFactor, this.healthSoldCount)

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
