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
        describe:["受到的伤害值-1"],
        rarity: OrganRarity.Uncommon,
        part: OrganPartEnum.Skin,
        status: {
            "max-mass": 25
        },
        current: ["mass"],
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[],
                triggers:[{
                    when:"before",
                    how:"take",
                    key:"damage",
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
                    {key:"reduceDamageValue",params:{value:1}}
                ]
            }]
        }
    },{
        label:"战斗之心",
        key:"test_organ_cards_001",
        describe:["提供1张",{"@": 0},"卡牌到牌组","最大生命+2"],
        rarity: OrganRarity.Common,
        part: OrganPartEnum.Heart,
        status: {
            "max-mass": 30
        },
        current: ["mass"],
        cards:["original_card_00001"],
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[{
                    key:"addMaxHealthAndHeal",
                    params:{value:2}
                }]
            }
        }
    },{
        label:"狂暴腺体",
        key:"test_organ_cards_002",
        describe:["提供1张",{"@": 0},"和1张",{"@": 1},"到牌组"],
        rarity: OrganRarity.Rare,
        part: OrganPartEnum.Gland,
        status: {
            "max-mass": 20
        },
        current: ["mass"],
        cards:["original_card_00002", "original_card_00004"],  // 提供"消耗打击"和"肌肉强化"
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[],
                modifiers:[{
                    statusKey:"attack",
                    label:"狂暴",
                    targetLayer:"base",
                    modifierType:"additive",
                    modifierValue:1
                }]
            }
        }
    },{
        label:"旋风引擎",
        key:"test_organ_cards_003",
        describe:["提供1张",{"@": 0},"到牌组","损坏后卡牌无法使用"],
        rarity: OrganRarity.Rare,
        part: OrganPartEnum.Core,
        status: {
            "max-mass": 35
        },
        current: ["mass"],
        cards:["original_card_00005"],
        interaction:{
            work:{
                target:{"key":"self"},
                effects:[],
                triggers:[{
                    when:"after",
                    how:"make",
                    key:"useCard",
                    action:"drawOnUseCard"
                }]
            }
        },
        reaction:{
            drawOnUseCard:[{
                key:"drawCard",
                label:"旋风引擎：打牌时抽1张",
                targetType:"triggerOwner",
                effect:[{
                    key:"drawFromDrawPile",
                    params:{value:1}
                }]
            }]
        }
    },{
        label:"末日核心",
        key:"test_organ_cards_004",
        describe:["提供1张",{"@": 0},"到牌组","危险而强大"],
        rarity: OrganRarity.Rare,  // 改为 Rare
        part: OrganPartEnum.Core,
        // 无质量系统 - 无法被摧毁
        cards:["original_card_00006"],  // 提供"末日"
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[],
                modifiers:[{
                    statusKey:"max-energy",
                    label:"末日能量",
                    targetLayer:"base",
                    modifierType:"additive",
                    modifierValue:1
                }]
            }
        }
    },{
        label:"癌变心脏",
        key:"example_organ_cursed_001",
        describe:["回合开始时该器官收到1点伤害并获得1点能量"],
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
                targetType:"triggerOwner",
                effect:[{
                    key:"damage",
                    params:{value:1}
                }]
            },{
                key:"gainEnergy",
                targetType:"triggerOwner",
                effect:[{
                    key:"gainEnergy",
                    params:{value:1}
                }]
            }]
        }
    },{
        label:"脆弱之心",
        key:"test_organ_entry_001",
        describe:["最大生命+5","你受到伤害时50%概率损坏"],
        rarity: OrganRarity.Uncommon,
        part: OrganPartEnum.Heart,
        entry: ["organ_fragile"],
        status: {
            "max-mass": 25
        },
        current: ["mass"],
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[{
                    key:"addMaxHealthAndHeal",
                    params:{value:5}
                }]
            }
        }
    },{
        label:"再生核心",
        key:"test_organ_entry_002",
        describe:["战斗结束时恢复5点质量"],
        rarity: OrganRarity.Rare,
        part: OrganPartEnum.Core,
        entry: ["organ_regenerative"],
        status: {
            "max-mass": 30
        },
        current: ["mass"],
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[{
                    key:"addMaxHealthAndHeal",
                    params:{value:3}
                }]
            }
        }
    },{
        label:"坚固外壳",
        key:"test_organ_entry_003",
        describe:["此器官不会损坏","受到的伤害值-2"],
        rarity: OrganRarity.Rare,
        part: OrganPartEnum.Skin,
        entry: ["organ_sturdy"],
        status: {
            "max-mass": 50
        },
        current: ["mass"],
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[],
                triggers:[{
                    when:"before",
                    how:"take",
                    key:"damage",
                    action:"reduceDamage2"
                }]
            }
        },
        reaction:{
            reduceDamage2:[{
                key:"reduceDamage",
                label:"坚固外壳防护",
                targetType:"triggerEffect",
                effect:[
                    {key:"reduceDamageValue",params:{value:2}}
                ]
            }]
        }
    },
    // ========== 升级系统示例 ==========
    {
        label:"进化之心",
        key:"example_organ_upgrade_001",
        describe:["每次升级增加2点最大生命","最高可升至3级"],
        rarity: OrganRarity.Common,
        part: OrganPartEnum.Heart,
        status: {
            "max-mass": 30
        },
        current: ["mass"],
        upgrade: {
            maxLevel: 3,
            perLevel: {
                effects: [{
                    key: "addStatusBaseCurrentValue",
                    params: { value: 2, statusKey: "max-health", currentKey: "health" }
                }]
            }
        },
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[{
                    key:"addMaxHealthAndHeal",
                    params:{value:3}
                }]
            }
        }
    },{
        label:"强化肌肉",
        key:"example_organ_upgrade_002",
        describe:["每次升级增加1点攻击力","3级时获得额外能量"],
        rarity: OrganRarity.Uncommon,
        part: OrganPartEnum.Muscle,
        status: {
            "max-mass": 35
        },
        current: ["mass"],
        upgrade: {
            maxLevel: 5,
            cost: 15,  // 固定升级成本
            perLevel: {
                effects: [{
                    key: "addStatusModifier",
                    params: {
                        statusKey: "attack",
                        targetLayer: "base",
                        modifierType: "additive",
                        modifierValue: 1
                    }
                }]
            },
            milestones: [{
                level: 3,
                effects: [{
                    key: "addStatusModifier",
                    params: {
                        statusKey: "max-energy",
                        targetLayer: "base",
                        modifierType: "additive",
                        modifierValue: 1
                    }
                }]
            }]
        },
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[],
                modifiers:[{
                    statusKey:"attack",
                    targetLayer:"base",
                    modifierType:"additive",
                    modifierValue:2
                }]
            }
        }
    },{
        label:"适应性外壳",
        key:"example_organ_upgrade_003",
        describe:["升级成本随等级递增","每级减伤+1","5级时获得护甲机制"],
        rarity: OrganRarity.Rare,
        part: OrganPartEnum.Skin,
        status: {
            "max-mass": 40,
            "damage-reduction": 0
        },
        current: ["mass"],
        upgrade: {
            maxLevel: 5,
            cost: (organ) => {
                return 10 + organ.level * 5
            },
            perLevel: {
                effects: [{
                    key: "addStatusModifier",
                    params: {
                        statusKey: "damage-reduction",
                        targetLayer: "base",
                        modifierType: "additive",
                        modifierValue: 1
                    }
                }]
            },
            milestones: [{
                level: 5,
                effects: [{
                    key: "addStatusBaseCurrentValue",
                    params: { value: 10, statusKey: "max-health", currentKey: "health" }
                }]
            }]
        },
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[],
                triggers:[{
                    when:"before",
                    how:"take",
                    key:"damage",
                    action:"adaptiveReduction"
                }]
            }
        },
        reaction:{
            adaptiveReduction:[{
                key:"reduceDamage",
                label:"适应性外壳",
                targetType:"triggerEffect",
                effect:[
                    {key:"reduceDamageValue",params:{value:1}}
                ]
            }]
        }
    },{
        label:"终极核心",
        key:"example_organ_upgrade_004",
        describe:["史诗级器官","每2级获得里程碑奖励","最高10级"],
        rarity: OrganRarity.Rare,
        part: OrganPartEnum.Core,
        status: {
            "max-mass": 60
        },
        current: ["mass"],
        upgrade: {
            maxLevel: 10,
            perLevel: {
                effects: [{
                    key: "addStatusBaseCurrentValue",
                    params: { value: 1, statusKey: "max-health", currentKey: "health" }
                }]
            },
            milestones: [
                {
                    level: 2,
                    effects: [{
                        key: "addStatusModifier",
                        params: {
                            statusKey: "attack",
                            targetLayer: "base",
                            modifierType: "additive",
                            modifierValue: 1
                        }
                    }]
                },
                {
                    level: 4,
                    effects: [{
                        key: "addStatusModifier",
                        params: {
                            statusKey: "max-energy",
                            targetLayer: "base",
                            modifierType: "additive",
                            modifierValue: 1
                        }
                    }]
                },
                {
                    level: 6,
                    effects: [{
                        key: "addStatusBaseCurrentValue",
                        params: { value: 5, statusKey: "max-health", currentKey: "health" }
                    }]
                },
                {
                    level: 8,
                    effects: [{
                        key: "addStatusModifier",
                        params: {
                            statusKey: "attack",
                            targetLayer: "base",
                            modifierType: "additive",
                            modifierValue: 2
                        }
                    }]
                },
                {
                    level: 10,
                    effects: [{
                        key: "addStatusModifier",
                        params: {
                            statusKey: "max-energy",
                            targetLayer: "base",
                            modifierType: "additive",
                            modifierValue: 1
                        }
                    }]
                }
            ]
        },
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[],
                modifiers:[{
                    statusKey:"max-health",
                    targetLayer:"base",
                    modifierType:"additive",
                    modifierValue:10
                }]
            }
        }
    },
    // ========== 不屈甲壳 ==========
    {
        label: "不屈甲壳",
        key: "organ_resilient_shell",
        describe: ["每累计受到10点伤害，获得1点护甲（", {key: ["status", "damage-taken"]}, "/10）"],
        rarity: OrganRarity.Common,
        part: OrganPartEnum.Skin,
        badges: [
            { type: "counter", status: "damage-taken", maxValue: 10 }
        ],
        status: {
            "max-mass": 20,
            "damage-taken": 0
        },
        current: ["mass", "damage-taken"],
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "accumulateAndTrigger",
                    params: {
                        pointKey: "damage-taken",
                        on: { when: "after", how: "take", key: "damage" },
                        gain: "$triggerEffect.params(value)",
                        threshold: 10,
                        consume: 10,
                        targetType: "owner",
                        effects: [{
                            key: "gainArmor",
                            params: { value: 1 }
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
    describe:["提供1张",{"@": 0},"到牌组","对拥有虚弱的敌人造成伤害时，额外造成等同于虚弱层数的伤害"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 30
    },
    current: ["mass"],
    cards:["organ_card_erode"],
    interaction:{
        possess:{
            target:{"key":"self"},
            effects:[],
            triggers:[{
                when:"before",
                how:"make",
                key:"damage",
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
                params:{ delta:"$triggerEffect.target.stateStack(weak)" }
            }]
        }]
    }
},

// ========== 蓄力腺 ==========
{
    label: "蓄力腺",
    key: "enemy_organ_ant_charge_gland",
    describe: ["回合结束时获得1层蓄势"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 15
    },
    current: ["mass"],
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
            targetType: "triggerOwner",
            effect: [{
                key: "applyState",
                params: { stateKey: "momentum", stacks: 1 }
            }]
        }]
    }
},
// ========== 节甲 ==========
{
    label: "节甲",
    key: "enemy_organ_ant_carapace",
    describe: ["回合开始时获得3点护甲"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
    status: {
        "max-mass": 30
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
                action: "gainArmorOnTurnStart"
            }]
        }
    },
    reaction: {
        gainArmorOnTurnStart: [{
            key: "gainArmor",
            label: "节甲：回合开始获得护甲",
            targetType: "triggerOwner",
            effect: [{
                key: "gainArmor",
                params: { value: 3 }
            }]
        }]
    }
},
// ========== 孢子囊 ==========
{
    label: "孢子囊",
    key: "enemy_organ_spore_sac",
    describe: ["提供1张", {"@": 0}, "卡牌", "损坏时对所有敌人施加3层中毒"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 20
    },
    current: ["mass"],
    cards: ["enemy_card_toxic_spore"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        },
        break: {
            target: { faction: "player", number: "all" },
            effects: [{
                key: "applyState",
                params: { stateKey: "poison", stacks: 3 }
            }]
        }
    }
},
// ========== 菌盖 ==========
{
    label: "菌盖",
    key: "enemy_organ_fungal_cap",
    describe: ["回合开始时获得3点护甲"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
    status: {
        "max-mass": 25
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
                action: "gainArmorOnTurnStart"
            }]
        }
    },
    reaction: {
        gainArmorOnTurnStart: [{
            key: "gainArmor",
            label: "菌盖：回合开始获得护甲",
            targetType: "triggerOwner",
            effect: [{
                key: "gainArmor",
                params: { value: 3 }
            }]
        }]
    }
},
// ========== 粘舌 ==========
{
    label: "粘舌",
    key: "enemy_organ_sticky_tongue",
    describe: ["提供1张", {"@": 0}, "卡牌"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Muscle,
    status: {
        "max-mass": 15
    },
    current: ["mass"],
    cards: ["original_card_00011"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},
// ========== 毒皮 ==========
{
    label: "毒皮",
    key: "enemy_organ_poison_skin",
    describe: ["受到伤害时对伤害来源施加2层中毒"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
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
                how: "take",
                key: "damage",
                action: "poisonAttacker"
            }]
        }
    },
    reaction: {
        poisonAttacker: [{
            key: "poison",
            label: "毒皮：反弹中毒",
            targetType: "eventSource",
            effect: [{
                key: "applyState",
                params: { stateKey: "poison", stacks: 2 }
            }]
        }]
    }
},
// ========== 毒腺 ==========
{
    label: "毒腺",
    key: "enemy_organ_poison_gland",
    describe: ["回合开始时对所有敌人施加1层中毒"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 15
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
                action: "poisonOnTurnStart"
            }]
        }
    },
    reaction: {
        poisonOnTurnStart: [{
            key: "poison",
            label: "毒腺：回合开始施毒",
            targetType: "allAllies",
            effect: [{
                key: "applyState",
                params: { stateKey: "poison", stacks: 1 }
            }]
        }]
    }
},
// ========== 蚁酸腺 ==========
{
    label: "蚁酸腺",
    key: "enemy_organ_ant_acid_gland",
    describe: ["提供1张", {"@": 0}, "卡牌"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: {
        "max-mass": 15
    },
    current: ["mass"],
    cards: ["enemy_card_acid_bite"],
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
    describe: ["提供1张", {"@": 0}, "卡牌"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Bone,
    status: {
        "max-mass": 30
    },
    current: ["mass"],
    cards: ["enemy_card_heavy_strike"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},
// ========== 不稳定电池 ==========
{
    label: "不稳定电池",
    key: "enemy_organ_unstable_battery",
    describe: ["回合开始获得1点能量", "50%概率热量+1，热量>3时爆炸造成50点伤害"],
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
                targetType: "triggerOwner",
                effect: [{
                    key: "gainEnergy",
                    params: { value: 1 }
                }]
            },
            {
                key: "heatTick",
                label: "不稳定电池：热量计时",
                targetType: "triggerOwner",
                effect: [{
                    key: "organ_heatTick",
                    params: {}
                }]
            }
        ]
    }
},
// ========== 急救电池 ==========
{
    label: "急救电池",
    key: "enemy_organ_emergency_battery",
    describe: ["生命低于30%时自动回血20，限用2次"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 20,
        "charges": 2
    },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: "damage",
                action: "emergencyHeal"
            }]
        }
    },
    reaction: {
        emergencyHeal: [{
            key: "emergencyBattery",
            label: "急救电池：紧急回血",
            targetType: "triggerOwner",
            effect: [{
                key: "organ_emergencyBattery",
                params: { threshold: 0.3, value: 20 }
            }]
        }]
    }
},
// ========== 维修模块 ==========
{
    label: "维修模块",
    key: "enemy_organ_repair_module",
    describe: ["提供1张", {"@": 0}, "卡牌"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Core,
    status: {
        "max-mass": 20
    },
    current: ["mass"],
    cards: ["enemy_card_repair"],
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
    describe: ["提供1张", {"@": 0}, "和1张", {"@": 1}, "卡牌"],
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
    describe: ["受到伤害时：30%完全抵消，20%护甲崩裂，50%正常"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Bone,
    status: {
        "max-mass": 25
    },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "before",
                how: "take",
                key: "damage",
                action: "rustySeparatorRoll"
            }]
        }
    },
    reaction: {
        rustySeparatorRoll: [{
            key: "rustySeparator",
            label: "过期隔板：伤害骰",
            targetType: "triggerEffect",
            sourceTargetType: "triggerOwner",
            effect: [{
                key: "organ_rustySeparator",
                params: {}
            }]
        }]
    }
},
// ========== 蚁颚 ==========
{
    label: "蚁颚",
    key: "enemy_organ_ant_mandible",
    describe: ["提供1张", {"@": 0}, "卡牌", "Lv.2：群咬额外攻击1次"],
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
            effects: [{
                key: "modifyOrganCardStatus",
                params: { statusKey: "hits", delta: 1 }
            }]
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
    describe: ["提供1张", {"@": 0}, "卡牌", "每回合给所有友军+1指挥层"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 30 },
    current: ["mass"],
    cards: ["enemy_card_command_strike"],
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
            targetType: "triggerOwner",
            effect: [{ key: "organ_pheromoneGland", params: { stacks: 1 } }]
        }]
    }
},

