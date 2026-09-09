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
            "shopDiscount":1,//商店折扣系数（1=原价，0.5=半价）
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
                    {key:"discardHandOnTurnEnd",params:{}}
                ]
            }],
            recoverEnergy:[{
                key:"turnStart_recoverEnergy",
                label:"回合开始时恢复能量",
                effect:[{key:"refillEnergy", params:{}}],
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
            now:[]
        },
        organ:[
            "original_organ_00001",  // 心脏 - 基础器官，不可移除
        ],
        // 测试卡由 settings.testMode 在 createPlayer 时注入，见 TEST_STARTER_CARDS
        card: [],
        relic:[]
    }
}