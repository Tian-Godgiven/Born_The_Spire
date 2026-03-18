import { Reward } from "./Reward"
import type { RewardConfig } from "./Reward"
import type { Relic } from "@/core/objects/item/Subclass/Relic"
import type { RelicMap } from "@/core/objects/item/Subclass/Relic"
import { newLog } from "@/ui/hooks/global/log"
import { getRelicModifier } from "@/core/objects/system/modifier/RelicModifier"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { createRelic } from "@/core/factories"

/**
 * 遗物奖励配置
 */
export interface RelicRewardConfig extends RewardConfig {
    type: "relic"
    relicConfig: RelicMap | string  // 遗物配置或 key
}

/**
 * 遗物奖励类
 * 点击后获得遗物
 */
export class RelicReward extends Reward {
    public readonly relicConfig: RelicMap
    private relic: Relic | null = null

    constructor(config: RelicRewardConfig) {
        super(config)

        // 处理遗物配置
        if (typeof config.relicConfig === 'string') {
            this.relicConfig = this.loadRelicByKey(config.relicConfig)
        } else {
            this.relicConfig = config.relicConfig
        }
    }

    /**
     * 根据遗物 key 加载遗物配置
     */
    private loadRelicByKey(key: string): RelicMap {
        const relicList = getLazyModule<RelicMap[]>('relicList')
        const config = relicList.find((r: RelicMap) => r.key === key)
        if (!config) {
            throw new Error(`[RelicReward] 未找到遗物配置: ${key}`)
        }
        return config
    }

    /**
     * 领取遗物奖励
     */
    async claim(): Promise<void> {
        if (!this.isAvailable()) {
            console.warn("[RelicReward] 奖励不可领取")
            return
        }

        // 通过事件系统给玩家添加遗物
        
        

        await doEvent({
            key: "gainRelic",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainRelic",
                params: { relicKey: this.relicConfig.key }
            }]
        })

        // 获取已添加的遗物实例（从 RelicModifier 中获取）
        
        const relicModifier = getRelicModifier(nowPlayer)
        const relics = relicModifier.getRelics()
        this.relic = relics.find(r => r.key === this.relicConfig.key) || null

        this.markAsClaimed()
    }

    /**
     * 获取已获得的遗物
     */
    getRelic(): Relic | null {
        return this.relic
    }

    protected getDefaultTitle(): string {
        return this.relicConfig.label || "遗物"
    }

    protected getDefaultDescription(): string {
        return `获得 ${this.relicConfig.label}`
    }

    protected getDefaultIcon(): string {
        return "💎"
    }
}