// 女王大颚：提供女王蚀咬+指挥嘶鸣
{
    label: "女王大颚",
    key: "enemy_organ_queen_mandible",
    describe: ["提供2张卡牌：", {"@": 0}, "和", {"@": 1}],
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
    describe: ["每回合开始：每存活友军获得3护甲"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Skin,
    status: { "max-mass": 40 },
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
            targetType: "triggerOwner",
            effect: [{ key: "gainArmorPerAlly", params: { value: 3 } }]
        }]
    }
},

// ========== 第一层精英：铁壁要塞 ==========

// 壁垒甲壳：持有时获得壁垒状态（护甲不在回合开始时消失）
{
    label: "壁垒甲壳",
    key: "enemy_organ_barricade_shell",
    describe: ["护甲不在回合开始时消失"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Skin,
    status: { "max-mass": 40 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [{ key: "applyState", params: { stateKey: "barricade", stacks: 1 } }]
        }
    }
},

// 金属化核心：持有时获得金属化状态（每回合结束+3护甲），提供护甲冲撞
{
    label: "金属化核心",
    key: "enemy_organ_metallicize_core",
    describe: ["每回合结束时获得3护甲", "提供1张", {"@": 0}, "卡牌"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Core,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["enemy_card_armor_bash"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [{ key: "applyState", params: { stateKey: "metallicize", stacks: 3 } }]
        }
    }
},

