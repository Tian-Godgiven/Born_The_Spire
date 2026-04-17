import type { PlayerMap } from "@/core/objects/target/Player"

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
            {when:"after",how:"take",key:"turnStart",action:"drawCardOnTurnStart",
            importantKey:"turnStart_drawCard",
            onlyKey:"turnStart_drawCard"
        },
        // 回合结束时弃掉所有手牌
        {when:"after",how:"take",key:"turnEnd",action:"discardOnTurnEnd",
        importantKey:"discardOnTurnEnd",
        onlyKey:"discardAll"
        }
        ],
        reaction:{
            drawCardOnTurnStart:[{
                key:"turnStartDrawCard",
                label:"回合开始时抽卡",
                targetType:"triggerOwner",
                effect:[
                    {key:"drawFromDrawPile",params:{value:{fromStatus:"draw-per-turn"}}}
                ]
            }],
            discardOnTurnEnd:[{
                key:"discardAllHandCard",
                label:"回合结束时弃牌",
                targetType:"triggerOwner",
                effect:[
                    {key:"discardAllCard",params:{pileName:"handPile"}}
                ]
            }],
            recoverEnergy:[{
                key:"turnStart_recoverEnergy",
                label:"回合开始时恢复能量",
                effect:[{key:"getEnergy", params:{value:"max"}}],
                targetType:"triggerOwner",
            }],
            emptyEnergy:[{
                key:"turnEnd_emptyEnergy",
                label:"回合结束时清空能量",
                effect:[{key:"emptyEnergy", params:{}}],
                targetType:"triggerOwner",
            }]
        },
        potion:{
            now:["original_potion_00001","original_potion_00004"]  // 生命药剂 + 火焰药水
        },
        organ:[
            "original_organ_00001",
            "test_organ_cards_002",  // 狂暴腺体 - 提供消耗打击和肌肉强化
        ],
        card:[
                "original_card_00001",
                "original_card_00014",

                "sts_card_claw",
                "sts_card_claw",
                "sts_card_all_for_one",
                "sts_card_dagger_spray",
                "sts_card_piercing_wail",
            ],
        relic:[
            "original_relic_00001",  // 回血石 - 战斗结束时回复生命
            "original_relic_00005",  // 先手之戒 - 第一回合额外抽2张牌
            "original_relic_pistol",  // 袖珍手枪 - 战斗中右键射击敌人
        ]
    }
}