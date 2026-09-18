import type { OrganMap } from "@/core/objects/target/Organ"
import { OrganRarity, OrganPartEnum } from "@/core/types/OrganTypes"
import { OrganTags } from "./organTags"
import { createOrgan } from "@/core/factories"

export const organList:OrganMap[] = [
    {
        label:"心脏",
        key:"original_organ_00001",
        describe:["■"],
        rarity: OrganRarity.Common,
        part: "■■■■■■?",
        tags: [OrganTags.STARTER],
        entry: ["organ_cannot_remove"],
        current: ["mass"],
        interaction:{}
    },{
        label:"石芯",
        key:"original_organ_00002",
        describe:["最大生命+3"],
        rarity: OrganRarity.Uncommon,
        part: OrganPartEnum.Heart,
        status: {
            "max-mass": 40
        },
        current: ["mass"],
        upgrade: {
            maxLevel: 3,
            milestones: [
                {
                    level: 2,
                    describe: ["最大生命 +2"],
                    effects: [{
                        key: "addMaxHealthAndHeal",
                        params: { value: 2 }
                    }]
                },
                {
                    level: 3,
                    describe: ["最大生命 +4"],
                    effects: [{
                        key: "addMaxHealthAndHeal",
                        params: { value: 4 }
                    }]
                }
            ]
        },
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[{
                    key:"addMaxHealthAndHeal",
                    params:{value:3}
                }]
            }
        },

    },{
        label:"石肤",
        key:"original_organ_00003",
        describe:["受到的攻击伤害 -", { key: ["status", "damage-reduction"] }],
        rarity: OrganRarity.Uncommon,
        part: OrganPartEnum.Skin,
        status: {
            "max-mass": 25,
            "damage-reduction": 1
        },
        current: ["mass"],
        upgrade: {
            maxLevel: 5,
            milestones: [
                {
                    level: 2,
                    describe: ["最大生命 +2"],
                    effects: [{ key: "addMaxHealthAndHeal", params: { value: 2 } }]
                },
                {
                    level: 3,
                    describe: ["最大生命 +2"],
                    effects: [{ key: "addMaxHealthAndHeal", params: { value: 2 } }]
                },
                {
                    level: 4,
                    describe: ["最大生命 +2"],
                    effects: [{ key: "addMaxHealthAndHeal", params: { value: 2 } }]
                },
                {
                    level: 5,
                    describe: ["减伤变为 -2"],
                    effects: [{
                        key: "setBaseStatus",
                        params: { statusKey: "damage-reduction", value: 2 },
                        target: "eventMedium"
                    }]
                }
            ]
        },
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[],
                triggers:[{
                    when:"before",
                    how:"take",
                    key:"attack",
                    action:"reduceDamage1"
                }]
            }
        },
        reaction:{
            reduceDamage1:[{
                key:"reduceDamage",
                label:"石肤防护",
                targetType:"triggerEffect",
                effect:[
                    {key:"reduceDamageValue",params:{value:"$item.status(damage-reduction)"}}
                ]
            }]
        }
    },{
        label:"战斗之心",
        key:"test_organ_cards_001",
        describe:["最大生命+2"],
        rarity: OrganRarity.Common,
        part: OrganPartEnum.Heart,
        status: {
            "max-mass": 30
        },
        current: ["mass"],
        cards:["original_card_00001"],
        upgrade: {
            maxLevel: 3,
            milestones: [
                {
                    level: 2,
                    describe: ["最大生命 +2"],
                    effects: [
                        { key: "upgradeOrganCards" },
                        { key: "addMaxHealthAndHeal", params: { value: 2 } }
                    ]
                },
                {
                    level: 3,
                    describe: ["生效时", {$:"力量"}, " +1"]
                }
            ]
        },
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[{
                    key:"addMaxHealthAndHeal",
                    params:{value:2}
                }]
            },
            work:{
                target:{"key":"self"},
                grantStates: [
                    { stateKey: "power", stacks: 1, fromLevel: 3 }
                ]
            }
        }
    },{
        label:"狂暴腺体",
        key:"test_organ_cards_002",
        rarity: OrganRarity.Rare,
        part: OrganPartEnum.Gland,
        status: {
            "max-mass": 20
        },
        current: ["mass"],
        cards:["original_card_00002", "original_card_00004"],  // 提供"消耗打击"和"肌肉强化"
        upgrade: {
            maxLevel: 3,
            milestones: [
                {
                    level: 2,
                    effects: [{
                        key: "upgradeOrganCards",
                        params: { cardKey: "original_card_00002" }
                    }]
                },
                {
                    level: 3,
                    effects: [{
                        key: "upgradeOrganCards",
                        params: { cardKey: "original_card_00004" }
                    }]
                }
            ]
        },
        interaction:{}
    },{
        label:"旋风引擎",
        key:"test_organ_cards_003",
        describe:[
            "每打出",{key:["status","draw-every"]},"张牌，抽1张（",
            {key:["status","cards-played"]},"/",{key:["status","draw-every"]},"）"
        ],
        rarity: OrganRarity.Rare,
        part: OrganPartEnum.Core,
        status: {
            "max-mass": 35,
            "cards-played": 0,
            "draw-every": 6
        },
        current: ["mass", "cards-played"],
        cards:["original_card_00005"],
        badges: [
            { type: "counter", status: "cards-played", maxStatus: "draw-every" }
        ],
        upgrade: {
            maxLevel: 4,
            milestones: [
                {
                    level: 2,
                    describe: ["改为每打出 5 张牌抽 1 张"],
                    effects: [{
                        key: "setBaseStatus",
                        params: { statusKey: "draw-every", value: 5 },
                        target: "eventMedium"
                    }]
                },
                {
                    level: 3,
                    effects: [{ key: "upgradeOrganCards" }]
                },
                {
                    level: 4,
                    describe: ["改为每打出 4 张牌抽 1 张"],
                    effects: [{
                        key: "setBaseStatus",
                        params: { statusKey: "draw-every", value: 4 },
                        target: "eventMedium"
                    }]
                }
            ]
        },
        interaction:{
            work:{
                target:{"key":"self"},
                triggers:[{
                    when:"after",
                    how:"make",
                    key:"useCard",
                    action:"drawOnPlayCount"
                }]
            }
        },
        reaction:{
            drawOnPlayCount:[{
                key:"countAndDraw",
                label:"旋风引擎：打牌计数抽牌",
                targetType:"item",
                effect:[{
                    key:"countAndTrigger",
                    params:{
                        countKey:"cards-played",
                        threshold:"$target.status(draw-every)",
                        onTrigger:{
                            key:"whirlwindDraw",
                            effect:[{ key:"drawFromDrawPile", params:{ value:1 } }]
                        }
                    }
                }]
            }]
        }
    },{
        label:"癌变心脏",
        key:"example_organ_cursed_001",
        describe:["回合开始时受到1点伤害并获得1点能量"],
        rarity: OrganRarity.Common,
        part: OrganPartEnum.Heart,
        tags: [OrganTags.CURSED, OrganTags.CANCER],
        status: {
            "max-mass": 10
        },
        current: ["mass"],
        interaction:{
            work:{
                target:{"key":"self"},
                effects:[],
                triggers:[{
                    when:"after",
                    how:"make",
                    key:"turnStart",
                    action:"damageAndEnergy"
                }]
            }
        },
        reaction:{
            damageAndEnergy:[{
                key:"damage",
                targetType:"creatorOwner",
                effect:[{
                    key:"damage",
                    params:{value:1}
                }]
            },{
                key:"gainEnergy",
                targetType:"creatorOwner",
                effect:[{
                    key:"gainEnergy",
                    params:{value:1}
                }]
            }]
        }
    },
    // ========== 不屈甲壳 ==========
    {
        label: "不屈甲壳",
        key: "organ_resilient_shell",
        describe: [
            "每累计受到", { key: ["status", "hurt-threshold"] }, "点伤害，获得",
            { key: ["status", "armor-gain"] }, "点", {$:"护甲"}, "（",
            { key: ["status", "damage-taken"] }, "/", { key: ["status", "hurt-threshold"] }, "）"
        ],
        rarity: OrganRarity.Common,
        part: OrganPartEnum.Skin,
        badges: [
            { type: "counter", status: "damage-taken", maxStatus: "hurt-threshold" }
        ],
        status: {
            "max-mass": 20,
            "damage-taken": 0,
            "hurt-threshold": 10,
            "armor-gain": 1
        },
        current: ["mass", "damage-taken"],
        upgrade: {
            maxLevel: 4,
            milestones: [
                {
                    level: 2,
                    describe: ["阈值改为 9"],
                    effects: [{
                        key: "setBaseStatus",
                        params: { statusKey: "hurt-threshold", value: 9 },
                        target: "eventMedium"
                    }]
                },
                {
                    level: 3,
                    describe: ["阈值改为 7"],
                    effects: [{
                        key: "setBaseStatus",
                        params: { statusKey: "hurt-threshold", value: 7 },
                        target: "eventMedium"
                    }]
                },
                {
                    level: 4,
                    describe: ["每次改为获得 2 点", {$:"护甲"}],
                    effects: [{
                        key: "setBaseStatus",
                        params: { statusKey: "armor-gain", value: 2 },
                        target: "eventMedium"
                    }]
                }
            ]
        },
        interaction: {
            work: {
                target: { key: "self" },
                effects: [{
                    key: "accumulateAndTrigger",
                    params: {
                        pointKey: "damage-taken",
                        on: { when: "after", how: "take", key: ["attack", "damage"] },
                        gain: "$triggerEffect.params(value)",
                        thresholdKey: "hurt-threshold",
                        consume: "threshold",
                        targetType: "owner",
                        effects: [{
                            key: "gainArmor",
                            params: { value: "$medium.status(armor-gain)" }
                        }]
                    }
                }]
            }
        }
    }