// 防御模块：提供铁壁
{
    label: "防御模块",
    key: "enemy_organ_defense_module",
    describe: ["提供1张", {"@": 0}, "卡牌"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Core,
    status: { "max-mass": 30 },
    current: ["mass"],
    cards: ["enemy_card_steel_wall"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        }
    }
},

// 柔韧甲片：持有时获得柔韧状态（受到攻击时获得3护甲）
{
    label: "柔韧甲片",
    key: "enemy_organ_malleable_plating",
    describe: ["受到攻击时获得3护甲"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Skin,
    status: { "max-mass": 35 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [{ key: "applyState", params: { stateKey: "malleable", stacks: 3 } }]
        }
    }
},

// ========== 第一层精英：废堆猎手 ==========

// 腐化腺：战斗开始失去X生命；每回合开始+1层力量
{
    label: "腐化腺",
    key: "enemy_organ_corruption_gland",
    describe: ["战斗开始失去8点生命", "每回合开始获得1层力量"],
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
                    how: "make",
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
            targetType: "triggerOwner",
            effect: [{ key: "loseHp", params: { value: 8 } }]
        }],
        corruptionStrength: [{
            key: "corruptionStrength",
            label: "腐化腺：获得力量",
            targetType: "triggerOwner",
            effect: [{ key: "applyState", params: { stateKey: "power", stacks: 1 } }]
        }]
    }
},

