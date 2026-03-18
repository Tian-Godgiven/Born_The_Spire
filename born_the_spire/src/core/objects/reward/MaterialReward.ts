import { Reward } from "./Reward"
import type { RewardConfig } from "./Reward"
import { newLog } from "@/ui/hooks/global/log"
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"
import { nowPlayer } from "@/core/objects/game/run"

/**
 * 物质奖励配置
 */
export interface MaterialRewardConfig extends RewardConfig {
    type: "material"
    amount: number  // 物质数量
}

/**
 * 物质奖励类
 * 点击后直接获得物质
 */
export class MaterialReward extends Reward {
    public readonly amount: number

    constructor(config: MaterialRewardConfig) {
        super(config)
        this.amount = config.amount
    }

    /**
     * 领取物质奖励
     */
    async claim(): Promise<void> {
        if (!this.isAvailable()) {
            console.warn("[MaterialReward] 奖励不可领取")
            return
        }

        const reserveModifier = getReserveModifier(nowPlayer)
        reserveModifier.gainReserve("material", this.amount, nowPlayer)

        newLog([`获得吞噬物质: +${this.amount}`])

        this.markAsClaimed()
    }

    protected getDefaultTitle(): string {
        return `吞噬物质 +${this.amount}`
    }

    protected getDefaultDescription(): string {
        return `获得 ${this.amount} 吞噬物质`
    }

    protected getDefaultIcon(): string {
        return "🧬"
    }
}
