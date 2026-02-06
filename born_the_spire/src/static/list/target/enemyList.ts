import { Enemy } from "@/core/objects/target/Enemy"
import { CharaMap } from "@/core/objects/target/Target"
import { EnemyBehaviorConfig } from "@/core/objects/system/EnemyBehavior"
import { reactive } from "vue"

export type EnemyMap = CharaMap & {
    key:string
    status:Record<string,number|boolean>,
    behavior?: EnemyBehaviorConfig  // 敌人行为配置
    cards?: string[]  // 敌人专属卡牌（不通过器官提供）
}

export const enemyList:EnemyMap[] = [
    // 原有的小石怪
    {
        label:"小石怪",
        key:"original_enemy_00001",
        status:{
            "max-health":30
        },
        organ:[
            "original_organ_00002",  // 石芯 - 增加生命
            "original_organ_00003"   // 石肤 - 减伤
        ],
        cards:[
            "enemy_stone_strike"  // 专属攻击：石击
        ],
        behavior: {
            patterns: [],
            fallback: {
                action: {
                    selector: { tags: ["attack"] },
                    mode: "random"
                },
                describe: "随机攻击"
            }
        }
    },

    // 示例1：史莱姆 - 简单随机攻击
    {
        label:"史莱姆",
        key:"test_enemy_slime",
        status:{
            "max-health":40,
            "action-order": 0  // 行动顺序：最先行动
        },
        organ:[
            "test_organ_cards_001"  // 战斗之心 - 提供打击
        ],
        behavior: {
            patterns: [],
            fallback: {
                action: {
                    selector: { tags: ["attack"] },
                    mode: "random"
                },
                describe: "随机使用攻击牌"
            }
        }
    },

    // 示例2：狂战士 - 血量越低攻击越猛
    {
        label:"狂战士",
        key:"test_enemy_berserker",
        status:{
            "max-health":60
        },
        organ:[
            "test_organ_cards_001",  // 战斗之心 - 提供打击
            "test_organ_cards_002"   // 狂暴腺体 - 提供消耗打击和肌肉强化
        ],
        behavior: {
            patterns: [
                {
                    // 血量低于30%时：狂暴
                    priority: 10,
                    condition: {
                        selfHealth: { below: 30 }
                    },
                    action: {
                        selector: { tags: ["attack"] },
                        mode: "weighted",
                        weights: {
                            "original_card_00002": 5  // 消耗打击：高权重
                        }
                    },
                    describe: "血量<30%：狂暴攻击"
                },
                {
                    // 第1回合：强化自己
                    priority: 5,
                    condition: {
                        turn: { equals: 1 }
                    },
                    action: {
                        selector: { tags: ["power"] },
                        mode: "random"
                    },
                    describe: "第1回合：强化"
                }
            ],
            fallback: {
                action: {
                    selector: { tags: ["attack"] },
                    mode: "random"
                },
                describe: "默认：随机攻击"
            }
        }
    },

    // 示例3：法师 - 循环攻击和强化
    {
        label:"法师",
        key:"test_enemy_mage",
        status:{
            "max-health":35
        },
        organ:[
            "test_organ_cards_001",  // 战斗之心
            "test_organ_cards_002"   // 狂暴腺体
        ],
        behavior: {
            patterns: [
                {
                    // 循环：攻击 → 强化 → 攻击 → 强化
                    priority: 0,
                    action: {
                        selector: {},
                        mode: "loop",
                        sequence: [
                            "original_card_00001",  // 打击
                            "original_card_00004"   // 肌肉强化
                        ]
                    },
                    describe: "循环：攻击和强化交替"
                }
            ]
        }
    },

    // 示例4：精英怪 - 多次行动
    {
        label:"双头蛇",
        key:"test_enemy_elite",
        status:{
            "max-health":80,
            "actions-per-turn": 2,  // 每回合行动2次
            "action-order": 5  // 行动顺序：较晚行动
        },
        organ:[
            "test_organ_cards_001",
            "test_organ_cards_002"
        ],
        behavior: {
            patterns: [
                {
                    // 每3回合强化
                    priority: 10,
                    condition: {
                        turn: { mod: [3, 0] }
                    },
                    action: {
                        selector: { tags: ["power"] },
                        mode: "random"
                    },
                    describe: "每3回合：强化"
                }
            ],
            fallback: {
                action: {
                    selector: { tags: ["attack"] },
                    mode: "random"
                },
                describe: "默认：攻击"
            }
        }
    },

    // 示例5：Boss - 多阶段行为
    {
        label:"守护者",
        key:"test_enemy_boss",
        status:{
            "max-health":150,
            "action-order": 10  // 行动顺序：最后行动
        },
        organ:[
            "test_organ_cards_001",
            "test_organ_cards_002"
        ],
        behavior: {
            patterns: [
                {
                    // 第一阶段（血量>66%）：防守为主
                    priority: 10,
                    condition: {
                        selfHealth: { above: 66 }
                    },
                    action: {
                        selector: { tags: ["power"] },
                        mode: "random"
                    },
                    describe: "第一阶段：蓄力"
                },
                {
                    // 第二阶段（33%-66%）：攻击为主
                    priority: 10,
                    condition: {
                        selfHealth: { above: 33 }
                    },
                    action: {
                        selector: { tags: ["attack"] },
                        mode: "weighted",
                        weights: {
                            "original_card_00002": 3  // 消耗打击
                        }
                    },
                    describe: "第二阶段：猛攻"
                },
                {
                    // 第三阶段（<33%）：狂暴
                    priority: 10,
                    condition: {
                        selfHealth: { below: 33 }
                    },
                    action: {
                        selector: { tags: ["attack"] },
                        mode: "weighted",
                        weights: {
                            "original_card_00002": 5  // 消耗打击：超高权重
                        }
                    },
                    describe: "第三阶段：狂暴"
                }
            ],
            fallback: {
                action: {
                    selector: { tags: ["attack"] },
                    mode: "random"
                },
                describe: "默认攻击"
            }
        }
    }
]

export function getEnemyByKey(key:string){
    const data = enemyList.find(value=>value.key == key)
    if(!data)throw new Error("没有指定的敌人存在")
    const enemy = reactive(new Enemy(data as any)) as unknown as Enemy
    return enemy
}