// 腐食再生：使用攻击牌后，按缺失HP百分比回血，每场战斗上限最大HP×50%
{
    label: "腐食再生",
    key: "enemy_organ_life_steal",
    describe: ["使用攻击牌后，按缺失生命百分比回血", "每场战斗回血上限为最大生命的50%"],
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
                    how: "make",
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
            targetType: "triggerOwner",
            effect: [{ key: "applyState", params: { stateKey: "lifeStealBudget", stacks: "$owner.status(max-health)" } }]
        }],
        lifeStealHeal: [{
            key: "lifeStealHeal",
            label: "腐食再生：回血",
            targetType: "triggerOwner",
            effect: [{ key: "organ_lifeSteal", params: { coefficient: 0.3 } }]
        }]
    }
},

// 腐肉颚：提供撕咬卡牌
{
    label: "腐肉颚",
    key: "enemy_organ_rot_jaw",
    describe: ["提供1张", {"@": 0}, "卡牌"],
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
    describe: ["每回合开始获得5层变硬", "受到攻击时减少本次伤害（层数×10%）"],
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
            targetType: "triggerOwner",
            effect: [{ key: "applyState", params: { stateKey: "harden", stacks: 5 } }]
        }]
    }
},

// ========== 第一层精英：有毒混合物 ==========

