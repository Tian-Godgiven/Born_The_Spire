import { Reward, RewardConfig } from "./Reward"
import { RelicMap } from "@/core/objects/item/Subclass/Relic"
import { newLog } from "@/ui/hooks/global/log"
import { getLazyModule } from "@/core/utils/lazyLoader"

/**
 * 遗物选择奖励配置
 */
export interface RelicSelectRewardConfig extends RewardConfig {
    type: "relicSelect"
    relicOptions: RelicMap[] | string[]  // 可选遗物列表（配置或 key）
    selectCount?: number  // 可选择数量（默认 1）
}

/**
 * 遗物选择奖励类
 * 点击后打开遗物选择界面
 */
export class RelicSelectReward extends Reward {
    public readonly relicOptions: RelicMap[]
    public readonly selectCount: number
    public selectedRelics: string[] = []  // 存储选择的遗物 key

    constructor(config: RelicSelectRewardConfig) {
        super(config)

        // 处理遗物选项
        if (config.relicOptions.length > 0 && typeof config.relicOptions[0] === 'string') {
            this.relicOptions = this.loadRelicsByKeys(config.relicOptions as string[])
        } else {
            this.relicOptions = config.relicOptions as RelicMap[]
        }

        this.selectCount = config.selectCount || 1
    }

    /**
     * 根据遗物 key 列表加载遗物配置
     */
    private loadRelicsByKeys(keys: string[]): RelicMap[] {
        const relicList = getLazyModule<RelicMap[]>('relicList')
        return keys.map(key => {
            const config = relicList.find((r: RelicMap) => r.key === key)
            if (!config) {
                console.warn(`[RelicSelectReward] 未找到遗物配置: ${key}`)
            }
            return config
        }).filter((config): config is RelicMap => config !== undefined)
    }

    /**
     * 领取遗物选择奖励
     * 将选择的遗物添加到玩家
     */
    async claim(): Promise<void> {
        if (!this.isAvailable()) {
            console.warn("[RelicSelectReward] 奖励不可领取")
            return
        }

        if (this.selectedRelics.length === 0) {
            console.warn("[RelicSelectReward] 没有选择任何遗物")
            this.markAsClaimed()
            return
        }

        // 动态导入避免循环依赖
        const { nowPlayer } = await import("@/core/objects/game/run")
        const { Relic } = await import("@/core/objects/item/Subclass/Relic")
        const { getRelicModifier } = await import("@/core/objects/system/modifier/RelicModifier")

        // 将选择的遗物添加到玩家
        const relicModifier = getRelicModifier(nowPlayer)
        for (const relicKey of this.selectedRelics) {
            const relicConfig = this.relicOptions.find(r => r.key === relicKey)
            if (relicConfig) {
                const relic = new Relic(relicConfig)
                relicModifier.acquireRelic(relic, nowPlayer)
                newLog([`获得遗物: ${relicConfig.label}`])
            }
        }

        this.markAsClaimed()
    }

    /**
     * 获取已选择的遗物 key 列表
     */
    getSelectedRelicKeys(): string[] {
        return this.selectedRelics
    }

    protected getDefaultTitle(): string {
        return `选择遗物 (${this.selectCount}/${this.relicOptions.length})`
    }

    protected getDefaultDescription(): string {
        return `从 ${this.relicOptions.length} 个遗物中选择 ${this.selectCount} 个`
    }

    protected getDefaultIcon(): string {
        return "💎"
    }
}
