import { TriggerMap } from "@/core/types/object/trigger"
import { SimpleAscensionModifiers } from "@/core/types/AscensionConfig"

/**
 * 将简化的进阶修饰器配置转换为触发器配置
 * 这个函数提供了一个简洁的API来创建进阶配置
 */
export function createAscensionModifier(config: SimpleAscensionModifiers): TriggerMap {
    const triggers: TriggerMap = []

    // ========== 敌人属性修饰器 ==========

    // 敌人生命倍率
    if (config.enemyHealthMultiplier) {
        triggers.push({
            when: "after",
            how: "make",
            key: "enemyCreation",
            event: [{
                targetType: "eventTarget",
                key: "modifyStatus",
                effect: [{
                    key: "multiplyStatusBase",
                    params: {
                        statusKey: "max-health",
                        multiplier: config.enemyHealthMultiplier
                    }
                }, {
                    key: "setCurrentToMax",
                    params: {
                        currentKey: "health",
                        statusKey: "max-health"
                    }
                }]
            }]
        })
    }

    // 敌人伤害倍率
    if (config.enemyDamageMultiplier) {
        triggers.push({
            when: "after",
            how: "make",
            key: "enemyCreation",
            event: [{
                targetType: "eventTarget",
                key: "modifyStatus",
                effect: [{
                    key: "addStatusModifier",
                    params: {
                        statusKey: "attack",
                        targetLayer: "base",
                        modifierType: "multiplicative",
                        modifierValue: config.enemyDamageMultiplier,
                        label: "进阶难度"
                    }
                }]
            }]
        })
    }

    // ========== 精英敌人修饰器 ==========

    // 精英生命倍率
    if (config.eliteHealthMultiplier) {
        triggers.push({
            when: "after",
            how: "make",
            key: "enemyCreation",
            event: [{
                targetType: "eventTarget",
                key: "modifyStatus",
                effect: [{
                    key: "multiplyStatusBase",
                    params: {
                        statusKey: "max-health",
                        multiplier: config.eliteHealthMultiplier,
                        onlyIfElite: true
                    }
                }, {
                    key: "setCurrentToMax",
                    params: {
                        currentKey: "health",
                        statusKey: "max-health",
                        onlyIfElite: true
                    }
                }]
            }]
        })
    }

    // 精英伤害倍率
    if (config.eliteDamageMultiplier) {
        triggers.push({
            when: "after",
            how: "make",
            key: "enemyCreation",
            event: [{
                targetType: "eventTarget",
                key: "modifyStatus",
                effect: [{
                    key: "addStatusModifier",
                    params: {
                        statusKey: "attack",
                        targetLayer: "base",
                        modifierType: "multiplicative",
                        modifierValue: config.eliteDamageMultiplier,
                        label: "进阶难度（精英）",
                        onlyIfElite: true
                    }
                }]
            }]
        })
    }

    // ========== Boss修饰器 ==========

    // Boss生命倍率
    if (config.bossHealthMultiplier) {
        triggers.push({
            when: "after",
            how: "make",
            key: "enemyCreation",
            event: [{
                targetType: "eventTarget",
                key: "modifyStatus",
                effect: [{
                    key: "multiplyStatusBase",
                    params: {
                        statusKey: "max-health",
                        multiplier: config.bossHealthMultiplier,
                        onlyIfBoss: true
                    }
                }, {
                    key: "setCurrentToMax",
                    params: {
                        currentKey: "health",
                        statusKey: "max-health",
                        onlyIfBoss: true
                    }
                }]
            }]
        })
    }

    // Boss伤害倍率
    if (config.bossDamageMultiplier) {
        triggers.push({
            when: "after",
            how: "make",
            key: "enemyCreation",
            event: [{
                targetType: "eventTarget",
                key: "modifyStatus",
                effect: [{
                    key: "addStatusModifier",
                    params: {
                        statusKey: "attack",
                        targetLayer: "base",
                        modifierType: "multiplicative",
                        modifierValue: config.bossDamageMultiplier,
                        label: "进阶难度（Boss）",
                        onlyIfBoss: true
                    }
                }]
            }]
        })
    }

    return triggers
}