// 毒素核心：每回合给双方施加1层中毒；提供腐蚀爆发
{
    label: "毒素核心",
    key: "enemy_organ_toxic_core",
    describe: ["提供1张", {"@": 0}, "卡牌", "每回合给双方施加1层中毒"],
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
            targetType: "triggerOwner",
            effect: [{ key: "organ_toxicPulse", params: { stacks: 1 } }]
        }]
    }
},

// 毒素护甲：每回合首次受伤后获得3护甲
{
    label: "毒素护甲",
    key: "enemy_organ_poison_armor",
    describe: ["每回合首次受到伤害后获得3护甲"],
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
                    key: "damage",
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
            targetType: "triggerOwner",
            effect: [{ key: "organ_poisonArmor", params: { value: 3 } }]
        }],
        resetPoisonArmor: [{
            key: "resetPoisonArmor",
            label: "毒素护甲：重置标记",
            targetType: "triggerOwner",
            effect: [{ key: "removeState", params: { stateKey: "poisonArmorUsed" } }]
        }]
    }
},

// ========== 疫孢菌母器官 ==========

// 孢子腺：每回合通过孢子爆发卡向玩家塞孢子牌
{
    label: "孢子腺",
    key: "enemy_organ_spore_gland",
    describe: ["提供孢子爆发卡牌：向对手牌堆塞入3张孢子牌"],
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

// 寄生菌根：对手每累计受到8点伤害，持有者回复2点生命
{
    label: "寄生菌根",
    key: "enemy_organ_parasitic_root",
    describe: ["对手每累计受到8点伤害，回复2点生命"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Nerve,
    status: { "max-mass": 40, "lifeDrainAccum": 0 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "owner" },
            effects: [{
                key: "accumulateAndTrigger",
                params: {
                    pointKey: "lifeDrainAccum",
                    on: { when: "after", how: "take", key: "damage" },
                    triggerTarget: "allOpponents",
                    gain: "$triggerEffect.params(value)",
                    threshold: 8,
                    consume: 8,
                    targetType: "owner",
                    effects: [{ key: "heal", params: { value: 2 } }]
                }
            }]
        }
    }
},