,
// ========== 器官系列：弱化之刃 ==========
{
    label:"腐蚀腺",
    key:"organ_series_weaken_002",
    describe:[
        "对拥有", {$:"虚弱"}, "的敌人造成伤害时，每层", {$:"虚弱"}, "额外造成",{key:["status","weak-bonus"]},"点伤害"
    ],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 30,
        "weak-bonus": 1
    },
    current: ["mass"],
    cards:["organ_card_erode"],
    upgrade: {
        maxLevel: 4,
        milestones: [
            {
                level: 2,
                effects: [{ key: "upgradeOrganCards" }]
            },
            {
                level: 3,
                describe: ["无"]
            },
            {
                level: 4,
                describe: ["每层额外伤害改为 2"],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "weak-bonus", value: 2 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction:{
        possess:{
            target:{"key":"self"},
            effects:[],
            triggers:[{
                when:"before",
                how:"make",
                key:"attack",
                action:"bonusDamageVsWeak"
            }]
        }
    },
    reaction:{
        bonusDamageVsWeak:[{
            key:"bonusDamageVsWeak",
            label:"腐蚀腺：虚弱增伤",
            targetType:"triggerEffect",
            effect:[{
                key:"modifyDamageValue",
                params:{
                    delta:"$triggerEffect.target.stateStack(weak)",
                    multiplier:"$owner.status(weak-bonus)"
                }
            }]
        }]
    }
},

// ========== 蓄力腺 ==========
{
    label: "蓄力腺",
    key: "enemy_organ_ant_charge_gland",
    describe: ["回合结束时获得", { key: ["status", "momentum-gain"] }, "层", {$:"蓄势"}],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 15,
        "momentum-gain": 1
    },
    current: ["mass"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                describe: ["无"]
            },
            {
                level: 3,
                describe: ["改为获得 2 层", {$:"蓄势"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "momentum-gain", value: 2 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnEnd",
                action: "gainChargeOnTurnEnd"
            }]
        }
    },
    reaction: {
        gainChargeOnTurnEnd: [{
            key: "applyState",
            label: "蓄力腺：回合结束蓄势",
            targetType: "creatorOwner",
            effect: [{
                key: "applyState",
                params: { stateKey: "momentum", stacks: "$owner.status(momentum-gain)" }
            }]
        }]
    }
},
// ========== 节甲 ==========
{
    label: "节甲",
    key: "enemy_organ_ant_carapace",
    describe: ["回合开始时获得", { key: ["status", "armor-gain"] }, "点", {$:"护甲"}],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
    status: {
        "max-mass": 30,
        "armor-gain": 3
    },
    current: ["mass"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                describe: ["改为获得 4 点", {$:"护甲"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "armor-gain", value: 4 },
                    target: "eventMedium"
                }]
            },
            {
                level: 3,
                describe: ["改为获得 5 点", {$:"护甲"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "armor-gain", value: 5 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
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
            key: "gainArmor",
            label: "节甲：回合开始获得护甲",
            targetType: "creatorOwner",
            effect: [{
                key: "gainArmor",
                params: { value: "$owner.status(armor-gain)" }
            }]
        }]
    }
},
// ========== 孢子囊 ==========
{
    label: "孢子囊",
    key: "enemy_organ_spore_sac",
    describe: [
        "损坏时对所有敌人施加", { key: ["status", "break-poison"] }, "层", {$:"中毒"}
    ],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 20,
        "break-poison": 3
    },
    current: ["mass"],
    cards: ["enemy_card_toxic_spore"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                effects: [{ key: "upgradeOrganCards" }]
            },
            {
                level: 3,
                describe: ["损坏时", {$:"中毒"}, "改为 5 层"],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "break-poison", value: 5 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        },
        break: {
            target: { faction: "opponent", number: "all" },
            effects: [{
                key: "applyState",
                params: { stateKey: "poison", stacks: "$owner.status(break-poison)" }
            }]
        }
    }
},
// ========== 菌盖 ==========
{
    label: "菌盖",
    key: "enemy_organ_fungal_cap",
    describe: [
        "回合开始时获得", { key: ["status", "armor-gain"] }, "点", {$:"护甲"}
    ],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
    status: {
        "max-mass": 25,
        "armor-gain": 3
    },
    current: ["mass"],
    cards: ["enemy_card_harden"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                effects: [{ key: "upgradeOrganCards" }]
            },
            {
                level: 3,
                describe: ["改为获得 5 点", {$:"护甲"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "armor-gain", value: 5 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
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
            key: "gainArmor",
            label: "菌盖：回合开始获得护甲",
            targetType: "creatorOwner",
            effect: [{
                key: "gainArmor",
                params: { value: "$owner.status(armor-gain)" }
            }]
        }]
    }
},
// ========== 粘舌 ==========
{
    label: "粘舌",
    key: "enemy_organ_sticky_tongue",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Muscle,
    status: {
        "max-mass": 15
    },
    current: ["mass"],
    cards: ["original_card_00011"],
    upgrade: {
        maxLevel: 2,
        milestones: [{
            level: 2,
            effects: [{ key: "upgradeOrganCards" }]
        }]
    },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},
