import { RelicMap } from "@/core/objects/item/Subclass/Relic"

/**
 * 测试遗物：治疗药剂
 * 主动能力：右键使用，消耗1点能量，回复5点生命
 */
export const testHealingPotion: RelicMap = {
    label: "治疗药剂",
    key: "test_healing_potion",
    describe: ["右键使用：消耗1点能量，回复5点生命"],
    rarity: "common",

    activeAbilities: [{
        key: "heal",
        label: "治疗",
        describe: ["消耗1点能量，回复5点生命"],

        usage: {
            type: "direct"
        },

        restrictions: {
            costs: {
                energy: 1
            },
            uses: {
                perTurn: 1
            },
            conditions: {
                scene: "combat"
            }
        },

        effects: [{
            key: "heal",
            params: { value: 5 }
        }]
    }],

    interaction: {}
}

/**
 * 测试遗物：能量核心
 * 主动能力：右键弹出菜单，可选择获得能量或抽牌
 */
export const testEnergyCore: RelicMap = {
    label: "能量核心",
    key: "test_energy_core",
    describe: ["右键使用：选择获得2点能量或抽2张牌"],
    rarity: "uncommon",

    activeAbilities: [{
        key: "energyChoice",
        label: "能量选择",
        describe: ["选择获得能量或抽牌"],

        usage: {
            type: "direct"
        },

        restrictions: {
            uses: {
                perTurn: 1
            },
            conditions: {
                scene: "combat"
            }
        },

        effects: [{
            key: "getEnergy",
            params: { value: 2 }
        }]
    }, {
        key: "gainEnergy",
        label: "获得能量",
        describe: ["获得2点能量"],

        usage: {
            type: "direct"
        },

        effects: [{
            key: "getEnergy",
            params: { value: 2 }
        }]
    }, {
        key: "drawCards",
        label: "抽牌",
        describe: ["抽2张牌"],

        usage: {
            type: "direct"
        },

        effects: [{
            key: "drawFromDrawPile",
            params: { value: 2 }
        }]
    }],

    interaction: {}
}

/**
 * 测试器官：强化心脏
 * 主动能力：开关型，激活时每回合开始获得1点力量
 */
export const testEnhancedHeart = {
    label: "强化心脏",
    key: "test_enhanced_heart",
    describe: ["右键切换：激活时每回合开始获得1点力量"],
    rarity: "uncommon" as const,

    activeAbilities: [{
        key: "powerBoost",
        label: "力量增强",
        describe: ["激活时每回合开始获得1点力量"],

        usage: {
            type: "toggle"
        },

        restrictions: {
            costs: {
                energy: 1
            },
            conditions: {
                scene: "combat"
            }
        },

        effects: [{
            key: "costEnergy",
            params: { value: 1 }
        }]
    }],

    interaction: {}
}

export const testActiveAbilityItems = {
    testHealingPotion,
    testEnergyCore,
    testEnhancedHeart
}