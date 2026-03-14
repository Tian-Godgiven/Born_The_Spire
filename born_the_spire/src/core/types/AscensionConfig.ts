import type { TriggerMap } from "./object/trigger"

/**
 * 进阶系统配置
 */
export interface AscensionConfig {
    level: number
    triggers: TriggerMap[]
}

/**
 * 简化的进阶修饰器配置（用于生成触发器）
 */
export interface SimpleAscensionModifiers {
    // 敌人属性修饰器
    enemyHealthMultiplier?: number      // 敌人生命倍率
    enemyDamageMultiplier?: number      // 敌人伤害倍率

    // 精英敌人修饰器
    eliteHealthMultiplier?: number      // 精英生命倍率
    eliteDamageMultiplier?: number      // 精英伤害倍率

    // Boss修饰器
    bossHealthMultiplier?: number       // Boss生命倍率
    bossDamageMultiplier?: number       // Boss伤害倍率

    // 奖励修饰器
    cardRewardCount?: number            // 卡牌奖励数量修正（+/-）
    organRewardCount?: number           // 器官奖励数量修正（+/-）
    goldRewardMultiplier?: number       // 金币奖励倍率

    // 玩家修饰器
    playerStartHealthMultiplier?: number  // 玩家初始生命倍率
    playerStartEnergyModifier?: number    // 玩家初始能量修正（+/-）
}
