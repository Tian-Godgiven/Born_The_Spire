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
    pool: ["shop"],
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

/**
 * 双发：下一张攻击牌打出两次（升级后为下2张）
 */
export const doubleTapCard: CardMap = {
    label: "双发",
    tags: ["skill"],
    status: {
        cost: 1,
        stacks: 1
    },
    describe: [
        "在这个回合，你打出的下", { key: ["status", "stacks"] }, "张攻击牌会打出两次。"
    ],
    key: "sts_card_double_tap",
    interaction: {
        use: {
            target: { faction: "player", key: "self" },
            effects: [{
                key: "applyState",
                params: { stateKey: "doubleTap", stacks: 1 }
            }]
        }
    },
    upgradeConfig: {
        maxLevel: 1,
        levelConfigs: {
            1: {
                status: { stacks: 2 },
                interaction: {
                    use: {
                        target: { faction: "player", key: "self" },
                        effects: [{
                            key: "applyState",
                            params: { stateKey: "doubleTap", stacks: 2 }
                        }]
                    }
                }
            }
        }
    }
}

/**
 * 致盲：给予虚弱，升级后目标全体敌人
 */
export const blindCard: CardMap = {
    label: "致盲",
    tags: ["skill"],
    pool: ["shop"],
    status: {
        cost: 0,
        stacks: 2
    },
    describe: [
        "给予", { key: ["status", "stacks"] }, "层虚弱。"
    ],
    key: "sts_card_blind",
    interaction: {
        use: {
            target: { faction: "enemy" },
            effects: [{
                key: "applyState",
                params: { stateKey: "weak", stacks: 2 }
            }]
        }
    },
    upgradeConfig: {
        maxLevel: 1,
        levelConfigs: {
            1: {
                describe: [
                    "给予所有敌人", { key: ["status", "stacks"] }, "层虚弱。"
                ],
                interaction: {
                    use: {
                        target: { faction: "enemy", number: "all" },
                        effects: [{
                            key: "applyState",
                            params: { stateKey: "weak", stacks: 2 }
                        }]
                    }
                }
            }
        }
    }
}

/**
 * 结茧：在抽牌堆中加入随机技能牌（费用为0），消耗
 */
export const chrysalisCard: CardMap = {
    label: "结茧",
    tags: ["skill"],
    pool: ["shop"],
    entry: ["card_exhaust"],
    status: {
        cost: 2,
        stacks: 3
    },
    describe: [
        "在你的抽牌堆中加入", { key: ["status", "stacks"] }, "张随机技能牌。",
        "它们在本场战斗中耗能为0。消耗。"
    ],
    key: "sts_card_chrysalis",
    interaction: {
        use: {
            target: { faction: "player", key: "self" },
            effects: [{
                key: "addRandomCardsToPile",
                params: {
                    count: 3,
                    tags: "skill",
                    pileName: "drawPile",
                    overrideCost: 0
                }
            }]
        }
    },
    upgradeConfig: {
        maxLevel: 1,
        levelConfigs: {
            1: {
                status: { stacks: 5 },
                interaction: {
                    use: {
                        target: { faction: "player", key: "self" },
                        effects: [{
                            key: "addRandomCardsToPile",
                            params: {
                                count: 5,
                                tags: "skill",
                                pileName: "drawPile",
                                overrideCost: 0
                            }
                        }]
                    }
                }
            }
        }
    }
}

/**
 * 深呼吸：弃牌堆洗入抽牌堆，抽牌
 */
export const deepBreathCard: CardMap = {
    label: "深呼吸",
    tags: ["skill"],
    pool: ["shop"],
    status: {
        cost: 0,
        draw: 1
    },
    describe: [
        "将你的弃牌堆洗牌后放入你的抽牌堆。",
        "抽", { key: ["status", "draw"] }, "张牌。"
    ],
    key: "sts_card_deep_breath",
    interaction: {
        use: {
            target: { faction: "player", key: "self" },
            effects: [{
                key: "shuffleDiscardIntoDraw",
                params: {}
            }, {
                key: "drawFromDrawPile",
                params: { value: 1 }
            }]
        }
    },
    upgradeConfig: {
        maxLevel: 1,
        levelConfigs: {
            1: {
                status: { draw: 2 },
                interaction: {
                    use: {
                        target: { faction: "player", key: "self" },
                        effects: [{
                            key: "shuffleDiscardIntoDraw",
                            params: {}
                        }, {
                            key: "drawFromDrawPile",
                            params: { value: 2 }
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
