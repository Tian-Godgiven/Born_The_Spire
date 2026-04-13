/**
 * SlayTheSpire Mod - 诅咒牌
 */

import type { CardMap } from '@/core/objects/item/Subclass/Card'

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