// 腐化铠甲：回合结束时，每有1个对手具备debuff获得3点护甲
{
    label: "腐化铠甲",
    key: "enemy_organ_corruption_armor",
    describe: ["回合结束时，每有1个对手具备debuff获得3点护甲"],
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
    describe: ["施加中毒时额外+1层"],
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

// 菌网根系：回合开始时给随机1个对手施加2层中毒
{
    label: "菌网根系",
    key: "enemy_organ_mycelial_network",
    describe: ["回合开始时，给随机1个对手施加2层中毒"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Nerve,
    status: { "max-mass": 30 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "mycelialSpread"
            }]
        }
    },
    reaction: {
        mycelialSpread: [{
            key: "mycelialSpread",
            label: "菌网扩散：施加中毒",
            targetType: "owner",
            effect: [{ key: "organ_mycelialSpread", params: { stacks: 2 } }]
        }]
    }
},

// 不稳定毒囊：损坏时对所有玩家施加3层中毒
{
    label: "不稳定毒囊",
    key: "enemy_organ_volatile_sac",
    describe: ["损坏时对所有玩家施加3层中毒"],
    rarity: OrganRarity.Common,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 25 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: []
        },
        break: {
            target: { faction: "player", number: "all" },
            effects: [{ key: "applyState", params: { stateKey: "poison", stacks: 3 } }]
        }
    }
},

