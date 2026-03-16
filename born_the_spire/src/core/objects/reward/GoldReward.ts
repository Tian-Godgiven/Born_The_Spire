import { Reward } from "./Reward"
import type { RewardConfig } from "./Reward"

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

        // 通过事件系统给玩家添加金钱
        const { nowPlayer } = await import("@/core/objects/game/run")
        const { doEvent } = await import("@/core/objects/system/ActionEvent")

        await doEvent({
            key: "gainReserve",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainReserve",
                params: { reserveKey: "gold", amount: this.amount }
            }]
        })

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
