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
    }
]

//通过key来获取器官对象
export async function getOrganByKey(key:string){
    const data = organList.find(value=>value.key==key)
    if(!data)throw new Error("没有该器官对象")
    const organ = await createOrgan(data)
    return organ
}