// ========== 炙渣王器官 ==========

// 点火核：提供重铸卡牌；持有者每打出一张攻击牌获得1层点火
{
    label: "点火核",
    key: "enemy_organ_ignition_core",
    describe: ["提供重铸卡牌；每打出一张攻击牌，自身获得1层点火"],
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
                how: "via",
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
            targetType: "triggerOwner",
            effect: [{ key: "applyState", params: { stateKey: "ignition", stacks: 1 } }]
        }]
    }
},

// 熔铸魂：提供铸铁力卡牌；战斗开始获得2层力量
{
    label: "熔铸魂",
    key: "enemy_organ_cast_soul",
    describe: ["提供铸铁力卡牌；战斗开始时获得2层力量"],
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
                how: "make",
                key: "battleStart",
                action: "gainInitialPower"
            }]
        }
    },
    reaction: {
        gainInitialPower: [{
            key: "gainInitialPower",
            label: "熔铸魂：开局力量",
            targetType: "triggerOwner",
            effect: [{ key: "applyState", params: { stateKey: "power", stacks: 2 } }]
        }]
    }
},

// 铁角腺：提供铁刺卡牌；多段攻击（multiHit）每段+1伤
{
    label: "铁角腺",
    key: "enemy_organ_iron_horn_gland",
    describe: ["提供铁刺卡牌；多段攻击每段额外造成1点伤害"],
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
                key: "damage",
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
    describe: ["提供熔铸打击与高炉护壁；获得力量时额外+1层"],
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

// 铁壁核心：提供装甲组装卡牌；战斗开始时+15甲
{
    label: "铁壁核心",
    key: "enemy_organ_iron_wall_core",
    describe: ["提供装甲组装卡牌；战斗开始时获得15点护甲"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Core,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["boss3_card_armor_assembly"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "battleStart",
                action: "openingArmor"
            }]
        }
    },
    reaction: {
        openingArmor: [{
            key: "openingArmor",
            label: "铁壁核心：开局护甲",
            targetType: "triggerOwner",
            effect: [{ key: "gainArmor", params: { value: 15 } }]
        }]
    }
},

// 过载核心：提供过载屏障卡牌；战斗开始时+1层力场护盾
{
    label: "过载核心",
    key: "enemy_organ_overload_core",
    describe: ["提供过载屏障卡牌；战斗开始时获得1层力场护盾"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Heart,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["boss3_card_overload_barrier"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "battleStart",
                action: "openingForceField"
            }]
        }
    },
    reaction: {
        openingForceField: [{
            key: "openingForceField",
            label: "过载核心：开局力场护盾",
            targetType: "triggerOwner",
            effect: [{ key: "applyState", params: { stateKey: "forceFieldShield", stacks: 1 } }]
        }]
    }
},

