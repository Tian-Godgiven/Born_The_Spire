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
                    key: "getEnergy",
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
                    requireFromAttackCard: true
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

// ========== Boss 1：废堆融合体器官 ==========

// 腐化积累腺：每回合结束+2腐化层；达到10层时对所有对手造成30点直接伤害并清零
{
    label: "腐化积累腺",
    key: "boss1_organ_corruption_tick",
    describe: ["每回合结束+2腐化层", "腐化达到10层时对所有对手造成30点直接伤害并清零"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
    status: { "max-mass": 50 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnEnd",
                action: "corruptionTick"
            }]
        }
    },
    reaction: {
        corruptionTick: [{
            key: "corruptionTick",
            label: "腐化积累腺：积累腐化",
            targetType: "triggerOwner",
            effect: [{ key: "boss_corruptionTick", params: { add: 2, threshold: 10, overloadDamage: 30 } }]
        }]
    }
},

// 腐化核心：每次打出一张牌，对所有对手施加1层中毒
{
    label: "腐化核心",
    key: "boss1_organ_corruption_core",
    describe: ["每次打出一张牌，对所有对手施加1层中毒"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
    status: { "max-mass": 40 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "useCard",
                action: "corruptionCorePoison"
            }]
        }
    },
    reaction: {
        corruptionCorePoison: [{
            key: "corruptionCorePoison",
            label: "腐化核心：出牌施毒",
            targetType: "triggerOwner",
            effect: [{ key: "boss_corruptionCorePoison", params: { stacks: 1 } }]
        }]
    }
},

// 废铁骨架：持有时获得壁垒；回合开始时，护甲/5转化为临时力量
{
    label: "废铁骨架",
    key: "boss1_organ_iron_skeleton",
    describe: ["护甲不在回合开始时消失", "每回合开始，护甲每5点提供1层临时力量"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Bone,
    status: { "max-mass": 45 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [{ key: "applyState", params: { stateKey: "barricade", stacks: 1 } }]
        },
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "armorToPower"
            }]
        }
    },
    reaction: {
        armorToPower: [{
            key: "armorToPower",
            label: "废铁骨架：护甲转力量",
            targetType: "triggerOwner",
            effect: [{ key: "boss_armorToPower", params: { armorPerPower: 5 } }]
        }]
    }
},

// 过热引擎：战斗开始时失去8点生命；每回合开始获得1点能量
{
    label: "过热引擎",
    key: "boss1_organ_overheat_engine",
    describe: ["战斗开始时失去8点生命", "每回合开始获得1点能量"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
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
                    action: "overheatCost"
                },
                {
                    when: "after",
                    how: "make",
                    key: "turnStart",
                    action: "overheatEnergy"
                }
            ]
        }
    },
    reaction: {
        overheatCost: [{
            key: "overheatCost",
            label: "过热引擎：战斗代价",
            targetType: "triggerOwner",
            effect: [{ key: "loseHp", params: { value: 8 } }]
        }],
        overheatEnergy: [{
            key: "overheatEnergy",
            label: "过热引擎：获得能量",
            targetType: "triggerOwner",
            effect: [{ key: "getEnergy", params: { value: 1 } }]
        }]
    }
},

// 融合甲壳：最大生命+20；受到伤害时获得1层变硬
{
    label: "融合甲壳",
    key: "boss1_organ_fusion_shell",
    describe: ["最大生命+20", "受到伤害时获得1层变硬"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Skin,
    status: { "max-mass": 60 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [{ key: "addMaxHealthAndHeal", params: { value: 20 } }]
        },
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "take",
                key: "damage",
                action: "fusionHarden"
            }]
        }
    },
    reaction: {
        fusionHarden: [{
            key: "fusionHarden",
            label: "融合甲壳：受伤变硬",
            targetType: "triggerOwner",
            effect: [{ key: "applyState", params: { stateKey: "harden", stacks: 1 } }]
        }]
    }
},

// ========== Boss 2：剧毒菌母器官 ==========