// ========== 蟾蜍皮 ==========
{
    label: "蟾蜍皮",
    key: "enemy_organ_toad_skin",
    describe: ["你从", {$:"毒素"}, "状态的中受到的伤害减少",{key:["status","poison-decount"]}, "%"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
    status: {
        "max-mass": 20,
        "poison-decount": 30,
        "poison-decount-percent":-0.3
    },
    current: ["mass"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                describe: ["无"]
            },
            {
                level: 3,
                describe: ["从", {$:"毒素"},"状态中受到的伤害减少50%"],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "poison-reflect", value: 50 },
                    target: "eventMedium"
                },{
                    key: "setBaseStatus",
                    params: { statusKey: "poison-reflect-percent", value: -0.5 },
                    target: "eventMedium"
                }]
            },
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "before",
                how: "take",
                key: "damage",
                action: "decountPoison",
                // 即伤害事件的Source（中毒state）是否具备toxic这个 traits(性质)
                condition:"$event.source.hasTrait(toxic)"
            }]
        }
    },
    reaction: {
        decountPoison: [{
            key: "modifyDamageByPercent",
            label: "蟾蜍皮：减弱毒素",
            targetType: "triggerEffect",
            effect: [{
                key:"modifyDamageByPercent",
                params: { percent: "$owner.status(poison-decount-percent)" }
            }]
        }]
    }
},
// ========== 血口器 ==========
{
    label: "血口器",
    key: "enemy_organ_blood_proboscis",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Muscle,
    status: {
        "max-mass": 15
    },
    current: ["mass"],
    cards: ["enemy_card_blood_bite"],
    upgrade: {
        maxLevel: 2,
        milestones: [{
            level: 2,
            effects: [{ key: "upgradeOrganCards" }]
        }]
    },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},
// ========== 薄翅 ==========
{
    label: "薄翅",
    key: "enemy_organ_thin_wings",
    describe: [
        "初始拥有", { key: ["status", "max-wingStacks"] }, "层",
        "<br>",
        "战斗开始时获得等同于层数的", {$:"飞飘"},
        "<br>",
        "每次受到攻击时层数 -1"
    ],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Skin,
    status: {
        "max-mass": 15,
        "wingStacks": 3,
        "max-wingStacks": 3
    },
    current: ["mass"],
    badges: [{
        type: "counter",
        status: "wingStacks",
        maxStatus: "max-wingStacks",
        position: "bottom-right"
    }],
    upgrade: {
        maxLevel: 3,
        perLevel: {
            effects: [{
                key: "setBaseStatus",
                params: { statusKey: "wingStacks", value: 3 },
                target: "eventMedium"
            }]
        },
        milestones: [
            {
                level: 2,
                describe: ["层数加满"]
            },
            {
                level: 3,
                describe: ["层数加满"]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [
                {
                    when: "after",
                    how: "take",
                    key: "battleStart",
                    action: "openingFlight",
                    condition: "$item.status(wingStacks) > 0"
                },
                {
                    when: "after",
                    how: "take",
                    key: "attack",
                    action: "consumeWing",
                    condition: "$item.status(wingStacks) > 0"
                }
            ]
        }
    },
    reaction: {
        openingFlight: [{
            key: "openingFlight",
            label: "薄翅：开局飞飘",
            targetType: "creatorOwner",
            effect: [{ key: "applyState", params: { stateKey: "flutter", stacks: "$owner.status(wingStacks)" } }]
        }],
        consumeWing: [{
            key: "consumeWing",
            label: "薄翅：挨打消耗层数",
            targetType: "triggerCreator",
            effect: [{ key: "decrementStatus", params: { statusKey: "wingStacks" } }]
        }]
    }
},
// ========== 毒腺 ==========
{
    label: "毒腺",
    key: "enemy_organ_poison_gland",
    describe: ["回合开始时对所有对手施加", { key: ["status", "poison-gain"] }, "层", {$:"中毒"}],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 15,
        "poison-gain": 1
    },
    current: ["mass"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                describe: ["无"]
            },
            {
                level: 3,
                describe: ["改为施加 2 层", {$:"中毒"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "poison-gain", value: 2 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "poisonOnTurnStart"
            }]
        }
    },
    reaction: {
        poisonOnTurnStart: [{
            key: "poison",
            label: "毒腺：回合开始施毒",
            targetType: "allOpponents",
            effect: [{
                key: "applyState",
                params: { stateKey: "poison", stacks: "$owner.status(poison-gain)" }
            }]
        }]
    }
},
// ========== 蚁酸腺 ==========
{
    label: "蚁酸腺",
    key: "enemy_organ_ant_acid_gland",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 15
    },
    current: ["mass"],
    cards: ["enemy_card_acid_bite"],
    upgrade: {
        maxLevel: 2,
        milestones: [{
            level: 2,
            effects: [{ key: "upgradeOrganCards" }]
        }]
    },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},
