import { Describe } from "@/ui/hooks/express/describe"
import { Organ } from "@/core/objects/target/Organ"
import { TargetMap } from "@/core/objects/target/Target"
import { ItemMap } from "@/core/objects/item/Item"
import { OrganQuality } from "./organQuality"
import { OrganPart } from "./organPart"
import { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { Component } from "vue"

/**
 * 器官升级里程碑配置
 */
export interface OrganUpgradeMilestone {
    level: number                   // 达到此等级时触发
    effects?: EffectUnit[]          // 效果列表
    component?: string | Component  // 自定义组件
    componentData?: any             // 传递给组件的数据
}

/**
 * 器官升级配置
 */
export interface OrganUpgradeConfig {
    // 自定义升级成本（可选，不填则使用稀有度默认值）
    cost?: number | ((organ: Organ) => number)

    // 每级通用效果（可选）
    perLevel?: {
        effects: EffectUnit[]
    }

    // 特定等级的里程碑（可选）
    milestones?: OrganUpgradeMilestone[]
}

export type OrganMap = ItemMap&TargetMap&{
    label:string,
    key:string,
    describe?:Describe,
    cards?: string[]  // 器官提供的卡牌列表（卡牌的 key）
    entry?: string[]  // 器官的词条列表（词条的 key）

    // 新增属性
    quality: OrganQuality  // 稀有度（必填）
    level?: number         // 等级（默认为 1）
    part?: OrganPart       // 部位（可选，不填表示不占据部位）
    absorbValue?: number   // 吞噬获取量（可选，不填则使用稀有度的默认值）

    // 升级配置（可选）
    upgrade?: OrganUpgradeConfig

    // 质量系统（可选）
    // 如果 status 中定义了 "max-mass"，则器官具有质量属性
    // current 中需要包含 "mass" 来存储当前质量值
}

export const organList:OrganMap[] = [
    {
        label:"心脏",
        key:"original_organ_00001",
        describe:["■"],
        quality: OrganQuality.Common,
        part: OrganPart.Heart,
        status: {
            "max-mass": 30
        },
        current: ["mass"],
        interaction:{}
    },{
        label:"石芯",
        key:"original_organ_00002",
        describe:["最大生命+3"],
        quality: OrganQuality.Uncommon,
        part: OrganPart.Heart,
        status: {
            "max-mass": 40
        },
        current: ["mass"],
        interaction:{
            possess:{
                target:{"key":"self"},
                effects:[],
                modifiers:[{
                    statusKey:"max-health",
                    targetLayer:"base",
                    modifierType:"additive",
                    modifierValue:3
                }]
            }
        },

    },{
        label:"石肤",
        key:"original_organ_00003",
        describe:["受到的伤害值-1"],
        quality: OrganQuality.Uncommon,
        part: OrganPart.Skin,
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
                    event:[{
                        key:"reduceDamage",
                        label:"石肤防护",
                        targetType:"triggerEffect",  // 把触发效果（damage效果）作为目标
                        effect:[
                            {key:"reduceDamageValue",params:{value:1}}
                        ]
                    }]
                }]
            }
        }
    },{
        label:"战斗之心",
        key:"test_organ_cards_001",
        describe:["提供1张【打击】卡牌到牌组"],
        quality: OrganQuality.Common,
        part: OrganPart.Heart,
        status: {
            "max-mass": 30
        },
        current: ["mass"],
        cards:["original_card_00001"],  // 提供"打击"
        interaction:{
            get:{
                target:{"key":"self"},
                effects:[{
                    key:"addStatusBaseCurrentValue",
                    params:{value:2,statusKey:"max-health",currentKey:"health"},
                    describe:["获得2点最大生命"]
                }]
            }
        }
    },{
        label:"狂暴腺体",
        key:"test_organ_cards_002",
        describe:["提供1张【消耗打击】和1张【肌肉强化】到牌组"],
        quality: OrganQuality.Rare,
        part: OrganPart.Gland,
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
        describe:["提供1张【旋风斩】到牌组","损坏后卡牌无法使用"],
        quality: OrganQuality.Epic,
        part: OrganPart.Core,
        status: {
            "max-mass": 35
        },
        current: ["mass"],
        cards:["original_card_00005"],  // 提供"旋风斩"
        interaction:{
            get:{
                target:{"key":"self"},
                effects:[{
                    key:"addStatusBaseCurrentValue",
                    params:{value:5,statusKey:"max-health",currentKey:"health"},
                    describe:["获得5点最大生命"]
                }]
            },
            work:{
                target:{"key":"self"},
                effects:[],
                triggers:[{
                    how:"make",
                    key:"useCard",
                    event:[{
                        key:"drawCard",
                        label:"旋风引擎：打牌时抽1张",
                        targetType:"triggerOwner",
                        effect:[{
                            key:"drawFromDrawPile",
                            params:{value:1}
                        }]
                    }]
                }]
            }
        }
    },{
        label:"末日核心",
        key:"test_organ_cards_004",
        describe:["提供1张【末日】到牌组","危险而强大"],
        quality: OrganQuality.Legendary,
        part: OrganPart.Core,
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
    }
]

//通过key来获取器官对象
export function getOrganByKey(key:string):Organ{
    const data = organList.find(value=>value.key==key)
    if(!data)throw new Error("没有该器官对象")
    const organ = new Organ(data)
    return organ
}