/**
 * 宝箱房间
 * 玩家进入后可以打开宝箱获得金钱、遗物和印记奖励
 */

import { Room, RoomConfig } from "./Room"
import { newLog } from "@/ui/hooks/global/log"
import { Reward } from "@/core/objects/reward/Reward"
import { applyVariance, VarianceConfig } from "@/core/hooks/variance"
import { selectRelicsWithFilter, RelicFilterConfig } from "@/core/utils/relicFilter"

/**
 * 宝箱房间配置
 */
export interface TreasureRoomConfig extends RoomConfig {
    type: "treasure"
    baseGoldAmount?: number         // 基础金钱数量（默认 30）
    goldPerLayer?: number           // 每层额外金钱（默认 5）
    goldVariance?: VarianceConfig   // 金钱波动配置
    relicFilter?: RelicFilterConfig // 遗物过滤配置
    markKey?: string                // 印记key（默认 "mark_treasure"）
    customData?: {
        baseGoldAmount?: number
        goldPerLayer?: number
        goldVariance?: VarianceConfig
        relicFilter?: RelicFilterConfig
        markKey?: string
    }
}

/**
 * 宝箱房间类
 */
export class TreasureRoom extends Room {
    public readonly baseGoldAmount: number
    public readonly goldPerLayer: number
    public readonly goldVariance: VarianceConfig
    public readonly relicFilter: RelicFilterConfig
    public readonly markKey: string
    public isOpened: boolean = false  // 宝箱是否已打开

    constructor(config: TreasureRoomConfig) {
        super(config)

        // 从 config 或 customData 中获取配置
        this.baseGoldAmount = config.baseGoldAmount
            ?? config.customData?.baseGoldAmount
            ?? 30
        this.goldPerLayer = config.goldPerLayer
            ?? config.customData?.goldPerLayer
            ?? 5
        this.goldVariance = config.goldVariance
            ?? config.customData?.goldVariance
            ?? { variance: 0.15 }
        this.relicFilter = config.relicFilter
            ?? config.customData?.relicFilter
            ?? {
                rarityWeights: {
                    common: 60,
                    uncommon: 30,
                    rare: 10
                },
                count: 1
            }
        this.markKey = config.markKey
            ?? config.customData?.markKey
            ?? "mark_treasure"
    }

    /**
     * 进入宝箱房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog(["===== 宝箱房间 ====="])
        newLog(["一个神秘的宝箱静静地躺在房间中央"])
    }

    /**
     * 处理宝箱房间
     * 由 UI 驱动，等待玩家点击宝箱
     */
    async process(): Promise<void> {
        // UI 驱动，等待玩家点击宝箱
    }

    /**
     * 完成宝箱房间
     * 生成并显示奖励
     */
    async complete(): Promise<void> {
        this.state = "completed"

        // 生成奖励
        const rewards = await this.generateRewards()

        // 显示奖励
        const { showRewards } = await import("@/ui/hooks/interaction/rewardDisplay")
        await showRewards(rewards, "宝箱奖励", "你获得了以下奖励")

        // 发放印记
        const { gainMark } = await import("@/core/hooks/mark")
        const { nowPlayer } = await import("@/core/objects/game/run")
        gainMark(nowPlayer, this.markKey)
        newLog(["获得宝箱印记！"])
    }

    /**
     * 离开宝箱房间
     */
    async exit(): Promise<void> {
        // 清理状态
    }

    /**
     * 生成宝箱奖励
     */
    private async generateRewards(): Promise<Reward[]> {
        const rewards: Reward[] = []

        // 1. 金钱奖励（按层数成长 + 波动）
        const rawGold = this.baseGoldAmount + this.layer * this.goldPerLayer
        const finalGold = applyVariance(rawGold, this.goldVariance)

        // 创建金钱奖励（目前只输出日志，等金钱系统实现后补充）
        newLog([`获得金钱: ${finalGold}`])
        // TODO: 等金钱系统实现后，创建 GoldReward 对象

        // 2. 遗物奖励（带过滤）
        const selectedRelics = selectRelicsWithFilter(this.relicFilter)

        if (selectedRelics.length > 0) {
            // 使用动态 import 避免循环依赖
            const { RelicSelectReward } = await import("@/core/objects/reward/RelicSelectReward")
            const relicReward = new RelicSelectReward({
                type: "relicSelect",
                relicOptions: selectedRelics,
                selectCount: 1,
                title: "选择遗物"
            })
            rewards.push(relicReward)
        } else {
            newLog(["宝箱中没有遗物"])
        }

        return rewards
    }

    getDisplayName(): string {
        return this.name || "宝箱房间"
    }

    getIcon(): string {
        return "💎"
    }
}
