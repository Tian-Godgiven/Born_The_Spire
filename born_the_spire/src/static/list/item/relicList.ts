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
                key: "attack",
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
                    how: "take",
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
                    how: "take",
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
                key: "attack",
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
        describe: ["每次打出卡牌时", "对随机一个敌人造成3点伤害"],
        key: "original_relic_thorns_glove",
        rarity: "uncommon",
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
                    key: "attack",
                    params: { value: 3 }
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
                        key: "attack",
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
        label: "祸福轮",
        describe: [
            "每3回合，回合开始时",
            "对场上随机一个目标造成", { key: ["status", "damage"] }, "点伤害，",
            "对另一个随机目标回复", { key: ["status", "heal"] }, "点生命"
        ],
        key: "original_relic_weal_and_woe",
        rarity: "uncommon",
        pool: ["common"],
        status: {
            "cooldown": 3,
            "maxCooldown": 3,
            "damage": 3,
            "heal": 3
        },
        badges: [
            { type: "cooldown", status: "cooldown" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [
                    {
                        when: "after",
                        how: "make",
                        key: "turnStart",
                        level: 1,
                        action: "decrementCooldown"
                    },
                    {
                        when: "after",
                        how: "make",
                        key: "turnStart",
                        condition: "$source.status(cooldown) <= 0",
                        action: "harmAndHeal"
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
            harmAndHeal: [
                {
                    targetType: "allEntities.random",
                    key: "damage",
                    effect: [{
                        key: "attack",
                        params: { value: "$item.status(damage)" }
                    }]
                },
                {
                    targetType: "allEntities.except(pickedTargets).random",
                    key: "heal",
                    effect: [{
                        key: "heal",
                        params: { value: "$item.status(heal)" }
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
                        on: { when: "after", how: "take", key: ["attack", "damage"] },
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
                        on: { when: "after", how: "take", key: ["attack", "damage"] },
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
                    key: ["attack", "damage"],
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
                    key: "attack",
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
                sourceTargetType: "triggerOwner",
                targetType: "triggerSource",
                key: "store",
                effect: [{
                    key: "setBaseStatus",
                    params: { statusKey: "storedEnergy", value: "$source.current(energy)" }
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
    {
        label: "空茧",
        describe: [
            "获得时，从牌组中",
            "永久移除 2 张牌",
            "最大生命 -10%"
        ],
        key: "original_relic_empty_cocoon",
        rarity: "rare",
        pool: ["boss"],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [
                    { key: "addMaxHealthAndHeal", params: { percent: -0.1 } },
                    { key: "chooseCardRemove", params: { count: 2, minCount: 2 } }
                ]
            }
        }
    },
    {
        label: "有生命活铁",
        describe: [
            "每 3 回合，回合开始时",
            "获得 10 点护甲（跨战斗累计）"
        ],
        key: "original_relic_living_iron",
        rarity: "rare",
        pool: ["boss"],
        status: {
            "point": 0,
            "maxPoint": 3
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
                        on: { when: "after", how: "make", key: "turnStart" },
                        gain: 1,
                        threshold: 3,
                        consume: 3,
                        targetType: "owner",
                        effects: [{ key: "gainArmor", params: { value: 10 } }]
                    }
                }]
            }
        }
    },
    {
        label: "晨昏日晷",
        describe: ["偶数回合开始时", "获得 1 点能量"],
        key: "original_relic_solar_dial",
        rarity: "uncommon",
        pool: ["shop"],
        status: {
            "cooldown": 2,
            "maxCooldown": 2
        },
        badges: [
            { type: "cooldown", status: "cooldown" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [
                    {
                        when: "after",
                        how: "make",
                        key: "turnStart",
                        level: 1,
                        action: "decrementCooldown"
                    },
                    {
                        when: "after",
                        how: "make",
                        key: "turnStart",
                        condition: "$source.status(cooldown) <= 0",
                        action: "gainEnergyAndReset"
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
            gainEnergyAndReset: [
                {
                    targetType: "owner",
                    key: "gainEnergy",
                    effect: [{
                        key: "gainEnergy",
                        params: { value: 1 }
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
        label: "血债契约",
        describe: ["击杀敌人时", "获得 2 金币"],
        key: "original_relic_blood_contract",
        rarity: "rare",
        pool: ["shop"],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "death",
                    action: "gainGoldOnKill"
                }]
            }
        },
        reaction: {
            gainGoldOnKill: [{
                targetType: "owner",
                key: "gainReserve",
                effect: [{
                    key: "gainReserve",
                    params: { reserveKey: "gold", amount: 2 }
                }]
            }]
        }
    },
    {
        label: "银月项链",
        describe: ["回合开始时若生命满值", "额外抽 2 张牌"],
        key: "original_relic_silver_moon_necklace",
        rarity: "uncommon",
        pool: ["shop"],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "turnStart",
                    condition: "$owner.hpPercent >= 1.0",
                    action: "drawOnFullHp"
                }]
            }
        },
        reaction: {
            drawOnFullHp: [{
                targetType: "owner",
                key: "drawFromDrawPile",
                effect: [{
                    key: "drawFromDrawPile",
                    params: { value: 2 }
                }]
            }]
        }
    },
    {
        label: "金铸头骨",
        describe: [
            "受致命伤害时消耗 200 金币复活",
            "并回复 50% 最大生命",
            "本次运行仅 1 次"
        ],
        key: "original_relic_gilded_skull",
        rarity: "rare",
        pool: ["shop"],
        status: {
            "used": 0,
            "maxUse": 1
        },
        badges: [
            { type: "counter", status: "used", maxStatus: "maxUse" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "before",
                    how: "take",
                    key: "dead",
                    condition: [
                        "$item.status(used) == 0",
                        "$owner.reserve(gold) >= 200"
                    ],
                    action: "goldenSalvation"
                }]
            }
        },
        reaction: {
            goldenSalvation: [
                {
                    targetType: "owner",
                    key: "cancelDeath",
                    effect: [{ key: "cancelCurrentEvent" }]
                },
                {
                    targetType: "owner",
                    key: "healToHalf",
                    effect: [{ key: "heal", params: { percent: 0.5 } }]
                },
                {
                    targetType: "owner",
                    key: "payGold",
                    effect: [{
                        key: "spendReserve",
                        params: { reserveKey: "gold", amount: 200 }
                    }]
                },
                {
                    targetType: "triggerSource",
                    key: "markUsed",
                    effect: [{
                        key: "setBaseStatus",
                        params: { statusKey: "used", value: 1 }
                    }]
                }
            ]
        }
    },
    {
        label: "心跳鼓",
        describe: [
            "本回合累计受到",
            { key: ["status", "maxPoint"] },
            "点伤害时",
            "下回合开始额外获得 1 能量"
        ],
        key: "original_relic_heartbeat_drum",
        rarity: "uncommon",
        pool: ["shop"],
        status: {
            "point": 0,
            "maxPoint": 8,
            "chargeReady": 0
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
                        on: { when: "after", how: "take", key: ["attack", "damage"] },
                        gain: "$triggerEffect.params(value)",
                        threshold: 8,
                        consume: "all",
                        maxRepeat: 1,
                        targetType: "triggerSource",
                        effects: [{
                            key: "setBaseStatus",
                            params: { statusKey: "chargeReady", value: 1 }
                        }]
                    }
                }],
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "turnStart",
                    action: "consumeCharge"
                }]
            }
        },
        reaction: {
            consumeCharge: [
                {
                    targetType: "owner",
                    key: "grantEnergy",
                    condition: ["$item.status(chargeReady) == 1"],
                    effect: [{
                        key: "gainEnergy",
                        params: { value: 1 }
                    }]
                },
                {
                    targetType: "triggerSource",
                    key: "clearCharge",
                    effect: [{
                        key: "setBaseStatus",
                        params: { statusKey: "chargeReady", value: 0 }
                    }]
                },
                {
                    targetType: "triggerSource",
                    key: "resetPoint",
                    effect: [{
                        key: "setBaseStatus",
                        params: { statusKey: "point", value: 0 }
                    }]
                }
            ]
        }
    },
    {
        label: "锋刃靴",
        describe: [
            "本战斗内首次打出攻击牌时",
            "该次伤害 +6"
        ],
        key: "original_relic_edge_boots",
        rarity: "uncommon",
        pool: ["shop"],
        status: {
            "used": 0,
            "maxUse": 1
        },
        badges: [
            { type: "counter", status: "used", maxStatus: "maxUse" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [
                    {
                        when: "after",
                        how: "take",
                        key: "battleStart",
                        action: "resetUsed"
                    },
                    {
                        when: "before",
                        how: "make",
                        key: "attack",
                        condition: "$item.status(used) == 0",
                        action: "firstAttackBoost"
                    }
                ]
            }
        },
        reaction: {
            resetUsed: [{
                targetType: "triggerSource",
                key: "resetUsed",
                effect: [{
                    key: "setBaseStatus",
                    params: { statusKey: "used", value: 0 }
                }]
            }],
            firstAttackBoost: [
                {
                    targetType: "triggerEffect",
                    key: "boost",
                    effect: [{
                        key: "modifyDamageValue",
                        params: { delta: 6 }
                    }]
                },
                {
                    targetType: "triggerSource",
                    key: "markUsed",
                    effect: [{
                        key: "setBaseStatus",
                        params: { statusKey: "used", value: 1 }
                    }]
                }
            ]
        }
    },
    {
        label: "预言之骰",
        describe: [
            "战斗开始时从 4 个预言中选择 1 个立即生效",
            "力量 / 敏捷 / 抽牌 / 能量"
        ],
        key: "original_relic_prophecy_dice",
        rarity: "rare",
        pool: ["shop"],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "battleStart",
                    action: "prophecyChoose"
                }]
            }
        },
        reaction: {
            prophecyChoose: [{
                targetType: "owner",
                key: "prophecyChoose",
                effect: [{
                    key: "customCardChoice",
                    params: {
                        title: "预言之骰",
                        description: "选择一个预言立即生效",
                        cardKeys: [
                            "card_prophecy_power",
                            "card_prophecy_dex",
                            "card_prophecy_draw",
                            "card_prophecy_energy"
                        ],
                        minSelect: 1,
                        maxSelect: 1,
                        cancelable: false,
                        action: "triggerUse"
                    }
                }]
            }]
        }
    },
    {
        label: "无常之神的祝福",
        describe: [
            "接下来 ", { key: ["status", "battles-remaining"] }, " 场战斗，",
            "战斗开始时获得 3 层力量和 3 层敏捷"
        ],
        key: "relic_god_of_chance_blessing",
        rarity: "rare",
        pool: ["exclusive"],
        status: {
            "battles-remaining": 3,
            "maxBattles": 3,
            "disabled": 0
        },
        badges: [
            { type: "cooldown", status: "battles-remaining" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [
                    {
                        when: "after",
                        how: "take",
                        key: "battleStart",
                        level: 1,
                        condition: "$source.status(disabled) == 0",
                        action: "grantBlessing"
                    },
                    {
                        when: "after",
                        how: "take",
                        key: "battleStart",
                        level: 0,
                        condition: "$source.status(battles-remaining) <= 0",
                        action: "markDisabled"
                    }
                ]
            }
        },
        reaction: {
            grantBlessing: [
                {
                    targetType: "owner",
                    key: "gainPowerDexterity",
                    effect: [
                        { key: "applyState", params: { stateKey: "power", stacks: 3 } },
                        { key: "applyState", params: { stateKey: "dexterity", stacks: 3 } }
                    ]
                },
                {
                    targetType: "triggerSource",
                    key: "decrementRemaining",
                    effect: [{
                        key: "decrementStatus",
                        params: { statusKey: "battles-remaining", amount: 1 }
                    }]
                }
            ],
            markDisabled: [{
                targetType: "triggerSource",
                key: "markDisabled",
                effect: [{
                    key: "setBaseStatus",
                    params: { statusKey: "disabled", value: 1 }
                }]
            }]
        }
    },
    // 孵化中的胚胎（孵化室事件专属，图标: 🪱）：3 场战斗后按累计受伤孵化成共生之种 / 饥饿之种
    {
        label: "孵化中的胚胎",
        describe: [
            "接下来 ", { key: ["status", "battles-remaining"] }, " 场战斗，",
            "战斗开始 +2 力量；每回合结束受到 1/2/3/… 递增伤害。",
            "累计受伤 ", { key: ["status", "damage-taken"] }, "/30。",
            "孵化时：≤30 → 共生之种；>30 → 饥饿之种。"
        ],
        key: "event_relic_incubating_embryo",
        rarity: "rare",
        pool: ["exclusive"],
        status: {
            "battles-remaining": 3,
            "maxBattles": 3,
            "damage-taken": 0,
            "turn-count": 0,
            "disabled": 0
        },
        badges: [
            { type: "cooldown", status: "battles-remaining" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                // 用 accumulateAndTrigger 作纯累计器：threshold 永达不到、effects 空。
                // 关键：未配 maxTriggerPerBattle 时不会注册战斗开始重置回调（见 accumulateAndTrigger.ts:137），
                // 因此 damage-taken 会跨战斗保留，符合"3 场累计受伤"的需求
                effects: [{
                    key: "accumulateAndTrigger",
                    params: {
                        pointKey: "damage-taken",
                        on: { when: "after", how: "take", key: ["attack", "damage"] },
                        gain: "$triggerEffect.params(value)",
                        threshold: 999999,
                        effects: []
                    }
                }],
                triggers: [
                    {
                        when: "after",
                        how: "take",
                        key: "battleStart",
                        level: 10,
                        condition: "$source.status(disabled) == 0",
                        action: "embryoBoost"
                    },
                    {
                        when: "after",
                        how: "take",
                        key: "turnEnd",
                        condition: "$source.status(disabled) == 0",
                        action: "embryoDrain"
                    },
                    {
                        when: "after",
                        how: "take",
                        key: "battleEnd",
                        level: 10,
                        condition: "$source.status(disabled) == 0",
                        action: "embryoTick"
                    },
                    {
                        when: "after",
                        how: "take",
                        key: "battleEnd",
                        level: 5,
                        condition: [
                            "$source.status(disabled) == 0",
                            "$source.status(battles-remaining) <= 0",
                            "$source.status(damage-taken) <= 30"
                        ],
                        action: "hatchSymbiote"
                    },
                    {
                        when: "after",
                        how: "take",
                        key: "battleEnd",
                        level: 5,
                        condition: [
                            "$source.status(disabled) == 0",
                            "$source.status(battles-remaining) <= 0",
                            "$source.status(damage-taken) > 30"
                        ],
                        action: "hatchHungry"
                    }
                ]
            }
        },
        reaction: {
            embryoBoost: [
                {
                    targetType: "owner",
                    key: "applyState",
                    effect: [{ key: "applyState", params: { stateKey: "power", stacks: 2 } }]
                },
                {
                    targetType: "triggerSource",
                    key: "resetTurnCount",
                    effect: [{ key: "setBaseStatus", params: { statusKey: "turn-count", value: 0 } }]
                }
            ],
            embryoDrain: [
                {
                    targetType: "triggerSource",
                    key: "incrementTurnCount",
                    effect: [{ key: "addStatusBase", params: { statusKey: "turn-count", value: 1 } }]
                },
                {
                    targetType: "owner",
                    key: "embryoDamage",
                    effect: [{ key: "damage", params: { value: "$medium.status(turn-count)" } }]
                }
            ],
            embryoTick: [{
                targetType: "triggerSource",
                key: "decrementBattles",
                effect: [{ key: "decrementStatus", params: { statusKey: "battles-remaining", amount: 1 } }]
            }],
            // 先 disable 再孵化：防止同事件栈内后续触发器再次进入
            hatchSymbiote: [
                {
                    targetType: "triggerSource",
                    key: "markDisabled",
                    effect: [{ key: "setBaseStatus", params: { statusKey: "disabled", value: 1 } }]
                },
                {
                    targetType: "owner",
                    key: "hatchSymbiote",
                    effect: [{ key: "gainRelic", params: { relicKey: "event_relic_symbiote_seed" } }]
                },
                {
                    targetType: "owner",
                    key: "selfDestroy",
                    effect: [{ key: "removeRelicByKey", params: { relicKey: "event_relic_incubating_embryo" } }]
                }
            ],
            hatchHungry: [
                {
                    targetType: "triggerSource",
                    key: "markDisabled",
                    effect: [{ key: "setBaseStatus", params: { statusKey: "disabled", value: 1 } }]
                },
                {
                    targetType: "owner",
                    key: "hatchHungry",
                    effect: [{ key: "gainRelic", params: { relicKey: "event_relic_hungry_seed" } }]
                },
                {
                    targetType: "owner",
                    key: "selfDestroy",
                    effect: [{ key: "removeRelicByKey", params: { relicKey: "event_relic_incubating_embryo" } }]
                }
            ]
        }
    },
    // 共生之种（孵化室事件专属）：每场战斗开始 +2 力量，每回合开始 +5 护甲
    {
        label: "共生之种",
        describe: ["每场战斗开始 +2 力量，每回合开始 +5 护甲"],
        key: "event_relic_symbiote_seed",
        rarity: "rare",
        pool: ["exclusive"],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [
                    {
                        when: "after",
                        how: "take",
                        key: "battleStart",
                        action: "symbioteBoost"
                    },
                    {
                        when: "after",
                        how: "make",
                        key: "turnStart",
                        action: "symbioteArmor"
                    }
                ]
            }
        },
        reaction: {
            symbioteBoost: [{
                targetType: "owner",
                key: "applyState",
                effect: [{
                    key: "applyState",
                    params: { stateKey: "power", stacks: 2 }
                }]
            }],
            symbioteArmor: [{
                targetType: "owner",
                key: "gainArmor",
                effect: [{
                    key: "gainArmor",
                    params: { value: 5 }
                }]
            }]
        }
    },
    // 饥饿之种（孵化室事件专属）：每场战斗开始 +2 虚弱；获得时永久塞 1 张「寄生」
    {
        label: "饥饿之种",
        describe: ["每场战斗开始使自己获得 2 层虚弱。获得时永久往牌组塞入 1 张「寄生」。"],
        key: "event_relic_hungry_seed",
        rarity: "rare",
        pool: ["exclusive"],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "gainCard",
                    params: { cardKey: "original_card_parasite" }
                }],
                triggers: [
                    {
                        when: "after",
                        how: "take",
                        key: "battleStart",
                        action: "hungrySeedWeak"
                    }
                ]
            }
        },
        reaction: {
            hungrySeedWeak: [{
                targetType: "owner",
                key: "applyState",
                effect: [{
                    key: "applyState",
                    params: { stateKey: "weak", stacks: 2 }
                }]
            }]
        }
    },
    // 秀色可餐（杯之祭坛事件专属）：永久 +1 能量上限
    {
        label: "秀色可餐",
        describe: ["能量上限 +1"],
        key: "original_relic_delectable_feast",
        rarity: "rare",
        pool: ["exclusive"],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "addStatusBase",
                    params: { statusKey: "max-energy", value: 1, type: "additive" }
                }]
            }
        }
    },
    // 浅尝辄止（杯之祭坛事件专属）：3 场内每回合开始 +1 抽牌，3 场后禁用
    {
        label: "浅尝辄止",
        describe: [
            "接下来 ", { key: ["status", "battles-remaining"] }, " 场战斗，",
            "每回合开始时额外抽 1 张牌"
        ],
        key: "original_relic_shallow_taste",
        rarity: "rare",
        pool: ["exclusive"],
        status: {
            "battles-remaining": 3,
            "maxBattles": 3,
            "disabled": 0
        },
        badges: [
            { type: "cooldown", status: "battles-remaining" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [
                    {
                        when: "after",
                        how: "make",
                        key: "turnStart",
                        condition: "$source.status(disabled) == 0",
                        action: "drawExtra"
                    },
                    {
                        when: "after",
                        how: "take",
                        key: "battleEnd",
                        condition: "$source.status(disabled) == 0",
                        action: "consumeBattle"
                    },
                    {
                        when: "after",
                        how: "take",
                        key: "battleStart",
                        level: 0,
                        condition: "$source.status(battles-remaining) <= 0",
                        action: "markDisabled"
                    }
                ]
            }
        },
        reaction: {
            drawExtra: [{
                targetType: "owner",
                key: "drawFromDrawPile",
                effect: [{
                    key: "drawFromDrawPile",
                    params: { value: 1 }
                }]
            }],
            consumeBattle: [{
                targetType: "triggerSource",
                key: "decrementBattles",
                effect: [{
                    key: "decrementStatus",
                    params: { statusKey: "battles-remaining", amount: 1 }
                }]
            }],
            markDisabled: [{
                targetType: "triggerSource",
                key: "markDisabled",
                effect: [{
                    key: "setBaseStatus",
                    params: { statusKey: "disabled", value: 1 }
                }]
            }]
        }
    },
    // 小兽伙伴（巢穴事件专属）：跟着你走的宠物，每场战斗结束盯上一份战利品（🐕）
    {
        label: "小兽伙伴",
        describe: [
            "一只跟着你走的肮脏小兽。",
            "每场战斗结束，它盯上一份战利品（🐕）。没领这份就算喂给它（好感度 +1）；领了就算抢走（未喂 +1）。",
            "连抢 3 次后，下一份它看上的不能领。",
            "好感度 ≥ 3：陪睡 —— 每次休息治疗额外 +10 HP。",
            "好感度 ≥ 6：共战 —— 每回合结束对随机敌人造成 5 伤害。",
            "好感度 ≥ 9：挡刀 —— 每场战斗第 1 次致命伤挡下，留 1 HP。"
        ],
        key: "event_relic_hungry_beast",
        rarity: "rare",
        pool: ["exclusive"],
        status: {
            "hungry-beast-favor": 0,
            "hungry-beast-refuse-count": 0,
            "hungry-beast-blocked-once": 0
        },
        badges: [
            { type: "counter", status: "hungry-beast-favor" }
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [
                    { key: "hungryBeast_registerInterceptor", params: {} }
                ],
                triggers: [
                    {
                        when: "after",
                        how: "take",
                        key: "restHeal",
                        condition: "$source.status(hungry-beast-favor) >= 3",
                        action: "petHeal"
                    },
                    {
                        when: "after",
                        how: "take",
                        key: "turnEnd",
                        condition: "$source.status(hungry-beast-favor) >= 6",
                        action: "coFightStrike"
                    },
                    {
                        when: "before",
                        how: "take",
                        key: "dead",
                        condition: [
                            "$source.status(hungry-beast-favor) >= 9",
                            "$source.status(hungry-beast-blocked-once) == 0"
                        ],
                        action: "petBlock"
                    },
                    {
                        when: "after",
                        how: "take",
                        key: "battleStart",
                        action: "resetPetBlock"
                    }
                ]
            }
        },
        reaction: {
            petHeal: [{
                targetType: "owner",
                key: "heal",
                effect: [{ key: "heal", params: { value: 10 } }]
            }],
            coFightStrike: [{
                targetType: "allEnemies.random",
                key: "damage",
                effect: [{ key: "attack", params: { value: 5 } }]
            }],
            petBlock: [
                { targetType: "owner", key: "cancelDeath", effect: [{ key: "cancelCurrentEvent" }] },
                { targetType: "owner", key: "healOne", effect: [{ key: "heal", params: { value: 1 } }] },
                {
                    targetType: "triggerSource",
                    key: "markBlocked",
                    effect: [{
                        key: "setBaseStatus",
                        params: { statusKey: "hungry-beast-blocked-once", value: 1 }
                    }]
                }
            ],
            resetPetBlock: [{
                targetType: "triggerSource",
                key: "resetBlocked",
                effect: [{
                    key: "setBaseStatus",
                    params: { statusKey: "hungry-beast-blocked-once", value: 0 }
                }]
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
