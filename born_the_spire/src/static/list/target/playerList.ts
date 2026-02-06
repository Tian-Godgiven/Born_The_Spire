import { CharaMap } from "@/core/objects/target/Target"

export type PlayerMap = CharaMap & {
    key:string
    reserves?:Record<string,number>,  // 储备（金钱等）
    potion:{
        now:string[]  // 初始拥有的药水
    }
    organ:string[]
    card:string[],
    relic?:string[]  // 初始拥有的遗物
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
            "draw-per-turn":5,//每回合抽牌数
        },
        current:["health","energy","isAlive"],
        //默认触发器：回合开始时抽牌（数量由 draw-per-turn 属性决定）
        trigger:[
            {when:"after",how:"take",key:"turnStart","event":[{
                key:"turnStartDrawCard",
                label:"回合开始时抽卡",
                targetType:"triggerOwner",
                effect:[
                    {key:"drawFromDrawPile",params:{value:{fromStatus:"draw-per-turn"}}}
                ]
            }],
            importantKey:"turnStart_drawCard",
            onlyKey:"turnStart_drawCard"
        },
        // 回合结束时弃掉所有手牌
        {when:"after",how:"take",key:"turnEnd","event":[{
            key:"discardAllHandCard",
            label:"回合结束时弃牌",
            targetType:"triggerOwner",
            effect:[
                {key:"discardAllCard",params:{pileName:"handPile"}}
            ]
        }],
        importantKey:"discardOnTurnEnd",
        onlyKey:"discardAll"
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
                "test_card_kill",       // 终结一击 - 快速击杀敌人
                "original_card_00001",  // 打击 x2
                "original_card_00001",
                "original_card_00014",  // 防御 - 测试护甲
                "original_card_00015",  // 铁壁 - 测试护甲
            ],
        relic:[
            "original_relic_00001",  // 回血石 - 战斗结束时回复生命
            "original_relic_00005",  // 先手之戒 - 第一回合额外抽2张牌
        ]
    }
}