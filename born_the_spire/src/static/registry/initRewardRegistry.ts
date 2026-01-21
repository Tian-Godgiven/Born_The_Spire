/**
 * 初始化奖励注册表
 * 注册所有基础奖励类型
 */

import { rewardRegistry } from "./rewardRegistry"
import { GoldReward } from "@/core/objects/reward/GoldReward"
import { OrganSelectReward } from "@/core/objects/reward/OrganSelectReward"
import { RelicReward } from "@/core/objects/reward/RelicReward"
import { PotionReward } from "@/core/objects/reward/PotionReward"

/**
 * 初始化奖励注册表
 * 在应用启动时调用
 */
export function initRewardRegistry(): void {
    console.log("[initRewardRegistry] 开始初始化奖励注册表")

    // 注册基础奖励类型
    rewardRegistry.registerRewardType("gold", GoldReward)
    rewardRegistry.registerRewardType("organSelect", OrganSelectReward)
    rewardRegistry.registerRewardType("relic", RelicReward)
    rewardRegistry.registerRewardType("potion", PotionReward)

    console.log("[initRewardRegistry] 奖励注册表初始化完成")
}

/**
 * 为 mod 制作者提供的扩展接口
 * Mod 可以调用此函数注册自定义奖励类型
 */
export function registerCustomRewardType(
    type: string,
    rewardClass: Parameters<typeof rewardRegistry.registerRewardType>[1]
): void {
    rewardRegistry.registerRewardType(type, rewardClass)
}
