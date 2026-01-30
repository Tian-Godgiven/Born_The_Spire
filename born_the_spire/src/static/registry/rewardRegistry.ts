/**
 * 奖励注册表系统
 * 支持 mod 制作者注册自定义奖励类型
 */

import { Reward, RewardConfig } from "@/core/objects/reward/Reward"

/**
 * 奖励类构造函数类型
 */
export type RewardConstructor = new (config: any) => Reward

/**
 * 奖励类型注册信息
 */
interface RewardTypeRegistration {
    rewardClass: RewardConstructor
}

/**
 * 奖励注册表类
 * 管理所有奖励类型
 */
class RewardRegistry {
    // 奖励类型映射表（type -> RewardClass）
    private rewardTypes: Map<string, RewardTypeRegistration> = new Map()

    /**
     * 注册奖励类型
     * @param type 奖励类型标识
     * @param rewardClass 奖励类
     */
    registerRewardType(type: string, rewardClass: RewardConstructor): void {
        if (this.rewardTypes.has(type)) {
            console.warn(`[RewardRegistry] 奖励类型 "${type}" 已存在，将被覆盖`)
        }

        this.rewardTypes.set(type, { rewardClass })
    }

    /**
     * 获取奖励类型注册信息
     * @param type 奖励类型
     */
    getRewardType(type: string): RewardTypeRegistration | undefined {
        return this.rewardTypes.get(type)
    }

    /**
     * 创建奖励实例
     * @param config 奖励配置
     */
    createReward(config: RewardConfig): Reward | null {
        const typeRegistration = this.getRewardType(config.type)
        if (!typeRegistration) {
            console.error(`[RewardRegistry] 未注册奖励类型: ${config.type}`)
            return null
        }

        try {
            const reward = new typeRegistration.rewardClass(config)
            return reward
        } catch (error) {
            console.error(`[RewardRegistry] 创建奖励实例失败: ${config.type}`, error)
            return null
        }
    }

    /**
     * 批量创建奖励实例
     * @param configs 奖励配置数组
     */
    createRewards(configs: RewardConfig[]): Reward[] {
        return configs
            .map(config => this.createReward(config))
            .filter((reward): reward is Reward => reward !== null)
    }

    /**
     * 获取所有已注册的奖励类型
     */
    getAllRewardTypes(): string[] {
        return Array.from(this.rewardTypes.keys())
    }

    /**
     * 清空注册表（用于测试）
     */
    clear(): void {
        this.rewardTypes.clear()
    }
}

// 导出单例
export const rewardRegistry = new RewardRegistry()

// 导出类型供外部使用
export type { RewardTypeRegistration }
