import type { RelicMap } from "@/core/objects/item/Subclass/Relic";
import { Relic } from "@/core/objects/item/Subclass/Relic";
import { createRelic } from "@/core/factories";
import type { BadgeConfig } from "@/core/types/BadgeConfig";

export const relicList: RelicMap[] = [
    // 被动遗物 - 只有 possess
    {
        label: "回血石",
        describe: ["战斗结束时", "回复", { key: ["status", "heal"] }, "生命"],
        key: "original_relic_00001",
        rarity: "common",
        status: {
            "heal": 5
        },
        interaction: {
            possess: {
                target: { key: "self" },
                effects: [],
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "battleEnd",
                    action: "healOwner"
                }]
            }
        },
        reaction: {
            healOwner: [{
                targetType: "owner",
                key: "heal",
                effect: [{
                    key: "heal",
                    params: { value: 5 }
                }]
            }]
        }
    },
    // 主动遗物 - 单个 use
    {
        label: "爆炸药瓶",
        describe: ["使用时", "对所有敌人造成", { key: ["status", "damage"] }, "伤害"],
        key: "original_relic_00002",
        rarity: "uncommon",
        status: {
            "damage": 10
        },
        activeAbilities: [{
            key: "throw",
            label: "投掷",
            describe: ["对所有敌人造成10点伤害"],
            usage: {
                type: "allTargets",
                target: { faction: "enemy", number: "all" }
            },
            disableAfterUse: true,
            effects: [{
                key: "damage",
                params: { value: 10 }
            }]
        }],
        interaction: {}
    },
    // 多功能遗物 - 多个 use
    {
        label: "神秘遗物",
        describe: ["可以激活、充能或粉碎"],
        key: "original_relic_00003",
        rarity: "rare",
        status: {
            "energy": 1,
            "draw": 2,
            "damage": 50
        },
        activeAbilities: [
            {
                key: "activate",
                label: "激活",
                describe: ["获得1点能量"],
                usage: { type: "direct" },
                effects: [{ key: "getEnergy", params: { value: 1 } }]
            },
            {
                key: "charge",
                label: "充能",
                describe: ["抽2张牌"],
                usage: { type: "direct" },
                effects: [{ key: "drawFromDrawPile", params: { value: 2 } }]
            },
            {
                key: "smash",
                label: "粉碎",
                describe: ["对所有敌人造成50点伤害"],
                usage: { type: "allTargets", target: { faction: "enemy", number: "all" } },
                effects: [{ key: "damage", params: { value: 50 } }]
            }
        ],
        interaction: {}
    },
    // 献祭遗物 - 解锁器官奖励中的献祭动作
    {
        label: "血祭之石",
        describe: ["战斗奖励中，器官选择时可以选择献祭，回复生命值"],
        key: "original_relic_sacrifice",
        rarity: "uncommon",
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "enableOrganRewardAction",
                    params: {
                        actionKey: "sacrifice"
                    }
                }],
            },
            lose: {
                target: { key: "owner" },
                effects: [{
                    key: "disableOrganRewardAction",
                    params: {
                        actionKey: "sacrifice"
                    }
                }]
            }
        }
    },
    // 示例：修改抽牌数量的遗物
    {
        label: "学者之戒",
        describe: ["每回合多抽", { key: ["status", "extra-draw"] }, "张牌"],
        key: "original_relic_00004",
        rarity: "common",
        status: {
            "extra-draw": 2
        },
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "addStatusBase",
                    params: {
                        statusKey: "draw-per-turn",
                        value: 2,
                        type: "additive"
                    }
                }]
            }
        }
    },
    // 第一回合额外抽牌
    {
        label: "先手之戒",
        describe: ["第一回合", "额外抽", { key: ["status", "first-turn-draw"] }, "张牌"],
        key: "original_relic_00005",
        rarity: "common",
        status: {
            "first-turn-draw": 2
        },
        interaction: {
            possess: {
                target: { key: "self" },
                effects: [],
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "battleStart",
                    action: "addFirstTurnDraw"
                }]
            }
        },
        reaction: {
            addFirstTurnDraw: [{
                targetType: "owner",
                key: "addFirstTurnDrawBonus",
                effect: [{
                    key: "addFirstTurnDraw",
                    params: { value: 2 }
                }]
            }]
        }
    },
    // 锻炼遗物 - 解锁水池中的锻炼行动
    {
        label: "健身手环",
        describe: ["水池中可以选择锻炼，消耗物质增加最大生命"],
        key: "original_relic_exercise",
        rarity: "uncommon",
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "enablePoolAction",
                    params: {
                        actionKey: "exercise"
                    }
                }]
            },
            lose: {
                target: { key: "owner" },
                effects: [{
                    key: "disablePoolAction",
                    params: {
                        actionKey: "exercise"
                    }
                }]
            }
        }
    },
    {
        label: "袖珍手枪",
        describe: ["战斗中右键使用：对指定敌人造成10点伤害", "3回合冷却（跨战斗）"],
        key: "original_relic_pistol",
        rarity: "uncommon",
        activeAbilities: [{
            key: "shoot",
            label: "射击",
            describe: ["对指定敌人造成10点伤害"],

            usage: {
                type: "selectTarget",
                target: { faction: "enemy" }
            },

            restrictions: {
                cooldown: 3,
                conditions: {
                    scene: "combat"
                }
            },

            effects: [{
                key: "damage",
                params: { value: 10 }
            }]
        }],
        interaction: {}
    },
    {
        label: "草莓",
        describe: ["获得时", "最大生命+5"],
        key: "original_relic_00006",
        rarity: "common",
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "addMaxHealthAndHeal",
                    params: { value: 5 }
                }]
            }
        }
    },
    {
        label: "金刚杵",
        describe: ["战斗开始时", "获得力量1层"],
        key: "original_relic_vajra",
        rarity: "uncommon",
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "battleStart",
                    action: "gainPower"
                }]
            }
        },
        reaction: {
            gainPower: [{
                targetType: "owner",
                key: "applyState",
                effect: [{
                    key: "applyState",
                    params: { stateKey: "power", stacks: 1 }
                }]
            }]
        }
    },
    {
        label: "荆棘手套",
        describe: ["每次打出卡牌时", "对随机一个敌人造成5点伤害"],
        key: "original_relic_thorns_glove",
        rarity: "common",
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "useCard",
                    action: "damageRandomEnemy"
                }]
            }
        },
        reaction: {
            damageRandomEnemy: [{
                targetType: "allEnemies.random",
                key: "damage",
                effect: [{
                    key: "damage",
                    params: { value: 5 }
                }]
            }]
        }
    },
    {
        label: "节拍器",
        describe: ["每3回合，回合开始时", "对随机敌人造成8点伤害"],
        key: "original_relic_metronome",
        rarity: "uncommon",
        status: {
            "cooldown": 3,
            "maxCooldown": 3
        },
        badges: [
            { type: "cooldown", status: "cooldown" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [
                    // 每回合递减冷却（level: 1，先于条件检查触发）
                    {
                        when: "after",
                        how: "make",
                        key: "turnStart",
                        level: 1,
                        action: "decrementCooldown"
                    },
                    // 冷却为0时触发效果并重置冷却
                    {
                        when: "after",
                        how: "make",
                        key: "turnStart",
                        condition: "$source.status(cooldown) <= 0",
                        action: "damageAndReset"
                    }
                ]
            }
        },
        reaction: {
            decrementCooldown: [{
                targetType: "triggerSource",
                key: "decrementCooldown",
                effect: [{
                    key: "decrementStatus",
                    params: { statusKey: "cooldown", amount: 1 }
                }]
            }],
            damageAndReset: [
                {
                    targetType: "allEnemies.random",
                    key: "damage",
                    effect: [{
                        key: "damage",
                        params: { value: 8 }
                    }]
                },
                {
                    targetType: "triggerSource",
                    key: "resetCooldown",
                    effect: [{
                        key: "resetCooldown",
                        params: {}
                    }]
                }
            ]
        }
    },
    {
        label: "吸血徽章",
        describe: ["每累积", { key: ["status", "point"] }, "/", { key: ["status", "maxPoint"] }, "点伤害", "回复1生命"],
        key: "original_relic_vampiric_badge",
        rarity: "uncommon",
        status: {
            "point": 0,
            "maxPoint": 10
        },
        badges: [
            { type: "counter", status: "point", maxStatus: "maxPoint" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "accumulateAndTrigger",
                    params: {
                        pointKey: "point",
                        on: { when: "after", how: "take", key: "damage" },
                        gain: "$triggerEffect.params(value)",
                        threshold: 10,
                        consume: 10,
                        targetType: "owner",
                        effects: [{ key: "heal", params: { value: 1 } }]
                    }
                }]
            }
        }
    },
    {
        label: "学者笔记",
        describe: ["每打出", { key: ["status", "maxPoint"] }, "张牌", "抽1张牌"],
        key: "original_relic_scholar_note",
        rarity: "common",
        status: {
            "point": 0,
            "maxPoint": 5
        },
        badges: [
            { type: "counter", status: "point", maxStatus: "maxPoint" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "accumulateAndTrigger",
                    params: {
                        pointKey: "point",
                        on: { when: "after", how: "make", key: "useCard" },
                        gain: 1,
                        threshold: 5,
                        consume: 5,
                        targetType: "owner",
                        effects: [{ key: "drawFromDrawPile", params: { value: 1 } }]
                    }
                }]
            }
        }
    },
    {
        label: "过载电池",
        describe: ["每场战斗一次", "受到超过", { key: ["status", "minDamage"] }, "点伤害时", "回复", { key: ["status", "healAmount"] }, "生命"],
        key: "original_relic_overload_battery",
        rarity: "uncommon",
        status: {
            "point": 0,
            "used": 0,
            "maxUse": 1,
            "minDamage": 10,
            "healAmount": 8
        },
        badges: [
            { type: "counter", status: "used", maxStatus: "maxUse" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "accumulateAndTrigger",
                    params: {
                        pointKey: "point",
                        usedKey: "used",
                        on: { when: "after", how: "take", key: "damage" },
                        gain: "$triggerEffect.params(value)",
                        minGain: 10,
                        threshold: 1,
                        consume: "all",
                        repeat: false,
                        maxTriggerPerBattle: 1,
                        targetType: "owner",
                        effects: [{ key: "heal", params: { value: 8 } }]
                    }
                }]
            }
        }
    },
    // 战前仪式：战斗开始时获得3层力量
    {
        label: "战前仪式",
        describe: ["战斗开始时", "获得3层力量"],
        key: "original_relic_pre_battle_ritual",
        rarity: "uncommon",
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "battleStart",
                    disableUntil: "battleEnd",
                    action: "gainPower3"
                }]
            }
        },
        reaction: {
            gainPower3: [{
                targetType: "owner",
                key: "applyState",
                effect: [{
                    key: "applyState",
                    params: { stateKey: "power", stacks: 3 }
                }]
            }]
        }
    },
    // 怒气结晶：每次受到伤害，获得1层力量
    {
        label: "怒气结晶",
        describe: ["每次受到伤害", "获得1层力量"],
        key: "original_relic_rage_crystal",
        rarity: "uncommon",
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "damage",
                    action: "gainPowerOnDamage"
                }]
            }
        },
        reaction: {
            gainPowerOnDamage: [{
                targetType: "owner",
                key: "applyState",
                effect: [{
                    key: "applyState",
                    params: { stateKey: "power", stacks: 1 }
                }]
            }]
        }
    },
    {
        label: "低血战旗",
        describe: ["每回合开始，当生命低于50%时", "获得2层力量"],
        key: "original_relic_low_health_banner",
        rarity: "rare",
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "turnStart",
                    condition: "$owner.current(health) <= 50%",
                    action: "gainPower2"
                }]
            }
        },
        reaction: {
            gainPower2: [{
                targetType: "owner",
                key: "applyState",
                effect: [{
                    key: "applyState",
                    params: { stateKey: "power", stacks: 2 }
                }]
            }]
        }
    },
    // 热血腰带：每回合开始获得3层临时力量（回合结束失去）
    {
        label: "热血腰带",
        describe: ["每回合开始", "获得3层临时力量"],
        key: "original_relic_hot_belt",
        rarity: "rare",
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "turnStart",
                    action: "gainTempPower"
                }]
            }
        },
        reaction: {
            gainTempPower: [
                {
                    targetType: "owner",
                    key: "applyState",
                    effect: [{ key: "applyState", params: { stateKey: "power", stacks: 3 } }]
                },
                {
                    targetType: "owner",
                    key: "applyState",
                    effect: [{ key: "applyState", params: { stateKey: "tempPower", stacks: 3 } }]
                }
            ]
        }
    },
]
export async function getRelicByKey(relicKey: string) {
    // 获取数据
    const map = relicList.find(item => item.key == relicKey)
    if (!map) {
        throw new Error(`不存在的遗物key: ${relicKey}`)
    }
    // 生成遗物对象
    const relic = await createRelic(map)
    return relic
}

/**
 * 获取所有遗物数据
 */
export function getAllRelics(): RelicMap[] {
    return [...relicList]
}
