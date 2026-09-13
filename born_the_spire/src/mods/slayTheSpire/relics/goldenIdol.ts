/**
 * SlayTheSpire Mod - 金神像遗物
 * 原作效果：敌人掉落的金币增加25%
 * pool: exclusive，只从金神像事件获得，不进通用遗物奖励
 */

import type { RelicMap } from '@/core/objects/item/Subclass/Relic'

export const goldenIdolRelic: RelicMap = {
    label: "金神像",
    tags: ["sts"],
    describe: ["获得的金币增加25%"],
    key: "sts_relic_golden_idol",
    rarity: "common",
    pool: ["exclusive"],
    interaction: {
        possess: {
            target: { key: "owner" },
            triggers: [{
                when: "before",
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
            targetType: "triggerEffect",
            effect: [{
                key: "modifyReserveByPercent",
                params: { percent: 0.25 }
            }]
        }]
    }
}