// ========== 重锤 ==========
{
    label: "重锤",
    key: "enemy_organ_heavy_hammer",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Bone,
    status: {
        "max-mass": 30
    },
    current: ["mass"],
    cards: ["enemy_card_heavy_strike"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                effects: [{ key: "upgradeOrganCards" }]
            },
            {
                level: 3,
                describe: ["生效时", {$:"力量"}, " +2"],
                effects: [{ key: "upgradeOrganCards" }]
            }
        ]
    },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        },
        work: {
            target: { key: "self" },
            grantStates: [
                { stateKey: "power", stacks: 2, fromLevel: 3 }
            ]
        }
    }
},
// ========== 不稳定电池 ==========
{
    label: "不稳定电池",
    key: "enemy_organ_unstable_battery",
    describe: ["回合开始获得1点能量","<br>","50%概率", {$:"热量"}, "+1，", {$:"热量"}, ">3时对自身造成50点伤害"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 20
    },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "unstableBatteryTick"
            }]
        }
    },
    reaction: {
        unstableBatteryTick: [
            {
                key: "gainEnergy",
                label: "不稳定电池：获得能量",
                targetType: "creatorOwner",
                effect: [{
                    key: "gainEnergy",
                    params: { value: 1 }
                }]
            },
            {
                key: "heatTick",
                label: "不稳定电池：热量计时",
                targetType: "creatorOwner",
                effect: [{
                    key: "organ_heatTick",
                    params: {}
                }]
            }
        ]
    }
},
// ========== 急救营养液 ==========
{
    label: "急救营养液",
    key: "enemy_organ_emergency_battery",
    effect: [
        "受到伤害后自动回复", { key: ["status", "heal-amount"] }, "点。",
        "若这一下会致死则不触发。限用", { key: ["status", "charges"] }, "次"
    ],
    effectTiers: [
        {
            statusKey: "flat-threshold",
            min: 1,
            describe: ["生命低于", { key: ["status", "flat-threshold"] }, "点时触发"]
        },
        {
            statusKey: "percent-threshold",
            min: 1,
            describe: ["生命低于", { key: ["status", "percent-threshold"] }, "%时触发"]
        }
    ],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 20,
        "charges": 2,
        "max-charges": 2,
        "heal-amount": 5,
        "flat-threshold": 5,
        "percent-threshold": 0
    },
    current: ["mass"],
    badges: [{
        type: "counter",
        status: "charges",
        maxStatus: "max-charges",
        position: "bottom-right"
    }],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                describe: ["阈值改为生命低于 5%"],
                effects: [
                    {
                        key: "setBaseStatus",
                        params: { statusKey: "percent-threshold", value: 5 },
                        target: "eventMedium"
                    },
                    {
                        key: "setBaseStatus",
                        params: { statusKey: "flat-threshold", value: 0 },
                        target: "eventMedium"
                    }
                ]
            },
            {
                level: 3,
                describe: ["回血改为 7"],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "heal-amount", value: 7 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: ["attack", "damage"],
                action: "emergencyHeal"
            }]
        }
    },
    reaction: {
        emergencyHeal: [{
            key: "emergencyBattery",
            label: "急救营养液：紧急回血",
            targetType: "creatorOwner",
            effect: [{
                key: "organ_emergencyBattery",
                params: {
                    value: "$owner.status(heal-amount)",
                    flatThreshold: "$owner.status(flat-threshold)",
                    percentThreshold: "$owner.status(percent-threshold)"
                }
            }]
        }]
    }
},
// ========== 维修模块 ==========
{
    label: "维修模块",
    key: "enemy_organ_repair_module",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 20
    },
    current: ["mass"],
    cards: ["enemy_card_repair"],
    upgrade: {
        maxLevel: 2,
        milestones: [{
            level: 2,
            effects: [{ key: "upgradeOrganCards" }]
        }]
    },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},
// ========== 充能炮 ==========
{
    label: "充能炮",
    key: "enemy_organ_charge_cannon",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 25
    },
    current: ["mass"],
    cards: ["enemy_card_unstable_charge", "enemy_card_discharge"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},
// ========== 过期隔板 ==========
{
    label: "过期隔板",
    key: "enemy_organ_rusty_separator",
        describe: ["受到攻击时：30%完全抵消（本回合每抵消一次，概率-10%），20%失去所有", {$:"护甲"}],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Bone,
    status: {
        "max-mass": 25
    },
    current: ["mass"],
    // 损耗层数只在本回合抵消过伤害时才冒出来，平时方块保持干净
    badges: [{
        type: "counter",
        value: "$item.stateStack(separatorWear)",
        showWhen: "$item.stateStack(separatorWear) > 0",
        position: "bottom-right",
        style: { backgroundColor: "#dc2626" }
    }],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "before",
                how: "take",
                key: "attack",
                action: "rustySeparatorRoll"
            }]
        }
    },
    reaction: {
        rustySeparatorRoll: [{
            key: "rustySeparator",
            label: "过期隔板：伤害骰",
            targetType: "triggerEffect",
            sourceTargetType: "creatorOwner",
            effect: [{
                key: "organ_rustySeparator",
                params: {
                    blockChance: 0.3,
                    blockDecay: 0.1,
                    breakChance: 0.2
                }
            }]
        }]
    }
},
// ========== 蚁颚 ==========
{
    label: "蚁颚",
    key: "enemy_organ_ant_mandible",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Bone,
    status: {
        "max-mass": 20
    },
    current: ["mass"],
    cards: ["enemy_card_swarm_bite"],
    upgrade: {
        maxLevel: 2,
        milestones: [{
            level: 2,
            effects: [{ key: "upgradeOrganCards" }]
        }]
    },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},

// ========== 第一层精英：蚁后 ==========

// 信息素腺体：每回合给所有友军+1指挥层；提供指挥连击
{
    label: "信息素腺体",
    key: "enemy_organ_pheromone_gland",
    describe: [
        "每回合给所有友军+", { key: ["status", "command-gain"] }, "层", {$:"指挥"}
    ],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 30,
        "command-gain": 1
    },
    current: ["mass"],
    cards: ["enemy_card_command_strike"],
    upgrade: {
        maxLevel: 4,
        milestones: [
            {
                level: 2,
                effects: [{ key: "upgradeOrganCards" }]
            },
            {
                level: 3,
                describe: ["无"]
            },
            {
                level: 4,
                describe: ["每回合改为 +2 ", {$:"指挥"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "command-gain", value: 2 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "pheromoneSpread"
            }]
        }
    },
    reaction: {
        pheromoneSpread: [{
            key: "pheromoneSpread",
            label: "信息素腺体：扩散指挥",
            targetType: "creatorOwner",
            effect: [{
                key: "organ_pheromoneGland",
                params: { stacks: "$owner.status(command-gain)" }
            }]
        }]
    }
},

// 女王大颚：提供女王蚀咬+指挥嘶鸣
{
    label: "女王大颚",
    key: "enemy_organ_queen_mandible",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Bone,
    status: { "max-mass": 35 },
    current: ["mass"],
    cards: ["enemy_card_queen_acid_bite", "enemy_card_command_screech"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},

// 王室甲壳：每存活友军+3护甲
{
    label: "王室甲壳",
    key: "enemy_organ_royal_carapace",
    describe: ["每回合开始：每存活友军获得3", {$:"护甲"}],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "swarmShield"
            }]
        }
    },
    reaction: {
        swarmShield: [{
            key: "swarmShield",
            label: "王室甲壳：蜂群护盾",
            targetType: "creatorOwner",
            effect: [{ key: "gainArmorPerAlly", params: { value: 3 } }]
        }]
    }
},

// ========== 第一层精英：铁壁要塞 ==========

