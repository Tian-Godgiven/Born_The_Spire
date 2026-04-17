/**
 * SlayTheSpire Mod - 金神像遗物
 * 原作效果：敌人掉落的金币增加25%
 */

import type { RelicMap } from '@/core/objects/item/Subclass/Relic'

export const goldenIdolRelic: RelicMap = {
    label: "金神像",
    tags: ["sts"],
    describe: ["获得的金币增加25%"],
    key: "sts_relic_golden_idol",
    rarity: "common",
    interaction: {
        possess: {
            target: { key: "owner" },
            triggers: [{
                when: "after",
                how: "take",
                key: "gainReserve",
                condition: "$triggerEffect.params(reserveKey) == gold",
                action: "bonusGold"
            }]
        }
    },
    reaction: {
        bonusGold: [{
            key: "bonusGold",
            label: "金神像：额外金币",
            targetType: "owner",
            effect: [{
                key: "gainReserve",
                params: { reserveKey: "gold", amount: "$triggerEffect.params(amount) * 0.25" }
            }]
        }]
    }
}
