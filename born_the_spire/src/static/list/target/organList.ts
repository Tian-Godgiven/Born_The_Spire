import { Describe } from "@/ui/hooks/express/describe"
import { Organ } from "@/core/objects/target/Organ"
import { TargetMap } from "@/core/objects/target/Target"
import { ItemMap } from "@/core/objects/item/Item"

export type OrganMap = ItemMap&TargetMap&{
    label:string,
    key:string,
    describe?:Describe,
    cards?: string[]  // 器官提供的卡牌列表（卡牌的 key）
    entry?: string[]  // 器官的词条列表（词条的 key）
}

export const organList:OrganMap[] = [
    {
        label:"心脏",
        key:"original_organ_00001",
        interaction:{}
    },{
        label:"石芯",
        key:"original_organ_00002",
        describe:["获得3点最大生命"],
        interaction:{
            get:{
                "target":{"key":"self"},
                effects:[{
                    "key":"addStatusBaseCurrentValue",
                    params:{value:3,statusKey:"max-health",currentKey:"health"},
                    "describe":["获得3点最大生命"],
                }]
            }
        },

    },{
        label:"石肤",
        key:"original_organ_00003",
        describe:["受到的伤害值-1"],
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