// 壁垒甲壳：持有时获得壁垒状态（护甲不在回合开始时消失）
{
    label: "壁垒甲壳",
    key: "enemy_organ_barricade_shell",
    describe: [{$:"护甲"}, "不在回合开始时消失"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Skin,
    status: {
        "max-mass": 40,
        "armor-gain": 0,
        "opening-armor": 0
    },
    current: ["mass"],
    upgrade: {
        maxLevel: 4,
        milestones: [
            {
                level: 2,
                describe: ["回合开始获得 1 点", {$:"护甲"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "armor-gain", value: 1 },
                    target: "eventMedium"
                }]
            },
            {
                level: 3,
                describe: ["回合开始改为 3 点", {$:"护甲"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "armor-gain", value: 3 },
                    target: "eventMedium"
                }]
            },
            {
                level: 4,
                describe: ["战斗开始获得 10 点", {$:"护甲"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "opening-armor", value: 10 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            grantStates: [
                { stateKey: "barricade", stacks: 1 }
            ],
            triggers: [
                {
                    when: "after",
                    how: "make",
                    key: "turnStart",
                    action: "gainArmorOnTurnStart",
                    condition: "$item.status(armor-gain) > 0"
                },
                {
                    when: "after",
                    how: "take",
                    key: "battleStart",
                    action: "openingArmor",
                    condition: "$item.status(opening-armor) > 0"
                }
            ]
        }
    },
    reaction: {
        gainArmorOnTurnStart: [{
            key: "gainArmor",
            label: "壁垒甲壳：回合开始护甲",
            targetType: "creatorOwner",
            effect: [{
                key: "gainArmor",
                params: { value: "$owner.status(armor-gain)" }
            }]
        }],
        openingArmor: [{
            key: "gainArmor",
            label: "壁垒甲壳：开局护甲",
            targetType: "creatorOwner",
            effect: [{
                key: "gainArmor",
                params: { value: "$owner.status(opening-armor)" }
            }]
        }]
    }
},

// 金属化核心：持有时获得金属化状态（每回合结束+3护甲），提供护甲冲撞
{
    label: "金属化核心",
    key: "enemy_organ_metallicize_core",
    describe: [ "每回合结束时获得3", {$:"护甲"}],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Core,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["enemy_card_armor_bash"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                describe: ["无"]
            },
            {
                level: 3,
                effects: [{ key: "upgradeOrganCards" }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            grantStates: [
                { stateKey: "metallicize", stacks: 3 }
            ]
        }
    }
},

// 防御模块：提供铁壁
{
    label: "防御模块",
    key: "enemy_organ_defense_module",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 30,
        "armor-gain": 0
    },
    current: ["mass"],
    cards: ["enemy_card_steel_wall"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                effects: [{ key: "upgradeOrganCards" }]
            },
            {
                level: 3,
                describe: ["回合开始获得 3 点", {$:"护甲"}],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "armor-gain", value: 3 },
                    target: "eventMedium"
                }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "gainArmorOnTurnStart",
                condition: "$item.status(armor-gain) > 0"
            }]
        }
    },
    reaction: {
        gainArmorOnTurnStart: [{
            key: "gainArmor",
            label: "防御模块：回合开始护甲",
            targetType: "creatorOwner",
            effect: [{
                key: "gainArmor",
                params: { value: "$owner.status(armor-gain)" }
            }]
        }]
    }
},

// 柔韧甲片：持有时获得柔韧状态（受到攻击时获得3护甲）
{
    label: "柔韧甲片",
    key: "enemy_organ_malleable_plating",
    describe: ["受到攻击时获得等同", {$:"柔韧"}, "层数的", {$:"护甲"}],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Skin,
    status: { "max-mass": 35 },
    current: ["mass"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                describe: ["无"]
            },
            {
                level: 3,
                describe: [{$:"柔韧"}, "改为 4 层"]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            grantStates: [
                { stateKey: "malleable", stacks: 3 },
                { stateKey: "malleable", stacks: 1, fromLevel: 3 }
            ]
        }
    }
},

// ========== 第一层精英：废堆猎手 ==========

// 腐化腺：战斗开始失去X生命；每回合开始+1层力量
{
    label: "腐化腺",
    key: "enemy_organ_corruption_gland",
    describe: ["战斗开始失去8点生命", "<br>", "每回合开始获得1层", {$:"力量"}],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 40 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [
                {
                    when: "after",
                    how: "take",
                    key: "battleStart",
                    action: "corruptionCost"
                },
                {
                    when: "after",
                    how: "make",
                    key: "turnStart",
                    action: "corruptionStrength"
                }
            ]
        }
    },
    reaction: {
        corruptionCost: [{
            key: "corruptionCost",
            label: "腐化腺：献血代价",
            targetType: "creatorOwner",
            effect: [{ key: "loseHp", params: { value: 8 } }]
        }],
        corruptionStrength: [{
            key: "corruptionStrength",
            label: "腐化腺：获得力量",
            targetType: "creatorOwner",
            effect: [{ key: "applyState", params: { stateKey: "power", stacks: 1 } }]
        }]
    }
},

// 腐食再生：使用攻击牌后，按缺失HP百分比回血，每场战斗上限最大HP×50%
{
    label: "腐食再生",
    key: "enemy_organ_life_steal",
    describe: ["使用攻击牌后，按缺失生命百分比回血", "<br>", "每场战斗回血上限为最大生命的50%"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 35 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [
                {
                    when: "after",
                    how: "take",
                    key: "battleStart",
                    action: "initLifeStealBudget"
                },
                {
                    when: "after",
                    how: "via",
                    key: "useCard",
                    action: "lifeStealHeal",
                    condition: "$triggerCard.hasTag(attack)"
                }
            ]
        }
    },
    reaction: {
        initLifeStealBudget: [{
            key: "initLifeStealBudget",
            label: "腐食再生：初始化预算",
            targetType: "creatorOwner",
            effect: [{ key: "applyState", params: { stateKey: "lifeStealBudget", stacks: "$target.status(max-health)" } }]
        }],
        lifeStealHeal: [{
            key: "lifeStealHeal",
            label: "腐食再生：回血",
            targetType: "creatorOwner",
            effect: [{ key: "organ_lifeSteal", params: { coefficient: 0.3 } }]
        }]
    }
},

// 腐肉颚：提供撕咬卡牌
{
    label: "腐肉颚",
    key: "enemy_organ_rot_jaw",
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Muscle,
    status: { "max-mass": 30 },
    current: ["mass"],
    cards: ["enemy_card_strength_bite"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},

// 污秽厚皮：每回合开始获得X层变硬（受到攻击时减少本次伤害）
{
    label: "污秽厚皮",
    key: "enemy_organ_filthy_hide",
    describe: ["每回合开始获得5层", {$:"变硬"}, "<br>", "受到攻击时减少本次伤害（层数×10%）"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
    status: { "max-mass": 35 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "hardenTick"
            }]
        }
    },
    reaction: {
        hardenTick: [{
            key: "hardenTick",
            label: "污秽厚皮：获得变硬",
            targetType: "creatorOwner",
            effect: [{ key: "applyState", params: { stateKey: "harden", stacks: 5 } }]
        }]
    }
},

