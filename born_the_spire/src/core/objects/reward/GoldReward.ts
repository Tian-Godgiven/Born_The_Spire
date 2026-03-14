import { Reward } from "./Reward"
import type { RewardConfig } from "./Reward"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 金钱奖励配置
 */
export interface GoldRewardConfig extends RewardConfig {
    type: "gold"
    amount: number  // 金钱数量
}

/**
 * 金钱奖励类
 * 点击后直接获得金钱
 */
export class GoldReward extends Reward {
    public readonly amount: number

    constructor(config: GoldRewardConfig) {
        super(config)
        this.amount = config.amount
    }

    /**
     * 领取金钱奖励
     */
    async claim(): Promise<void> {
        if (!this.isAvailable()) {
            console.warn("[GoldReward] 奖励不可领取")
            return
        }

        // TODO: 实现金钱系统后，给玩家添加金钱
        newLog([`获得 ${this.amount} 金钱`])

        this.markAsClaimed()
    }

    protected getDefaultTitle(): string {
        return `${this.amount} 金钱`
    }

    protected getDefaultDescription(): string {
        return `获得 ${this.amount} 金钱`
    }

    protected getDefaultIcon(): string {
        return "💰"
    }
}