// 孢子腺体：每回合开始对所有对手施加3层中毒；每回合结束若对手中毒≥10则造成15点直接伤害
{
    label: "孢子腺体",
    key: "boss2_organ_spore_passive",
    describe: ["每回合开始对所有对手施加3层中毒", "每回合结束若对手中毒≥10，造成15点直接伤害"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 55 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [
                {
                    when: "after",
                    how: "make",
                    key: "turnStart",
                    action: "sporeSpread"
                },
                {
                    when: "after",
                    how: "make",
                    key: "turnEnd",
                    action: "poisonSurge"
                }
            ]
        }
    },
    reaction: {
        sporeSpread: [{
            key: "sporeSpread",
            label: "孢子腺体：孢子扩散",
            targetType: "triggerOwner",
            effect: [{ key: "boss_sporePassive", params: { stacks: 3 } }]
        }],
        poisonSurge: [{
            key: "poisonSurge",
            label: "孢子腺体：中毒爆发",
            targetType: "triggerOwner",
            effect: [{ key: "boss_poisonSurge", params: { threshold: 10, damage: 15 } }]
        }]
    }
},

// 孢子腺网：回合结束，按所有对手中毒总层数回血（上限10）
{
    label: "孢子腺网",
    key: "boss2_organ_spore_net",
    describe: ["回合结束，按所有对手中毒总层数回复生命（上限10）"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 35 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnEnd",
                action: "toxicHeal"
            }]
        }
    },
    reaction: {
        toxicHeal: [{
            key: "toxicHeal",
            label: "孢子腺网：毒素回血",
            targetType: "triggerOwner",
            effect: [{ key: "boss_toxicHeal", params: { maxHeal: 10 } }]
        }]
    }
},

// 剧毒核心：你施加中毒时额外+2层
{
    label: "剧毒核心",
    key: "boss2_organ_toxic_amplifier",
    describe: ["施加中毒时额外+2层"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
    status: { "max-mass": 40 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "before",
                how: "make",
                key: "applyState",
                action: "toxicAmplify"
            }]
        }
    },
    reaction: {
        toxicAmplify: [{
            key: "toxicAmplify",
            label: "剧毒核心：中毒放大",
            targetType: "triggerEffect",
            effect: [{ key: "boss_toxicAmplify", params: { addStacks: 2 } }]
        }]
    }
},

// 菌网根系：每回合开始对随机一名对手施加3层中毒
{
    label: "菌网根系",
    key: "boss2_organ_mycelium_roots",
    describe: ["每回合开始对随机一名对手施加3层中毒"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Gland,
    status: { "max-mass": 30 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnStart",
                action: "myceliumSpread"
            }]
        }
    },
    reaction: {
        myceliumSpread: [{
            key: "myceliumSpread",
            label: "菌网根系：菌网扩散",
            targetType: "triggerOwner",
            effect: [{ key: "boss_myceliumSpread", params: { stacks: 3 } }]
        }]
    }
},

// 毒素硬化：每回合开始，获得等于所有对手中毒总层数的护甲（上限20）
{
    label: "毒素硬化",
    key: "boss2_organ_toxic_armor",
    describe: ["每回合开始，按所有对手中毒总层数获得护甲（上限20）"],
    rarity: OrganRarity.Rare,
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
                action: "toxicArmor"
            }]
        }
    },
    reaction: {
        toxicArmor: [{
            key: "toxicArmor",
            label: "毒素硬化：毒素防御",
            targetType: "triggerOwner",
            effect: [{ key: "boss_toxicArmor", params: { maxArmor: 20 } }]
        }]
    }
},

// ========== Boss 3：废铁战甲器官 ==========