// ========== 第一层精英：有毒混合物 ==========

// 毒素核心：每回合给双方施加1层中毒；提供腐蚀爆发
{
    label: "毒素核心",
    key: "enemy_organ_toxic_core",
    describe: [ "每回合给双方施加1层", {$:"中毒"}],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Core,
    status: { "max-mass": 35 },
    current: ["mass"],
    cards: ["enemy_card_corrosive_burst"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "toxicPulse"
            }]
        }
    },
    reaction: {
        toxicPulse: [{
            key: "toxicPulse",
            label: "毒素核心：毒素脉冲",
            targetType: "creatorOwner",
            effect: [{ key: "organ_toxicPulse", params: { stacks: 1 } }]
        }]
    }
},

// 毒素护甲：每回合首次受伤后获得3护甲
{
    label: "毒素护甲",
    key: "enemy_organ_poison_armor",
    describe: ["每回合首次受到伤害后获得3", {$:"护甲"}],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
    status: { "max-mass": 30 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [
                {
                    when: "after",
                    how: "take",
                    key: ["attack", "damage"],
                    action: "poisonArmorGain"
                },
                {
                    when: "after",
                    how: "make",
                    key: "turnStart",
                    action: "resetPoisonArmor"
                }
            ]
        }
    },
    reaction: {
        poisonArmorGain: [{
            key: "poisonArmorGain",
            label: "毒素护甲：受击获甲",
            targetType: "creatorOwner",
            effect: [{ key: "organ_poisonArmor", params: { value: 3 } }]
        }],
        resetPoisonArmor: [{
            key: "resetPoisonArmor",
            label: "毒素护甲：重置标记",
            targetType: "creatorOwner",
            effect: [{ key: "removeState", params: { stateKey: "poisonArmorUsed" } }]
        }]
    }
},

// ========== 疫孢菌母器官 ==========

// 孢子腺：每回合通过孢子爆发卡向玩家塞孢子牌
{
    label: "孢子腺",
    key: "enemy_organ_spore_gland",
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 50 },
    current: ["mass"],
    cards: ["boss2_card_spore_burst"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},

// 寄生菌丝：提供菌丝蔓延
{
    label: "寄生菌丝",
    key: "enemy_organ_parasitic_root",
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Nerve,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["boss2_card_mycelium_spread"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},

// 腐化铠甲：回合结束时，每有1个对手具备debuff获得3点护甲
{
    label: "腐化铠甲",
    key: "enemy_organ_corruption_armor",
    describe: ["回合结束时，每有1个对手具备debuff获得3点", {$:"护甲"}],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Skin,
    status: { "max-mass": 40 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnEnd",
                action: "corruptionArmorTick"
            }]
        }
    },
    reaction: {
        corruptionArmorTick: [{
            key: "corruptionArmorTick",
            label: "腐化铠甲：获得护甲",
            targetType: "owner",
            effect: [{ key: "organ_corruptionArmor", params: { value: 3 } }]
        }]
    }
},

// 剧毒心核：施加中毒时额外+1层
{
    label: "剧毒心核",
    key: "enemy_organ_toxic_core_boss",
    describe: ["施加", {$:"中毒"}, "时额外+1层"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
    status: { "max-mass": 50 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "before",
                how: "make",
                key: "applyState",
                action: "poisonAmplify"
            }]
        }
    },
    reaction: {
        poisonAmplify: [{
            key: "poisonAmplify",
            label: "剧毒心核：中毒+1",
            targetType: "triggerEffect",
            effect: [{ key: "organ_poisonAmplify", params: {} }]
        }]
    }
},

// 菌网根系：加毒卡挂这里；对对手上毒时抽牌（每回合限次）
{
    label: "菌网根系",
    key: "enemy_organ_mycelial_network",
    effect: [
        "对对手施加", {$:"中毒"}, "时抽 1 张牌（每回合",
        { key: ["status", "used"] }, "/", { key: ["status", "maxUse"] }, "）"
    ],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Nerve,
    status: { "max-mass": 30, used: 0, maxUse: 3 },
    current: ["mass"],
    cards: ["boss2_card_infection_strike"],
    badges: [
        { type: "counter", status: "used", maxStatus: "maxUse" }
    ],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                describe: ["改为每回合 5 次"],
                effects: [{
                    key: "setBaseStatus",
                    params: { statusKey: "maxUse", value: 5 },
                    target: "eventMedium"
                }]
            },
            {
                level: 3,
                effects: [{
                    key: "upgradeOrganCards",
                    params: { cardKey: "boss2_card_infection_strike" }
                }]
            }
        ]
    },
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [
                {
                    when: "after",
                    how: "make",
                    key: "applyState",
                    condition: [
                        "$triggerEffect.params(stateKey) == poison",
                        "$item.status(used) < $item.status(maxUse)",
                        "$target != $owner"
                    ],
                    action: "mycelialDraw"
                },
                {
                    when: "before",
                    how: "make",
                    key: "turnStart",
                    action: "mycelialReset"
                }
            ]
        }
    },
    reaction: {
        mycelialDraw: [
            {
                key: "mycelialDrawCard",
                label: "菌网：上毒抽牌",
                targetType: "owner",
                effect: [{ key: "drawFromDrawPile", params: { value: 1 } }]
            },
            {
                key: "mycelialCount",
                label: "菌网：计数",
                targetType: "item",
                effect: [{ key: "incrementStatus", params: { statusKey: "used", amount: 1 } }]
            }
        ],
        mycelialReset: [{
            key: "mycelialReset",
            label: "菌网：重置次数",
            targetType: "item",
            effect: [{ key: "setBaseStatus", params: { statusKey: "used", value: 0 } }]
        }]
    }
},

// 不稳定毒囊：宿主死亡时对所有玩家施加3层中毒
{
    label: "不稳定毒囊",
    key: "enemy_organ_volatile_sac",
    describe: ["宿主死亡时对所有对手施加3层", {$:"中毒"}],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 25 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            // 必须是 before：killTarget 在 isAlive 归零后会清理宿主的全部物品修饰器，
            // 那次清理是微任务，会赶在 after 周期之前把本触发器一并撤掉，导致毒囊哑火
            triggers: [{
                when: "before",
                how: "take",
                key: "dead",
                event: {
                    key: "volatileSacBurst",
                    label: "毒囊爆裂",
                    targetType: "allOpponents",
                    effect: [{ key: "applyState", params: { stateKey: "poison", stacks: 3 } }]
                }
            }]
        }
    }
},

// ========== 自走焚烧炉器官 ==========

// 点火核：提供重铸卡牌；持有者每打出一张攻击牌获得1层点火
{
    label: "点火核",
    key: "enemy_organ_ignition_core",
    describe: [ "每打出一张攻击牌，自身获得1层", {$:"点火"}],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
    status: { "max-mass": 50 },
    current: ["mass"],
    cards: ["boss1_card_recasting"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "useCard",
                action: "gainIgnition",
                condition: "$triggerCard.hasTag(attack)"
            }]
        }
    },
    reaction: {
        gainIgnition: [{
            key: "gainIgnition",
            label: "点火核：积累点火",
            targetType: "creatorOwner",
            effect: [{ key: "applyState", params: { stateKey: "ignition", stacks: 1 } }]
        }]
    }
},

