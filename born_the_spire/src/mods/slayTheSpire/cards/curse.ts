/**
 * SlayTheSpire Mod - 诅咒牌
 */

import type { CardMap } from '@/core/objects/item/Subclass/Card'

/**
 * 悔恨：不能被打出，在手牌中回合结束时失去等同于手牌数量的生命值
 */
export const regretCard: CardMap = {
    label: "悔恨",
    tags: ["curse"],
    entry: ["card_cannot_play"],
    status: {
        cost: -1
    },
    describe: [
        "不能被打出。在手牌中时，回合结束失去等同于手牌数量的生命值。"
    ],
    key: "sts_card_regret",
    interaction: {
        inHand: {
            target: { key: "owner" },
            triggers: [{
                when: "after",
                how: "make",
                key: "turnEnd",
                action: "regretDamage"
            }],
        }
    },
    reaction: {
        regretDamage: [{
            key: "regretDamage",
            label: "悔恨：失去生命",
            targetType: "owner",
            effect: [{
                key: "damage",
                params: { value: "$target.pileCount(hand)" }
            }]
        }]
    }
}

/**
 * 疑虑：不能被打出，在手牌中回合结束时获得1层虚弱
 */
/**
 * 受伤：不能被打出，仅占据手牌位置
 */
export const injuryCard: CardMap = {
    label: "受伤",
    tags: ["curse"],
    entry: ["card_cannot_play"],
    status: {
        cost: -1
    },
    describe: [
        "不能被打出。"
    ],
    key: "sts_card_injury",
    interaction: {}
}

/**
 * 疑虑：不能被打出，在手牌中回合结束时获得1层虚弱
 */
export const doubtCard: CardMap = {
    label: "疑虑",
    tags: ["curse"],
    entry: ["card_cannot_play"],
    status: {
        cost: -1
    },
    describe: [
        "不能被打出。在手牌中时，回合结束获得1层虚弱。"
    ],
    key: "sts_card_doubt",
    interaction: {
        inHand: {
            target: { key: "owner" },
            triggers: [{
                when: "after",
                how: "make",
                key: "turnEnd",
                action: "doubtWeaken"
            }],
        }
    },
    reaction: {
        doubtWeaken: [{
            key: "doubtWeaken",
            label: "疑虑：施加虚弱",
            targetType: "owner",
            effect: [{
                key: "applyState",
                params: { stateKey: "weak", stacks: 1 }
            }]
        }]
    }
}