// 过载积甲腺：持有时获得壁垒+每回合结束+8护甲；护甲≥40时钢铁压碾（60点直接伤害+护甲清零）
{
    label: "过载积甲腺",
    key: "boss3_organ_armor_core",
    describe: [
        "护甲不在回合开始时消失",
        "每回合结束获得8点护甲",
        "护甲达到40时：对所有对手造成60点直接伤害并清零护甲"
    ],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
    status: { "max-mass": 60 },
    current: ["mass"],
    interaction: {
        possess: {
            target: { key: "self" },
            effects: [
                { key: "applyState", params: { stateKey: "barricade", stacks: 1 } },
                { key: "applyState", params: { stateKey: "metallicize", stacks: 8 } }
            ]
        },
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "turnEnd",
                action: "armorOverload"
            }]
        }
    },
    reaction: {
        armorOverload: [{
            key: "armorOverload",
            label: "过载积甲腺：钢铁压碾",
            targetType: "triggerOwner",
            effect: [{ key: "boss_armorOverload", params: { threshold: 40, damage: 60 } }]
        }]
    }
},

// 过载引擎：每回合开始，护甲/5转化为临时力量
{
    label: "过载引擎",
    key: "boss3_organ_overload_engine",
    describe: ["每回合开始，护甲每5点提供1层临时力量"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
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
                action: "overloadEnginePower"
            }]
        }
    },
    reaction: {
        overloadEnginePower: [{
            key: "overloadEnginePower",
            label: "过载引擎：护甲转力量",
            targetType: "triggerOwner",
            effect: [{ key: "boss_armorToPower", params: { armorPerPower: 5 } }]
        }]
    }
},

// 铁壁核心：战斗开始时获得15点护甲
{
    label: "铁壁核心",
    key: "boss3_organ_iron_wall_core",
    describe: ["战斗开始时获得15点护甲"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Skin,
    status: { "max-mass": 45 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "battleStart",
                action: "ironWallArmor"
            }]
        }
    },
    reaction: {
        ironWallArmor: [{
            key: "ironWallArmor",
            label: "铁壁核心：战斗开始护甲",
            targetType: "triggerOwner",
            effect: [{ key: "gainArmor", params: { value: 15 } }]
        }]
    }
},

// 废铁同化：击杀敌人时获得10点护甲
{
    label: "废铁同化",
    key: "boss3_organ_iron_assimilation",
    describe: ["击杀敌人时获得10点护甲"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Bone,
    status: { "max-mass": 35 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "kill",
                action: "ironAssimilation"
            }]
        }
    },
    reaction: {
        ironAssimilation: [{
            key: "ironAssimilation",
            label: "废铁同化：击杀获甲",
            targetType: "triggerOwner",
            effect: [{ key: "gainArmor", params: { value: 10 } }]
        }]
    }
},

// 钢铁意志：每场战斗1次，受到致命伤害时以1点生命存活
{
    label: "钢铁意志",
    key: "boss3_organ_steel_will",
    describe: ["每场战斗1次，受到致命伤害时以1点生命存活"],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Bone,
    status: { "max-mass": 50 },
    current: ["mass"],
    interaction: {
        work: {
            target: { key: "self" },
            effects: [],
            triggers: [
                {
                    when: "before",
                    how: "take",
                    key: "damage",
                    action: "steelWillCheck"
                },
                {
                    when: "after",
                    how: "make",
                    key: "battleStart",
                    action: "steelWillReset"
                }
            ]
        }
    },
    reaction: {
        steelWillCheck: [{
            key: "steelWillCheck",
            label: "钢铁意志：抵御致命",
            targetType: "triggerEffect",
            sourceTargetType: "triggerOwner",
            effect: [{ key: "boss_steelWill", params: {} }]
        }],
        steelWillReset: [{
            key: "steelWillReset",
            label: "钢铁意志：重置",
            targetType: "triggerOwner",
            effect: [{ key: "removeState", params: { stateKey: "steelWillUsed" } }]
        }]
    }
},
]

//通过key来获取器官对象
export async function getOrganByKey(key:string){
    const data = organList.find(value=>value.key==key)
    if(!data)throw new Error("没有该器官对象")
    const organ = await createOrgan(data)
    return organ
}