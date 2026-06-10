import { Enemy } from "@/core/objects/target/Enemy"
import type { EnemyMap } from "@/core/objects/target/Enemy"
import { reactive } from "vue"
import { createEnemy } from "@/core/factories"

export const enemyList:EnemyMap[] = [
    // // 原有的小石怪
    // {
    //     label:"小石怪",
    //     key:"original_enemy_00001",
    //     status:{
    //         "max-health":30
    //     },
    //     organ:[
    //         "original_organ_00003"   // 石肤 - 减伤
    //     ],
    //     cards:[
    //         "enemy_stone_strike"  // 专属攻击：石击
    //     ],
    //     behavior: {
    //         patterns: [],
    //         fallback: {
    //             action: {
    //                 selector: { tags: ["attack"] },
    //                 mode: "random"
    //             },
    //             describe: "随机攻击"
    //         }
    //     }
    // },

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
                intent: "attack",
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
                    intent: "attack",
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
                    intent: "buff",
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
                intent: "attack",
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
                    // 注意：loop 模式下意图类型随卡牌变化，不声明 intent，由 tag 推导
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
                    intent: "buff",
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
                intent: "attack",
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
                    intent: "buff",
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
                    intent: "attack",
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
                    intent: "attack",
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
                intent: "attack",
                action: {
                    selector: { tags: ["attack"] },
                    mode: "random"
                },
                describe: "默认攻击"
            }
        }
    }
    ,
    // 不屈小鼠 - 测试用沙包
    {
        label: "不屈小鼠",
        key: "test_enemy_mouse",
        status: {
            "max-health": 50
        },
        organ: [
            "test_organ_cards_001",   // 战斗之心 - 提供打击
            "organ_resilient_shell"   // 不屈甲壳 - 每受10点伤害获得1护甲
        ],
        behavior: {
            patterns: [
                {
                    priority: 5,
                    intent: "defend",
                    condition: {
                        turn: { mod: [2, 0] }
                    },
                    action: {
                        selector: { tags: ["defence"] },
                        mode: "random"
                    },
                    describe: "偶数回合：防御"
                }
            ],
            fallback: {
                intent: "attack",
                action: {
                    selector: { tags: ["attack"] },
                    mode: "random"
                },
                describe: "默认：攻击"
            }
        }
    },

    // ========== 第一层：有机体 ==========

    {
        label: "蚁兵",
        key: "enemy_ant_soldier",
        status: { "max-health": 25 },
        organ: [
            { key: "enemy_organ_ant_mandible", level: 1 },
            "enemy_organ_ant_acid_gland"
        ]
    },

    {
        label: "蚁卫",
        key: "enemy_ant_guard",
        status: { "max-health": 45 },
        organ: [
            { key: "enemy_organ_ant_mandible", level: 2 },
            "enemy_organ_ant_carapace",
            "enemy_organ_ant_charge_gland"
        ]
    },

    {
        label: "孢子菌",
        key: "enemy_spore_fungus",
        status: { "max-health": 35 },
        organ: [
            "enemy_organ_fungal_cap",
            "enemy_organ_spore_sac"
        ]
    },

    {
        label: "毒液蟾",
        key: "enemy_poison_toad",
        status: { "max-health": 30 },
        organ: [
            "enemy_organ_poison_gland",
            "enemy_organ_poison_skin",
            "enemy_organ_sticky_tongue"
        ]
    },

    // ========== 第一层：机械 ==========

    {
        label: "装甲哨卫",
        key: "enemy_armored_sentry",
        status: { "max-health": 50 },
        organ: [
            "enemy_organ_rusty_separator",
            "enemy_organ_charge_cannon"
        ]
    },

    {
        label: "维修无人机",
        key: "enemy_repair_drone",
        status: { "max-health": 20 },
        organ: [
            "enemy_organ_repair_module",
            "enemy_organ_emergency_battery"
        ]
    },

    {
        label: "故障机器",
        key: "enemy_broken_machine",
        status: { "max-health": 40 },
        organ: [
            "enemy_organ_unstable_battery",
            "enemy_organ_heavy_hammer"
        ]
    },

    // ========== 第一层精英 ==========

    {
        label: "蚁后",
        key: "enemy_ant_queen",
        status: { "max-health": 70 },
        organ: [
            "enemy_organ_pheromone_gland",
            "enemy_organ_queen_mandible",
            "enemy_organ_royal_carapace"
        ]
    },

    {
        label: "废堆猎手",
        key: "enemy_heap_hunter",
        status: { "max-health": 150 },
        organ: [
            "enemy_organ_corruption_gland",
            "enemy_organ_life_steal",
            "enemy_organ_rot_jaw",
            "enemy_organ_filthy_hide"
        ]
    },

    {
        label: "铁壁要塞",
        key: "enemy_iron_fortress",
        status: { "max-health": 120 },
        organ: [
            "enemy_organ_barricade_shell",
            "enemy_organ_metallicize_core",
            "enemy_organ_defense_module",
            "enemy_organ_malleable_plating"
        ]
    },

    {
        label: "有毒混合物",
        key: "enemy_toxic_amalgam",
        status: { "max-health": 100 },
        organ: [
            "enemy_organ_toxic_core",
            "enemy_organ_poison_armor",
            "enemy_organ_volatile_sac"
        ]
    },

    // ========== 第一层Boss ==========

    // Boss 1：废堆融合体 — 腐化积累定时炸弹
    {
        label: "废堆融合体",
        key: "enemy_heap_amalgam",
        status: {
            "max-health": 220,
            "action-order": 20
        },
        organ: [
            "boss1_organ_corruption_tick",
            "boss1_organ_corruption_core",
            "boss1_organ_iron_skeleton",
            "boss1_organ_overheat_engine",
            "boss1_organ_fusion_shell"
        ]
    },

    // Boss 2：剧毒菌母 — 中毒滚雪球DoT施压
    {
        label: "剧毒菌母",
        key: "enemy_toxic_mother",
        status: {
            "max-health": 260,
            "action-order": 20
        },
        organ: [
            "boss2_organ_spore_passive",
            "boss2_organ_spore_net",
            "boss2_organ_toxic_amplifier",
            "boss2_organ_mycelium_roots",
            "boss2_organ_toxic_armor"
        ]
    },

    // Boss 3：废铁战甲 — 护甲积累反向定时炸弹
    {
        label: "废铁战甲",
        key: "enemy_iron_war_machine",
        status: {
            "max-health": 180,
            "action-order": 20
        },
        organ: [
            "boss3_organ_armor_core",
            "boss3_organ_overload_engine",
            "boss3_organ_iron_wall_core",
            "boss3_organ_iron_assimilation",
            "boss3_organ_steel_will"
        ]
    },
]

export async function getEnemyByKey(key:string){
    const data = enemyList.find(value=>value.key == key)
    if(!data)throw new Error("没有指定的敌人存在")
    const enemy = await createEnemy(data as any)
    return reactive(enemy) as unknown as Enemy
}

/**
 * 检查敌人是否存在（不创建实例）
 */
export function hasEnemy(key: string): boolean {
    return enemyList.some(value => value.key === key)
}