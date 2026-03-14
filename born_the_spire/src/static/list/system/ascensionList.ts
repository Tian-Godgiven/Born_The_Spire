import type { AscensionConfig } from "@/core/types/AscensionConfig"
import { createAscensionModifier } from "@/core/utils/ascensionHelper"

/**
 * 进阶配置列表
 *
 * 每个进阶等级定义了一组触发器，用于修改游戏难度
 */
export const ascensionList: AscensionConfig[] = [
    // 进阶 0 - 基础难度（无修饰器）
    {
        level: 0,
        triggers: []
    },

    // 进阶 1 - 敌人生命 +10%
    {
        level: 1,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.1
        })]
    },

    // 进阶 2 - 敌人生命 +20%
    {
        level: 2,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.2
        })]
    },

    // 进阶 3 - 敌人生命 +20%, 敌人伤害 +10%
    {
        level: 3,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.2,
            enemyDamageMultiplier: 0.1
        })]
    },

    // 进阶 4 - 敌人生命 +30%, 敌人伤害 +10%
    {
        level: 4,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.3,
            enemyDamageMultiplier: 0.1
        })]
    },

    // 进阶 5 - 敌人生命 +30%, 敌人伤害 +20%, 精英生命 +25%
    {
        level: 5,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.3,
            enemyDamageMultiplier: 0.2,
            eliteHealthMultiplier: 1.25
        })]
    },

    // 进阶 6 - 敌人生命 +40%, 敌人伤害 +20%, 精英生命 +25%
    {
        level: 6,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.4,
            enemyDamageMultiplier: 0.2,
            eliteHealthMultiplier: 1.25
        })]
    },

    // 进阶 7 - 敌人生命 +40%, 敌人伤害 +30%, 精英生命 +25%, 精英伤害 +25%
    {
        level: 7,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.4,
            enemyDamageMultiplier: 0.3,
            eliteHealthMultiplier: 1.25,
            eliteDamageMultiplier: 0.25
        })]
    },

    // 进阶 8 - 敌人生命 +50%, 敌人伤害 +30%, 精英生命 +50%, 精英伤害 +25%
    {
        level: 8,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.5,
            enemyDamageMultiplier: 0.3,
            eliteHealthMultiplier: 1.5,
            eliteDamageMultiplier: 0.25
        })]
    },

    // 进阶 9 - 敌人生命 +50%, 敌人伤害 +40%, 精英生命 +50%, 精英伤害 +50%
    {
        level: 9,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.5,
            enemyDamageMultiplier: 0.4,
            eliteHealthMultiplier: 1.5,
            eliteDamageMultiplier: 0.5
        })]
    },

    // 进阶 10 - 敌人生命 +50%, 敌人伤害 +40%, 精英生命 +50%, 精英伤害 +50%, Boss生命 +25%
    {
        level: 10,
        triggers: [createAscensionModifier({
            enemyHealthMultiplier: 1.5,
            enemyDamageMultiplier: 0.4,
            eliteHealthMultiplier: 1.5,
            eliteDamageMultiplier: 0.5,
            bossHealthMultiplier: 1.25
        })]
    }
]

/**
 * 根据进阶等级获取配置
 */
export function getAscensionConfig(level: number): AscensionConfig | null {
    return ascensionList.find(config => config.level === level) || null
}

/**
 * 获取最大进阶等级
 */
export function getMaxAscensionLevel(): number {
    return Math.max(...ascensionList.map(config => config.level))
}
