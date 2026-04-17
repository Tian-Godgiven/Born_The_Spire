/**
 * SlayTheSpire Mod - 攻击牌
 */

import type { CardMap } from '@/core/objects/item/Subclass/Card'

/**
 * 万物一心：造成伤害，将弃牌堆中所有0费牌取回手牌
 */
export const allForOneCard: CardMap = {
    label: "万物一心",
    tags: ["attack"],
    status: {
        cost: 2,
        damage: 10
    },
    describe: [
        "造成", { key: ["status", "damage"] }, "点伤害。",
        "将弃牌堆中所有耗能为0的牌放入你的手牌。"
    ],
    key: "sts_card_all_for_one",
    interaction: {
        use: {
            target: { faction: "enemy" },
            effects: [{
                key: "damage",
                params: { value: 10 }
            }, {
                key: "retrieveCardsToHand",
                params: { sourcePile: "discardPile", cost: 0 },
                target: "player"
            }]
        }
    }
}

/**
 * 爪击：造成伤害，所有爪击牌伤害永久+2
 */
export const clawCard: CardMap = {
    label: "爪击",
    tags: ["attack"],
    status: {
        cost: 0,
        damage: 3
    },
    describe: [
        "造成", { key: ["status", "damage"] }, "点伤害。",
        "在本场战斗中所有爪击牌的伤害增加2。"
    ],
    key: "sts_card_claw",
    interaction: {
        use: {
            target: { faction: "enemy" },
            effects: [{
                key: "damage",
                params: { value: "$medium.status(damage)" }
            }, {
                key: "addStatusCurrent",
                params: { statusKey: "damage", value: 2, removeTiming: "battleEnd" },
                target: "allCardsByKey(sts_card_claw)"
            }]
        }
    }
}

/**
 * 匕首雨：对所有敌人造成伤害2次
 */
export const daggerSprayCard: CardMap = {
    label: "匕首雨",
    tags: ["attack"],
    status: {
        cost: 1,
        damage: 4,
        times: 2
    },
    describe: [
        "对所有敌人造成", { key: ["status", "damage"] }, "点伤害",
        { key: ["status", "times"] }, "次"
    ],
    key: "sts_card_dagger_spray",
    interaction: {
        use: {
            target: { faction: "enemy", number: "all" },
            effects: [{
                key: "damage",
                params: { value: 4 }
            }, {
                key: "damage",
                params: { value: 4 }
            }]
        }
    },
    upgradeConfig: {
        maxLevel: 1,
        levelConfigs: {
            1: {
                status: { damage: 6 },
                interaction: {
                    use: {
                        target: { faction: "enemy", number: "all" },
                        effects: [{
                            key: "damage",
                            params: { value: 6 }
                        }, {
                            key: "damage",
                            params: { value: 6 }
                        }]
                    }
                }
            }
        }
    }
}