// 液压双管：提供火力压制卡牌；每回合首次攻击 +3 伤
{
    label: "液压双管",
    key: "enemy_organ_hydraulic_dual_gun",
    describe: ["提供火力压制卡牌；每回合首次攻击伤害+3"],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Muscle,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["boss3_card_firepower_suppression"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "before",
                how: "make",
                key: "damage",
                action: "hydraulicBoost",
                condition: {
                    and: [
                        "$triggerCard.hasTag(attack)",
                        { not: "$item.hasState(hydraulicUsed)" }
                    ]
                }
            }]
        }
    },
    reaction: {
        hydraulicBoost: [
            {
                key: "hydraulicBoost_amp",
                label: "液压双管：伤害+3",
                targetType: "triggerEffect",
                effect: [{ key: "modifyDamageValue", params: { delta: 3 } }]
            },
            {
                key: "hydraulicBoost_flag",
                label: "液压双管：标记本回合已释放",
                targetType: "item",
                effect: [{ key: "applyState", params: { stateKey: "hydraulicUsed", stacks: 1 } }]
            }
        ]
    }
},

// 钢铁意志：提供钢铁压碾卡牌；每场战斗第一次致命伤害免疫
{
    label: "钢铁意志",
    key: "enemy_organ_steel_will",
    describe: ["提供钢铁压碾卡牌；每场战斗第一次致命伤害免疫"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Nerve,
    status: { "max-mass": 40 },
    current: ["mass"],
    cards: ["boss3_card_steel_roll"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [],
            triggers: [
                {
                    when: "after", how: "make", key: "battleStart",
                    action: "lethalGuardCharge"
                },
                {
                    when: "before", how: "take", key: "damage",
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
// 事件 event_embryogenesis 逐阶段接生所得；evolutionRounds 记录事件内"进化"次数，接生时写入器官 status

// 阶段 1 · 合子（Zygote）
{
    label: "合子",
    key: "organ_embryo_stage1",
    describe: ["战斗结束时回复 8 生命", "每完成一轮进化，额外回复 2 生命"],
    rarity: OrganRarity.Common,
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
            key: "healHealth",
            label: "合子：赛后回复",
            targetType: "owner",
            effect: [
                { key: "healHealth", params: { amount: 8 } },
                { key: "repeatEffects", params: {
                    times: "$item.status(evolutionRounds)",
                    effects: [{ key: "healHealth", params: { amount: 2 } }]
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
    describe: ["每场战斗第一张攻击卡额外触发 1 次", "每完成一轮进化，额外多触发 1 次"],
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
    describe: ["回合开始时获得 5 护甲", "每完成一轮进化，额外获得 1 护甲", "提供 1 张", { "@": 0 }, "到牌组"],
    rarity: OrganRarity.Uncommon,
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
            key: "addRandomCardsToPile",
            label: "原肠胚：即时分化",
            targetType: "owner",
            effect: [{
                key: "addRandomCardsToPile",
                params: {
                    cardKey: "card_embryo_differentiation",
                    count: 1,
                    pileName: "handPile"
                }
            }]
        }]
    }
},

// 阶段 5 · 神经胚（Neurula）
{
    label: "神经胚",
    key: "organ_embryo_stage5",
    describe: ["每场战斗胜利后获得 5 最大生命并回复 5 生命", "每完成一轮进化，额外获得 2 最大生命", "提供 1 张", { "@": 0 }, "到牌组"],
    rarity: OrganRarity.Rare,
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
                // TODO(trigger): condition 需限定 event.info.result === "win"；当前不判胜负
                action: "neurulaGrow"
            }]
        }
    },
    reaction: {
        // TODO(condition): 战斗失败时也会触发 battleEnd；理论上应加 condition 判 event.info.result === "win"
        // 现有 $expr 语法不支持读取 event.info.*，先不判胜负——失败时 gameOver 弹窗压住，增益不会实际影响
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