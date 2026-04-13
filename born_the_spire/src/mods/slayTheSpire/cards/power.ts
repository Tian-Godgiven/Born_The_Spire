/**
 * SlayTheSpire Mod - 能力牌
 */

import type { CardMap } from '@/core/objects/item/Subclass/Card'

export const thousandCutsCard: CardMap = {
    label: "凌迟",
    tags: ["power"],
    entry: ["card_power"],
    status: {
        cost: 2,
        stacks: 1
    },
    describe: [
        "你每打出一张牌，就对所有敌人造成",
        { key: ["status", "stacks"] }, "点伤害"
    ],
    key: "sts_card_thousand_cuts",
    interaction: {
        use: {
            target: { faction: "player", key: "self" },
            effects: [{
                key: "applyState",
                params: { stateKey: "thousandCuts", stacks: 1 }
            }]
        }
    },
    upgradeConfig: {
        maxLevel: 1,
        levelConfigs: {
            1: {
                status: { stacks: 2 },
                describe: [
                    "你每打出一张牌，就对所有敌人造成",
                    { key: ["status", "stacks"] }, "点伤害"
                ]
            }
        }
    }
}
