/**
 * xdnmb Mod - 遗物
 */

import type { RelicMap } from '@/core/objects/item/Subclass/Relic'

export const bloodPrismRelic: RelicMap = {
    label: '血偿棱镜',
    describe: ['主动使用：选择一个友方非器官单位，对其造成', '6~12', '点随机伤害，然后对所有敌人造成该伤害的', '2', '倍'],
    key: 'xdnmb_relic_000001',
    rarity: 'rare',
    activeAbilities: [{
        key: 'prismaticSacrifice',
        label: '棱镜献祭',
        describe: ['选择一个友方非器官单位，对其造成6~12点随机伤害，然后对所有敌人造成该伤害的2倍'],
        usage: {
            type: 'selectTarget',
            target: { faction: 'player', key: 'nonOrgan' }
        },
        restrictions: {
            conditions: {
                scene: 'combat'
            }
        },
        effects: [{
            key: 'bloodPrismChainDamage',
            params: { min: 6, max: 12, multiplier: 2 }
        }]
    }],
    interaction: {}
}

export const wheelOfFateRelic: RelicMap = {
    label: "命运之轮",
    describe: [
        "偶数回合：每抽", {key:["status","drawThreshold"]}, "张牌，为抽牌堆随机2张牌添加效果（打出时抽2张牌）",
        "\n奇数回合：随机禁用所有敌人1个器官"
    ],
    key: "xdnmb_relic_000002",
    rarity: "rare",
    status: {
        "mode": {
            label: "模式",
            value: "even",
            calc: false,
            displayMap: { "even": "偶", "odd": "奇" }
        },
        "drawThreshold": {
            label: "抽牌阈值",
            value: 5,
            calc: false,
            display: false
        },
        "drawCount": {
            label: "抽牌计数",
            value: 0,
            calc: false,
            display: false,
            maxFrom: "drawThreshold"
        }
    },
    interaction: {
        possess: {
            target: { key: "owner" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                level: 100,
                action: "toggleMode"
            }, {
                when: "after",
                how: "make",
                key: "drawCard",
                condition: "source.status(mode) == even",
                action: "countDrawAndGiveEffect"
            }, {
                when: "after",
                how: "make",
                key: "turnStart",
                condition: "source.status(mode) == odd",
                action: "disableOrgans"
            }]
        }
    },
    reaction: {
        toggleMode: [{
            targetType: "self",
            key: "toggleStatus",
            effect: [{
                key: "toggleStatus",
                params: {
                    statusKey: "mode",
                    values: ["even", "odd"]
                }
            }]
        }],
        countDrawAndGiveEffect: [{
            targetType: "self",
            key: "countAndTrigger",
            effect: [{
                key: "countAndTrigger",
                params: {
                    countKey: "drawCount",
                    threshold: "$target.status.drawThreshold",
                    onTrigger: {
                        key: "giveTemporaryEffectToRandomCards",
                        targetType: "self",
                        effect: [{
                            key: "giveTemporaryEffectToRandomCards",
                            params: {
                                count: 2,
                                effectKey: "drawOnUseCard_bonus",
                                label: "额外抽牌",
                                describe: ["打出时抽", {key:["stackValue"]}, "张牌"],
                                effect: [{
                                    key: "drawFromDrawPile",
                                    params: { value: 2 }
                                }],
                                stackValue: 2,
                                sourceKey: "xdnmb_relic_000002"
                            }
                        }]
                    }
                }
            }]
        }],
        disableOrgans: [{
            targetType: "allEnemies",
            key: "disableRandomOrgans",
            effect: [{
                key: "disableRandomOrgans",
                params: { count: 1, cleanAt: "turnEnd" }
            }]
        }]
    }
}
