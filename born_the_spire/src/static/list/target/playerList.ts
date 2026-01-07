import { CharaMap } from "@/core/objects/target/Target"

export type PlayerMap = CharaMap & {
    key:string
    reserves?:Record<string,number>,  // 储备（金钱等）
    potion:{
        now:string[]  // 初始拥有的药水
    }
    organ:string[]
    card:string[],
}
export const playerList:Record<string,PlayerMap> = {
    "default":{
        label:"你",
        key:"original_chara_00001",
        reserves:{
            "gold":100,  // 初始金钱
        },
        status:{
            "max-health":50,//最大生命值
            "max-energy":3,//最大能量
            "max-potion":3,//最大药水数量
        },
        current:["health","energy"],
        //默认触发器：回合开始时抽5张卡牌
        trigger:[
            {when:"after",how:"take",key:"turnStart","event":[{
                key:"turnStartDrawCard",
                label:"回合开始时抽卡",
                targetType:"triggerOwner",
                effect:[
                    {key:"drawFromDrawPile",params:{value:5}}
                ]
            }],
            importantKey:"turnStart_drawCard",
            onlyKey:"turnStart_drawCard"
        }
        ],
        potion:{
            now:["original_potion_00001"]
        },
        organ:[
            "original_organ_00001",
            "test_organ_cards_001",  // 战斗之心 - 提供打击
            "test_organ_cards_002",  // 狂暴腺体 - 提供消耗打击和肌肉强化
        ],
        card:[  "original_card_00001",
                // "original_card_00002",
                // "original_card_00003",
                "original_card_00005",
                "original_card_00006",
                "original_card_00007",
                // "original_card_00004"
            ],
    }
}