// 熔铸魂：提供铸铁力卡牌；战斗开始获得2层力量
{
    label: "熔铸魂",
    key: "enemy_organ_cast_soul",
    describe: [ "战斗开始时获得2层", {$:"力量"}],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Heart,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["boss1_card_iron_might"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: "battleStart",
                action: "gainInitialPower"
            }]
        }
    },
    reaction: {
        gainInitialPower: [{
            key: "gainInitialPower",
            label: "熔铸魂：开局力量",
            targetType: "creatorOwner",
            effect: [{ key: "applyState", params: { stateKey: "power", stacks: 2 } }]
        }]
    }
},

// 铁角腺：提供铁刺卡牌；多段攻击（multiHit）每段+1伤
{
    label: "铁角腺",
    key: "enemy_organ_iron_horn_gland",
    describe: [ "多段攻击每段额外造成1点伤害"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["boss1_card_iron_spike"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "before",
                how: "make",
                key: "attack",
                action: "multiHitBonus"
            }]
        }
    },
    reaction: {
        multiHitBonus: [{
            key: "multiHitBonus",
            label: "铁角腺：多段+1伤",
            targetType: "triggerEffect",
            effect: [{ key: "organ_multiHitBonus", params: { bonus: 1 } }]
        }]
    }
},

// 熔渣心：提供熔铸打击/高炉护壁；获得力量时额外+1
{
    label: "熔渣心",
    key: "enemy_organ_slag_heart",
    describe: [ "获得", {$:"力量"}, "时额外+1层"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Heart,
    status: { "max-mass": 30 },
    current: ["mass"],
    cards: ["boss1_card_cast_strike", "boss1_card_furnace_wall"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "before",
                how: "make",
                key: "applyState",
                action: "powerAmplify"
            }]
        }
    },
    reaction: {
        powerAmplify: [{
            key: "powerAmplify",
            label: "熔渣心：力量+1",
            targetType: "triggerEffect",
            effect: [{ key: "organ_powerAmplify", params: { bonus: 1 } }]
        }]
    }
},

// ========== 第一层Boss 3：废铁战甲器官 ==========

// 铁壁核心：提供装甲组装；Lv.3 才在战斗开始时获得护甲。
{
    label: "铁壁核心",
    key: "enemy_organ_iron_wall_core",
    describe: ["提供", {$:"装甲组装"}],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Core,
    status: { "max-mass": 40, "opening-armor": 0 },
    current: ["mass"],
    cards: ["boss3_card_armor_assembly"],
    upgrade: {
        maxLevel: 3,
        milestones: [{
            level: 2,
            describe: ["锻造提供的装甲组装"],
            effects: [{ key: "upgradeOrganCards", params: { cardKey: "boss3_card_armor_assembly" } }]
        }, {
            level: 3,
            describe: ["战斗开始时获得15点", {$:"护甲"}],
            effects: [{ key: "setBaseStatus", params: { statusKey: "opening-armor", value: 1 }, target: "eventMedium" }]
        }]
    },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: "battleStart",
                action: "openingArmor",
                condition: "$item.status(opening-armor) > 0"
            }]
        }
    },
    reaction: {
        openingArmor: [{
            key: "openingArmor",
            label: "铁壁核心：开局护甲",
            targetType: "creatorOwner",
            effect: [{ key: "gainArmor", params: { value: 15 } }]
        }]
    }
},

// 过载核心：提供过载屏障卡牌；战斗开始时+1层力场护盾
{
    label: "过载核心",
    key: "enemy_organ_overload_core",
    describe: ["过载屏障获得1层", {$:"力场护盾"}, "和1层", {$:"热量"}],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Heart,
    status: { "max-mass": 40, "opening-force-field": 0 },
    current: ["mass"],
    cards: ["boss3_card_overload_barrier"],
    upgrade: {
        maxLevel: 2,
        milestones: [{
            level: 2,
            describe: ["战斗开始时获得1层", {$:"力场护盾"}],
            effects: [{ key: "setBaseStatus", params: { statusKey: "opening-force-field", value: 1 }, target: "eventMedium" }]
        }]
    },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: "battleStart",
                action: "openingForceField",
                condition: "$item.status(opening-force-field) > 0"
            }]
        }
    },
    reaction: {
        openingForceField: [{
            key: "openingForceField",
            label: "过载核心：开局力场护盾",
            targetType: "creatorOwner",
            effect: [{ key: "applyState", params: { stateKey: "forceFieldShield", stacks: 1 } }]
        }]
    }
},

// 液压双管：战斗开始时获得活力；升级后锻造火力压制并在每回合开始补充活力
{
    label: "液压双管",
    key: "enemy_organ_hydraulic_dual_gun",
    describe: ["战斗开始时获得3层", {$:"活力"}],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Muscle,
    current: ["mass"],
    cards: ["boss3_card_firepower_suppression"],
    upgrade: {
        maxLevel: 3,
        milestones: [
            {
                level: 2,
                describe: ["锻造提供的火力压制"],
                effects: [{ key: "upgradeOrganCards", params: { cardKey: "boss3_card_firepower_suppression" } }]
            },
            {
                level: 3,
                describe: ["回合开始时获得1层", {$:"活力"}],
                effects: [{ key: "setBaseStatus", params: { statusKey: "turn-vitality", value: 1 }, target: "eventMedium" }]
            }
        ]
    },
    status: { "max-mass": 40, "turn-vitality": 0 },
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: "battleStart",
                action: "openingVitality"
            }, {
                when: "after",
                how: "take",
                key: "turnStart",
                action: "turnVitality",
                condition: "$item.status(turn-vitality) > 0"
            }]
        }
    },
    reaction: {
        openingVitality: [{
            key: "openingVitality",
            label: "液压双管：开局活力",
            targetType: "creatorOwner",
            effect: [{ key: "applyState", params: { stateKey: "vitality", stacks: 3 } }]
        }],
        turnVitality: [{
            key: "turnVitality",
            label: "液压双管：回合活力",
            targetType: "creatorOwner",
            effect: [{ key: "applyState", params: { stateKey: "vitality", stacks: 1 } }]
        }]
    }
},

