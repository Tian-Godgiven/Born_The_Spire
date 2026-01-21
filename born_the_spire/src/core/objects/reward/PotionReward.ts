import { Reward, RewardConfig } from "./Reward"
import { Potion } from "@/core/objects/item/Subclass/Potion"
import { PotionMap } from "@/static/list/item/potionList"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 药水奖励配置
 */
export interface PotionRewardConfig extends RewardConfig {
    type: "potion"
    potionConfig: PotionMap | string  // 药水配置或 key
}

/**
 * 药水奖励类
 * 点击后获得药水
 */
export class PotionReward extends Reward {
    public readonly potionConfig: PotionMap
    private potion: Potion | null = null

    constructor(config: PotionRewardConfig) {
        super(config)

        // 处理药水配置
        if (typeof config.potionConfig === 'string') {
            this.potionConfig = this.loadPotionByKey(config.potionConfig)
        } else {
            this.potionConfig = config.potionConfig
        }
    }

    /**
     * 根据药水 key 加载药水配置
     */
    private loadPotionByKey(key: string): PotionMap {
        const { potionList } = require("@/static/list/item/potionList")
        const config = potionList.find((p: PotionMap) => p.key === key)
        if (!config) {
            console.warn(`[PotionReward] 未找到药水配置: ${key}`)
        }
        return config
    }

    /**
     * 领取药水奖励
     */
    async claim(): Promise<void> {
        if (!this.isAvailable()) {
            console.warn("[PotionReward] 奖励不可领取")
            return
        }

        this.potion = new Potion(this.potionConfig)
        newLog([`获得药水: ${this.potion.label}`])

        // TODO: 将药水添加到玩家背包
        // nowPlayer.addPotion(this.potion)

        this.markAsClaimed()
    }

    /**
     * 获取已获得的药水
     */
    getPotion(): Potion | null {
        return this.potion
    }

    protected getDefaultTitle(): string {
        return this.potionConfig.label || "药水"
    }

    protected getDefaultDescription(): string {
        return `获得 ${this.potionConfig.label}`
    }

    protected getDefaultIcon(): string {
        return "🧪"
    }
}
