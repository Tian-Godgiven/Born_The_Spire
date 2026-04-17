/**
 * SlayTheSpire Mod - 技能牌
 */

import type { CardMap } from '@/core/objects/item/Subclass/Card'

/**
 * 万能药：获得人工制品，消耗
 */
export const panaceaCard: CardMap = {
    label: "万能药",
    tags: ["skill"],
    entry: ["card_exhaust"],
    status: {
        cost: 0,
        stacks: 1
    },
    describe: [
        "获得", { key: ["status", "stacks"] }, "层人工制品。消耗。"
    ],
    key: "sts_card_panacea",
    interaction: {
        use: {
            target: { faction: "player", key: "self" },
            effects: [{
                key: "applyState",
                params: { stateKey: "artifact", stacks: 1 }
            }]
        }
    },
    upgradeConfig: {
        maxLevel: 1,
        levelConfigs: {
            1: {
                status: { stacks: 2 },
                describe: [
                    "获得", { key: ["status", "stacks"] }, "层人工制品。消耗。"
                ]
            }
        }
    }
}

/**
 * 尖啸：所有敌人失去力量一回合，消耗
 */
export const piercingWailCard: CardMap = {
    label: "尖啸",
    tags: ["skill"],
    entry: ["card_exhaust"],
    status: {
        cost: 1,
        stacks: 6
    },
    describe: [
        "所有敌人失去", { key: ["status", "stacks"] }, "点力量（一回合）。消耗。"
    ],
    key: "sts_card_piercing_wail",
    interaction: {
        use: {
            target: { faction: "enemy", number: "all" },
            effects: [{
                key: "applyState",
                params: { stateKey: "power", stacks: -6 }
            }, {
                key: "applyState",
                params: { stateKey: "tempPower", stacks: -6 }
            }]
        }
    },
    upgradeConfig: {
        maxLevel: 1,
        levelConfigs: {
            1: {
                status: { stacks: 8 },
                interaction: {
                    use: {
                        target: { faction: "enemy", number: "all" },
                        effects: [{
                            key: "applyState",
                            params: { stateKey: "power", stacks: -8 }
                        }, {
                            key: "applyState",
                            params: { stateKey: "tempPower", stacks: -8 }
                        }]
                    }
                }
            }
        }
    }
}

export const preparedCard: CardMap = {
    label: "准备",
    tags: ["skill"],
    status: {
        draw: 1,
        discardCount: 1,
        cost: 0
    },
    describe: [
        "抽", { key: ["status", "draw"] }, "张牌，选择",
        { key: ["status", "discardCount"] }, "张牌丢弃"
    ],
    key: "sts_card_prepared",
    interaction: {
        use: {
            target: { faction: "player", key: "self" },
            effects: [{
                key: "drawFromDrawPile",
                params: { value: 1 }
            }, {
                key: "chooseHandCardDiscard",
                params: { count: 1, cancelable: false }
            }]
        }
    },
    upgradeConfig: {
        maxLevel: 1,
        levelConfigs: {
            1: {
                status: { draw: 2, discardCount: 1 }
            }
        }
    }
}
