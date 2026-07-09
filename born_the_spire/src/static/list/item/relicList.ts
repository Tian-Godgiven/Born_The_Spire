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
        pool: ["common"],
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
        pool: ["common"],
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
    {
        label: "学者之戒",
        describe: ["第1回合多抽2张", "第2回合多抽1张"],
        key: "original_relic_00004",
        rarity: "common",
        pool: ["common"],
        interaction: {
            possess: {
                target: { key: "self" },
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "battleStart",
                    action: "applyScholarDraw"
                }]
            }
        },
        reaction: {
            applyScholarDraw: [{
                targetType: "owner",
                key: "applyScholarDraw",
                effect: [
                    { key: "addTurnDraw", params: { turn: 1, value: 2 } },
                    { key: "addTurnDraw", params: { turn: 2, value: 1 } }
                ]
            }]
        }
    },
    // 第一回合额外抽牌
    {
        label: "先手之戒",
        describe: ["第一回合", "额外抽", { key: ["status", "first-turn-draw"] }, "张牌"],
        key: "original_relic_00005",
        rarity: "common",
        pool: ["common"],
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
                    action: "applyFirstTurnDraw"
                }]
            }
        },
        reaction: {
            applyFirstTurnDraw: [{
                targetType: "owner",
                key: "applyFirstTurnDraw",
                effect: [{
                    key: "addTurnDraw",
                    params: { turn: 1, value: 2 }
                }]
            }]
        }
    },
    {
        label: "袖珍手枪",
        describe: ["战斗中右键使用：对指定敌人造成10点伤害", "3回合冷却（跨战斗）"],
        key: "original_relic_pistol",
        rarity: "uncommon",
        pool: ["common"],
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
        pool: ["common"],
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
        pool: ["common"],
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
        pool: ["common"],
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
        pool: ["common"],
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
        pool: ["common"],
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
        label: "过载电池",
        describe: ["每场战斗一次", "受到超过", { key: ["status", "minDamage"] }, "点伤害时", "回复", { key: ["status", "healAmount"] }, "生命"],
        key: "original_relic_overload_battery",
        rarity: "uncommon",
        pool: ["common"],
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
        pool: ["common"],
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
        pool: ["common"],
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
        pool: ["common"],
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
        pool: ["common"],
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
    {
        label: "卫士纹章",
        describe: ["每回合开始时", "获得", { key: ["status", "armor-gain"] }, "点护甲"],
        key: "original_relic_guardian_emblem",
        rarity: "common",
        pool: ["common"],
        status: {
            "armor-gain": 3
        },
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "turnStart",
                    action: "gainArmorOnTurnStart"
                }]
            }
        },
        reaction: {
            gainArmorOnTurnStart: [{
                targetType: "owner",
                key: "gainArmor",
                effect: [{
                    key: "gainArmor",
                    params: { value: 3 }
                }]
            }]
        }
    },
    {
        label: "药引",
        describe: ["每当有药水对你使用时,", "抽 1 张牌"],
        key: "original_relic_reagent",
        rarity: "common",
        pool: ["common"],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "useItem",
                    action: "drawOnPotionUsed",
                    condition: "$medium.itemType() == potion"
                }]
            }
        },
        reaction: {
            drawOnPotionUsed: [{
                targetType: "owner",
                key: "drawFromDrawPile",
                effect: [{
                    key: "drawFromDrawPile",
                    params: { value: 1 }
                }]
            }]
        }
    },
    {
        label: "拾荒袋",
        describe: ["每当你进入房间时,", "获得 5 金币"],
        key: "original_relic_scavenger_bag",
        rarity: "common",
        pool: ["common"],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "roomEnter",
                    action: "gainCoinOnRoomEnter"
                }]
            }
        },
        reaction: {
            gainCoinOnRoomEnter: [{
                targetType: "owner",
                key: "gainReserve",
                effect: [{
                    key: "gainReserve",
                    params: { reserveKey: "gold", amount: 5 }
                }]
            }]
        }
    },
    {
        label: "尖针",
        describe: ["每当你施加 debuff 时,", "对目标造成 5 点伤害"],
        key: "original_relic_needle",
        rarity: "uncommon",
        pool: ["uncommon"],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "applyState",
                    action: "damageOnDebuffApply",
                    condition: "$triggerEffect.stateCategory() == debuff"
                }]
            }
        },
        reaction: {
            damageOnDebuffApply: [{
                targetType: "target",
                key: "damage",
                effect: [{
                    key: "damage",
                    params: { value: 5 }
                }]
            }]
        }
    },
    {
        label: "鹫发",
        describe: ["每回合首次,", "你的非临时器官被摧毁时", "回复 5 生命"],
        key: "original_relic_vulture_plume",
        rarity: "uncommon",
        pool: ["uncommon"],
        status: {
            "used": 0
        },
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [
                    {
                        when: "after",
                        how: "take",
                        key: "breakOrgan",
                        condition: [
                            "$item.status(used) == 0",
                            { not: "$medium.isTemporary()" }
                        ],
                        action: "healAndLock"
                    },
                    {
                        when: "after",
                        how: "make",
                        key: "turnStart",
                        action: "resetUsed"
                    }
                ]
            }
        },
        reaction: {
            healAndLock: [
                {
                    targetType: "owner",
                    key: "heal",
                    effect: [{
                        key: "heal",
                        params: { value: 5 }
                    }]
                },
                {
                    targetType: "item",
                    key: "setBaseStatus",
                    effect: [{
                        key: "setBaseStatus",
                        params: { statusKey: "used", value: 1 }
                    }]
                }
            ],
            resetUsed: [{
                targetType: "item",
                key: "setBaseStatus",
                effect: [{
                    key: "setBaseStatus",
                    params: { statusKey: "used", value: 0 }
                }]
            }]
        }
    },
    {
        label: "祈愿石",
        describe: ["第 1 回合,", "你的能量归零时,", "获得 2 点能量"],
        key: "original_relic_wish_stone",
        rarity: "uncommon",
        pool: ["uncommon"],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "loseEnergy",
                    condition: [
                        "$battle.turn == 1",
                        "$owner.current(energy) == 0"
                    ],
                    disableUntil: "battleEnd",
                    action: "grantEnergy"
                }]
            }
        },
        reaction: {
            grantEnergy: [{
                targetType: "owner",
                key: "gainEnergy",
                effect: [{
                    key: "gainEnergy",
                    params: { value: 2 }
                }]
            }]
        }
    },
    {
        label: "口香糖",
        describe: ["伸缩自如的爱❤️"],
        key: "original_relic_bubble_gum",
        rarity: "rare",
        pool: ["rare"],
        status: {
            markedCardId: { label: "记号卡id", value: "", hidden: true, display: false, calc: false }
        },
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "chooseAndMarkCard",
                    params: {
                        title: "选一张牌作为记号",
                        description: "第 2 回合开始时，它会从抽/弃/消耗牌堆移入你的手牌",
                        fromPile: "deck",
                        storeKey: "markedCardId"
                    }
                }],
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "turnStart",
                    condition: "$battle.turn == 2",
                    disableUntil: "battleEnd",
                    action: "pullMarkedCard"
                }]
            }
        },
        reaction: {
            pullMarkedCard: [{
                targetType: "owner",
                key: "retrieveCardsToHand",
                effect: [{
                    key: "retrieveCardsToHand",
                    params: {
                        sourcePile: "any",
                        cardId: "$owner.status(markedCardId)"
                    }
                }]
            }]
        }
    },
    {
        label: "第六指",
        describe: ["每抽", { key: ["status", "maxPoint"] }, "张牌", "再抽1张"],
        key: "original_relic_sixth_finger",
        rarity: "rare",
        pool: ["rare"],
        status: {
            "point": 0,
            "maxPoint": 6
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
                        on: { when: "after", how: "take", key: "drawCard" },
                        gain: 1,
                        threshold: 6,
                        consume: 6,
                        targetType: "owner",
                        effects: [{ key: "drawFromDrawPile", params: { value: 1 } }]
                    }
                }]
            }
        }
    },
    // 商店遗物 - 会员卡
    {
        label: "会员卡",
        describe: ["所有商品打折", {key: ["status", "discount"]}, "%！"],
        key: "original_relic_membership_card",
        rarity: "rare",
        pool: ["shop"],
        status: {
            "discount": 50
        },
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "addStatusModifier",
                    params: {
                        statusKey: "shopDiscount",
                        modifierValue: 0.5,
                        targetLayer: "base",
                        modifierType: "multiplicative"
                    }
                }]
            }
        }
    },
    // ===== Boss 遗物 =====
    {
        label: "炽热之心",
        describe: ["能量上限 +1", "战斗结束时", "失去 3 点生命"],
        key: "original_relic_flaming_heart",
        rarity: "rare",
        pool: ["boss"],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "addStatusBase",
                    params: {
                        statusKey: "max-energy",
                        value: 1,
                        type: "additive"
                    }
                }],
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "battleEnd",
                    action: "flamingHeartCost"
                }]
            }
        },
        reaction: {
            flamingHeartCost: [{
                targetType: "owner",
                key: "loseHealth",
                effect: [{
                    key: "loseHealthTo",
                    params: { value: 3 }
                }]
            }]
        }
    },
    {
        label: "能量沉淀",
        describe: ["回合结束时未使用的能量", "在下回合开始时返还"],
        key: "original_relic_energy_sediment",
        rarity: "rare",
        pool: ["boss"],
        status: { storedEnergy: 0 },
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [
                    { when: "after", how: "take", key: "turnEnd",   action: "storeEnergy" },
                    { when: "after", how: "take", key: "turnStart", action: "releaseEnergy" }
                ]
            }
        },
        reaction: {
            storeEnergy: [{
                targetType: "triggerSource",
                key: "store",
                effect: [{
                    key: "setBaseStatus",
                    params: { statusKey: "storedEnergy", value: "$owner.current(energy)" }
                }]
            }],
            releaseEnergy: [
                {
                    targetType: "triggerOwner",
                    key: "release",
                    effect: [{ key: "gainEnergy", params: { value: "$item.status(storedEnergy)" } }]
                },
                {
                    targetType: "triggerSource",
                    key: "reset",
                    effect: [{ key: "setBaseStatus", params: { statusKey: "storedEnergy", value: 0 } }]
                }
            ]
        }
    },
    {
        label: "先知之瞳",
        describe: [
            "获得时能量上限 +2",
            "第 1 回合抽牌 +5",
            "第 3 回合起每回合抽牌 -1"
        ],
        key: "original_relic_prophet_eye",
        rarity: "rare",
        pool: ["boss"],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [
                    { key: "addStatusBase", params: { statusKey: "max-energy", value: 2, type: "additive" } },
                    { key: "addTurnDraw", params: { turn: 1, value: 5 } }
                ],
                triggers: [{
                    when: "before",
                    how: "take",
                    key: "turnStartDrawCard",
                    condition: "$battle.turn >= 3",
                    action: "reduceTurnDraw"
                }]
            }
        },
        reaction: {
            reduceTurnDraw: [{
                targetType: "triggerEffect",
                key: "modifyDrawValue",
                effect: [{ key: "modifyDrawValue", params: { delta: -1 } }]
            }]
        }
    },
]
/**
 * ○环 — 当遗物池耗尽时的垫底遗物
 * 没有任何效果，可以重复获得
 * 不在常规遗物池中，仅由 drawItem fallback 返回
 */
export const fallbackRelic: RelicMap = {
    label: "○环",
    describe: ["一个圆环。没有任何效果。", "你已经拿到了所有的遗物。"],
    key: "original_relic_fallback_circlet",
    rarity: "common",
    pool: ["fallback"],  // 独立池，不会被 common/shop 等常规池抽到
    interaction: {}
}

export async function getRelicByKey(relicKey: string) {
    // 先找常规遗物，再找 fallback
    const map = relicList.find(item => item.key == relicKey)
        ?? (relicKey === fallbackRelic.key ? fallbackRelic : undefined)
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
