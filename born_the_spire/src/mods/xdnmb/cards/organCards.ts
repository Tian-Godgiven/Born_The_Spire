/**
 * xdnmb Mod - 器官提供的卡牌
 */

import type { CardMap } from '@/core/objects/item/Subclass/Card'

export const venomspinePierceCard: CardMap = {
    label: "毒棘穿刺",
    tags: ["attack"],
    status: {
        damage: 2,
        times: 3,
        vulnStacks: 1,
        cost: 1
    },
    describe: [
        "造成", { key: ["status", "times"] }, "次",
        { key: ["status", "damage"] }, "点伤害",
        "\n每次命中给予", { key: ["status", "vulnStacks"] }, "层易伤"
    ],
    key: "xdnmb_card_000001",
    interaction: {
        use: {
            target: { faction: "opponent" },
            effects: [{
                key: "repeatEffects",
                params: {
                    times: 3,
                    effects: [{
                        key: "damage",
                        params: { value: 2 }
                    }, {
                        key: "applyState",
                        params: { stateKey: "vulnerable", stacks: 1 }
                    }]
                }
            }]
        }
    }
}
