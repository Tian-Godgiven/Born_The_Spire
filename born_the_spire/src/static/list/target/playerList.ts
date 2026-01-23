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
            "soul":5,    // 初始灵魂（用于测试多储备显示）
        },
        status:{
            "max-health":50,//最大生命值
            "max-energy":3,//最大能量
            "max-potion":3,//最大药水数量
        },
        current:["health","energy","isAlive"],
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
            now:["original_potion_00001","original_potion_00004"]  // 生命药剂 + 火焰药水
        },
        organ:[
            "original_organ_00001",
            "test_organ_cards_002",  // 狂暴腺体 - 提供消耗打击和肌肉强化
        ],
        card:[
                "original_card_00010",  // 虚弱诅咒 - 测试虚弱状态
                "original_card_00011",  // 易伤打击 - 测试易伤状态
                "original_card_00001",  // 打击 x10 - 测试基础卡牌
                "original_card_00001",
                "original_card_00001",
                "original_card_00012",  // 固有打击 - 测试固有词条
                "original_card_00003",  // 虚无打击 - 测试虚无词条
                "original_card_00002",  // 消耗打击 - 测试消耗词条
            ],
    }
}