// 钢铁意志：提供钢铁压碾卡牌；每场战斗第一次致命伤害免疫
{
    label: "钢铁意志",
    key: "enemy_organ_steel_will",
    describe: [ "每场战斗第一次致命伤害免疫"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Nerve,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["boss3_card_steel_roll"],
    badges: [{
        type: "indicator",
        text: "免死",
        showWhen: "$item.hasState(lethalGuardReady)"
    }],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [
                {
                    when: "after", how: "take", key: "battleStart",
                    action: "lethalGuardCharge"
                },
                {
                    when: "on", how: "take", key: "attack",
                    level: -100,
                    action: "lethalGuardTrigger",
                    condition: "$item.hasState(lethalGuardReady)"
                }
            ]
        }
    },
    reaction: {
        lethalGuardCharge: [{
            key: "lethalGuardCharge",
            label: "钢铁意志：充能",
            targetType: "item",
            effect: [{ key: "applyState", params: { stateKey: "lethalGuardReady", stacks: 1 } }]
        }],
        lethalGuardTrigger: [{
            key: "lethalGuardCheck",
            label: "钢铁意志：致命保命",
            targetType: "triggerEffect",
            effect: [{ key: "checkAndSaveLethal" }]
        }]
    }
},

// ========== 胚胎发育事件产出：5 阶段线性器官 ==========
// 事件 event_embryogenesis 逐阶段接生所得；pool: ["event"]，不进通用随机池
// evolutionRounds 记录事件内"进化"次数，接生时写入器官 status

// 阶段 1 · 合子（Zygote）
{
    label: "合子",
    key: "organ_embryo_stage1",
    describe: ["战斗结束时回复 8 生命", "<br>", "每完成一轮进化，额外回复 2 生命"],
    rarity: OrganRarity.Common,
    pool: ["event"],
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 20,
        "evolutionRounds": 0
    },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: "battleEnd",
                action: "zygoteHeal"
            }]
        }
    },
    reaction: {
        zygoteHeal: [{
            key: "heal",
            label: "合子：赛后回复",
            targetType: "owner",
            effect: [
                { key: "heal", params: { value: 8 } },
                { key: "repeatEffects", params: {
                    times: "$item.status(evolutionRounds)",
                    effects: [{ key: "heal", params: { value: 2 } }]
                }}
            ]
        }]
    }
},

// 阶段 2 · 桑葚胚（Morula）
// 简化说明：原设计"evolutionRounds >= 2 才 +1 触发（晚熟）"因缺算术表达式改为线性——每轮进化 +1 次；
// 结果：基础 2 次，每 evolutionRounds 累加 1 次。如需恢复晚熟，需引入 bonusTriggers hidden status 由 possess effect 初始化
{
    label: "桑葚胚",
    key: "organ_embryo_stage2",
    pool: ["event"],
    describe: ["每场战斗第一张攻击卡额外触发 1 次", "<br>", "每完成一轮进化，额外多触发 1 次"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 25,
        "evolutionRounds": 0,
        "used": 0
    },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            triggers: [
                {
                    when: "after",
                    how: "take",
                    key: "battleStart",
                    action: "morulaResetUsed"
                },
                {
                    when: "before",
                    how: "make",
                    key: "useCard",
                    condition: [
                        "$item.status(used) == 0",
                        "$triggerCard.hasTag(attack)"
                    ],
                    action: "morulaRepeatAttack"
                }
            ]
        }
    },
    reaction: {
        morulaResetUsed: [{
            targetType: "item",
            key: "morulaResetUsed",
            effect: [{ key: "setBaseStatus", params: { statusKey: "used", value: 0 } }]
        }],
        morulaRepeatAttack: [
            {
                targetType: "triggerEffect",
                key: "morulaBaseRepeat",
                effect: [{ key: "modifyRepeat", params: { addRepeat: 1 } }]
            },
            {
                targetType: "triggerEffect",
                key: "morulaEvolutionBonus",
                effect: [{
                    key: "repeatEffects",
                    params: {
                        times: "$item.status(evolutionRounds)",
                        effects: [{ key: "modifyRepeat", params: { addRepeat: 1 } }]
                    }
                }]
            },
            {
                targetType: "item",
                key: "morulaMarkUsed",
                effect: [{ key: "setBaseStatus", params: { statusKey: "used", value: 1 } }]
            }
        ]
    }
},

// 阶段 3 · 囊胚（Blastula）
{
    label: "囊胚",
    key: "organ_embryo_stage3",
    describe: [ "回合开始时获得 5 ", {$:"护甲"}, "<br>", "每完成一轮进化，额外获得 1 ", {$:"护甲"}],
    rarity: OrganRarity.Uncommon,
    pool: ["event"],
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 30,
        "evolutionRounds": 0
    },
    current: ["mass"],
    cards: ["card_embryo_differentiation"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: "turnStart",
                action: "blastulaArmor"
            }]
        }
    },
    reaction: {
        blastulaArmor: [{
            key: "gainArmor",
            label: "囊胚：外壳",
            targetType: "owner",
            effect: [
                { key: "gainArmor", params: { value: 5 } },
                { key: "repeatEffects", params: {
                    times: "$item.status(evolutionRounds)",
                    effects: [{ key: "gainArmor", params: { value: 1 } }]
                }}
            ]
        }]
    }
},

// 阶段 4 · 原肠胚（Gastrula）——战斗开始塞 1 张【分化】直接进手牌（不进牌组，起手可用）
{
    label: "原肠胚",
    key: "organ_embryo_stage4",
    describe: ["战斗开始时，将一张【分化】卡塞入手牌（不进牌组）"],
    rarity: OrganRarity.Rare,
    pool: ["event"],
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 35,
        "evolutionRounds": 0
    },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            triggers: [{
                when: "after",
                how: "take",
                key: "battleStart",
                action: "gastrulaSeedHand"
            }]
        }
    },
    reaction: {
        gastrulaSeedHand: [{
            key: "addCardToHand",
            label: "原肠胚：即时分化",
            targetType: "owner",
            effect: [{
                key: "addCardToHand",
                params: {
                    cardKey: "card_embryo_differentiation",
                    count: 1
                }
            }]
        }]
    }
},

// 阶段 5 · 神经胚（Neurula）
{
    label: "神经胚",
    key: "organ_embryo_stage5",
    describe: [ "每场战斗胜利后获得 5 最大生命并回复 5 生命", "<br>", "每完成一轮进化，额外获得 2 最大生命"],
    rarity: OrganRarity.Rare,
    pool: ["event"],
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 40,
        "evolutionRounds": 0
    },
    current: ["mass"],
    cards: ["card_embryo_differentiation"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: "battleEnd",
                condition: "$event.info(result) == win",
                action: "neurulaGrow"
            }]
        }
    },
    reaction: {
        neurulaGrow: [{
            key: "addMaxHealthAndHeal",
            label: "神经胚：永久成长",
            targetType: "owner",
            effect: [
                { key: "addMaxHealthAndHeal", params: { value: 5 } },
                { key: "repeatEffects", params: {
                    times: "$item.status(evolutionRounds)",
                    effects: [{ key: "addMaxHealthAndHeal", params: { value: 2 } }]
                }}
            ]
        }]
    }
},
]

export async function getOrganByKey(key:string){
    const data = organList.find(value=>value.key==key)
    if(!data)throw new Error("没有该器官对象")
    const organ = await createOrgan(data)
    return organ
}
