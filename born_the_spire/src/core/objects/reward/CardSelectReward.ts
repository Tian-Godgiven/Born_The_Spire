import { Reward } from "./Reward"
import type { RewardConfig } from "./Reward"
import type { CardMap } from "@/core/objects/item/Subclass/Card"
import { newLog } from "@/ui/hooks/global/log"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { nowPlayer } from "@/core/objects/game/run"

/**
 * 卡牌选择奖励配置
 */
export interface CardSelectRewardConfig extends RewardConfig {
    type: "cardSelect"
    cardOptions: CardMap[] | string[]  // 可选卡牌列表（配置或 key）
    selectCount?: number  // 可选择数量（默认 1）
}

/**
 * 卡牌选择奖励类
 * 点击后打开卡牌选择界面
 */
export class CardSelectReward extends Reward {
    public readonly cardOptions: CardMap[]
    public readonly selectCount: number
    public selectedCards: string[] = []  // 存储选择的卡牌 key

    constructor(config: CardSelectRewardConfig) {
        super(config)

        // 处理卡牌选项
        if (config.cardOptions.length > 0 && typeof config.cardOptions[0] === 'string') {
            this.cardOptions = this.loadCardsByKeys(config.cardOptions as string[])
        } else {
            this.cardOptions = config.cardOptions as CardMap[]
        }

        this.selectCount = config.selectCount || 1
    }

    /**
     * 根据卡牌 key 列表加载卡牌配置
     */
    private loadCardsByKeys(keys: string[]): CardMap[] {
        const cardList = getLazyModule<CardMap[]>('cardList')
        return keys.map(key => {
            const config = cardList.find((c: CardMap) => c.key === key)
            if (!config) {
                console.warn(`[CardSelectReward] 未找到卡牌配置: ${key}`)
            }
            return config
        }).filter((config): config is CardMap => config !== undefined)
    }

    /**
     * 领取卡牌选择奖励
     * 通过 gainCard 事件将选择的卡牌加入玩家牌组
     */
    async claim(): Promise<void> {
        if (!this.isAvailable()) {
            console.warn("[CardSelectReward] 奖励不可领取")
            return
        }

        if (this.selectedCards.length === 0) {
            console.warn("[CardSelectReward] 没有选择任何卡牌")
            this.markAsClaimed()
            return
        }

        for (const cardKey of this.selectedCards) {
            const cardConfig = this.cardOptions.find(c => c.key === cardKey)
            if (!cardConfig) continue

            await doEvent({
                key: "gainCard",
                source: nowPlayer,
                medium: nowPlayer,
                target: nowPlayer,
                effectUnits: [{
                    key: "gainCard",
                    params: { cardKey }
                }]
            })
            newLog([`获得卡牌: ${cardConfig.label}`])
        }

        this.markAsClaimed()
    }

    /**
     * 获取已选择的卡牌 key 列表
     */
    getSelectedCardKeys(): string[] {
        return this.selectedCards
    }

    protected getDefaultTitle(): string {
        return `选择卡牌 (${this.selectCount}/${this.cardOptions.length})`
    }

    protected getDefaultDescription(): string {
        return `从 ${this.cardOptions.length} 张卡牌中选择 ${this.selectCount} 张`
    }

    protected getDefaultIcon(): string {
        return "🃏"
    }
}
