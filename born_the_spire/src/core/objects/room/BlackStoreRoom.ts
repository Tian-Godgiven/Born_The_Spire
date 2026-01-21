/**
 * 黑市房间（重构版）
 * 支持买卖器官、遗物、药水，以及出售生命值
 */

import { Room, RoomConfig } from "./Room"
import { nowPlayer } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"
import { OrganMap } from "@/static/list/target/organList"
import { RelicMap } from "@/static/list/item/relicList"
import { PotionMap } from "@/static/list/item/potionList"
import {
    blackStoreOrganPool,
    blackStoreRelicPool,
    blackStorePotionPool,
    selectRandomItemsFromPool
} from "@/static/list/blackStore/blackStoreItemPool"

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

    // 商品列表
    private storeItems: StoreItem[] = []

    // 出售生命值的次数（用于计算贬值）
    private healthSoldCount: number = 0

    constructor(config: BlackStoreRoomConfig) {
        super(config)

        this.organCount = config.organCount ?? 5
        this.relicCount = config.relicCount ?? 3
        this.potionCount = config.potionCount ?? 3
        this.allowSellOrgan = config.allowSellOrgan ?? true
        this.allowSellHealth = config.allowSellHealth ?? true

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
                isPurchased: false
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
                isPurchased: false
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
                isPurchased: false
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
        return selectRandomItemsFromPool(blackStoreOrganPool, count, false)
    }

    /**
     * 随机选择遗物
     */
    private selectRandomRelics(count: number): RelicMap[] {
        return selectRandomItemsFromPool(blackStoreRelicPool, count, false)
    }

    /**
     * 随机选择药水
     */
    private selectRandomPotions(count: number): PotionMap[] {
        return selectRandomItemsFromPool(blackStorePotionPool, count, false)
    }

    /**
     * 计算器官价格
     */
    private calculateOrganPrice(organ: OrganMap): number {
        // TODO: 根据器官等级和稀有度计算
        // 基础价格
        return 150
    }

    /**
     * 计算遗物价格
     */
    private calculateRelicPrice(relic: RelicMap): number {
        // TODO: 根据遗物稀有度计算
        return 200
    }

    /**
     * 计算药水价格
     */
    private calculatePotionPrice(potion: PotionMap): number {
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

        // TODO: 检查玩家金钱是否足够
        // const playerGold = nowPlayer.getGold()
        // if (playerGold < item.price) {
        //     newLog(["金钱不足！"])
        //     return false
        // }

        newLog([`购买了 ${item.name}，花费 ${item.price} 金钱`])

        // TODO: 扣除金钱
        // nowPlayer.spendGold(item.price)

        // TODO: 给予商品
        switch (item.type) {
            case "organ":
                newLog([`获得器官: ${item.name}`])
                // nowPlayer.addOrgan(item.data as OrganMap)
                break
            case "relic":
                newLog([`获得遗物: ${item.name}`])
                // nowPlayer.addRelic(item.data as RelicMap)
                break
            case "potion":
                newLog([`获得药水: ${item.name}`])
                // nowPlayer.addPotion(item.data as PotionMap)
                break
        }

        item.isPurchased = true
        return true
    }

    /**
     * 出售器官
     */
    async sellOrgan(organKey: string): Promise<number> {
        if (!this.allowSellOrgan) {
            newLog(["此黑市不接受器官交易"])
            return 0
        }

        // TODO: 获取器官信息
        const price = this.calculateOrganSellPrice(organKey)

        newLog([`出售了器官，获得 ${price} 金钱`])

        // TODO: 移除器官
        // nowPlayer.removeOrgan(organKey)

        // TODO: 给予金钱
        // nowPlayer.addGold(price)

        return price
    }

    /**
     * 计算器官售价
     */
    private calculateOrganSellPrice(organKey: string): number {
        // TODO: 根据器官等级和稀有度计算
        // 售价通常是购买价的 50-70%
        return 100
    }

    /**
     * 出售生命值
     */
    async sellHealth(amount: number): Promise<number> {
        if (!this.allowSellHealth) {
            newLog(["此黑市不接受生命值交易"])
            return 0
        }

        // 计算售价（随着售出次数增加不断贬值）
        const price = this.calculateHealthSellPrice(amount)

        newLog([`出售了 ${amount} 生命值，获得 ${price} 金钱`])

        // TODO: 扣除生命值
        // nowPlayer.loseMaxHealth(amount)

        // TODO: 给予金钱
        // nowPlayer.addGold(price)

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
