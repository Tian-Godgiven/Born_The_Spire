/**
 * 战斗房间配置列表
 * 定义所有预设的战斗房间
 */

import type { BattleRoomType } from "@/core/objects/room/Room"
import type { EnemyInstanceConfig } from "@/core/objects/room/BattleRoom"

export interface BattleRoomConfig {
    key: string
    name: string
    description: string
    battleType: BattleRoomType
    enemyConfigs: EnemyInstanceConfig[]
    /** 弱怪池。本层前几场实际进入的普通战斗从这里抽 */
    encounterPool?: "easy" | "normal"
    /** 测试战斗，不进地图自动池 */
    test?: boolean
}

export const battleList: BattleRoomConfig[] = [
    // ========== 测试战斗（保留） ==========
    {
        key: "battle_normal_mouse",
        name: "不屈小鼠",
        description: "越打越硬的小家伙",
        battleType: "normal",
        test: true,
        enemyConfigs: ["test_enemy_mouse"]
    },

    // ========== 第一层普通战斗 ==========

    // 1. 毒液蟾×1 — 中毒+易伤，不进弱池
    {
        key: "battle_f1_poison_toad",
        name: "毒沼",
        description: "一只毒液蟾在此守候",
        battleType: "normal",
        enemyConfigs: [
            {
                key: "enemy_poison_toad",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: { selector: { tags: ["attack"] }, mode: "random" },
                        describe: "易伤打击"
                    }
                }
            }
        ]
    },

    // 1b. 寄血蜱×1 — 飞飘减伤 + 吸血虚弱
    {
        key: "battle_f1_blood_tick",
        name: "血雾",
        description: "一只寄血蜱在血雾中盘旋",
        battleType: "normal",
        encounterPool: "easy",
        enemyConfigs: [
            {
                key: "enemy_blood_tick",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: { selector: { key: "enemy_card_blood_bite" }, mode: "random" },
                        describe: "叮咬"
                    }
                }
            }
        ]
    },

    // 2. 装甲哨卫×1 — 入门：充能节奏
    {
        key: "battle_f1_sentry",
        name: "废弃哨站",
        description: "一台装甲哨卫守在路口",
        battleType: "normal",
        encounterPool: "easy",
        enemyConfigs: [
            {
                key: "enemy_armored_sentry"
            }
        ]
    },

    // 3. 孢子菌×1 — 入门：死亡孢子
    {
        key: "battle_f1_spore_fungus",
        name: "孢子洞",
        description: "一朵孢子菌静静生长",
        battleType: "normal",
        encounterPool: "easy",
        enemyConfigs: [
            {
                key: "enemy_spore_fungus"
            }
        ]
    },

    // 4. 蚁兵×2 — 入门：蚁群 debuff
    {
        key: "battle_f1_two_soldiers",
        name: "蚁群巡逻",
        description: "两只蚁兵正在巡逻",
        battleType: "normal",
        encounterPool: "easy",
        enemyConfigs: [
            {
                key: "enemy_ant_soldier",
                behavior: {
                    patterns: [
                        {
                            priority: 5,
                            intent: "attack",
                            condition: { turn: { equals: 1 } },
                            action: { selector: { key: "enemy_card_acid_bite" }, mode: "random" },
                            describe: "第1回合：蚀咬"
                        }
                    ],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_swarm_bite": 3, "enemy_card_acid_bite": 1 }
                        },
                        describe: "群咬为主，偶尔蚀咬"
                    }
                }
            },
            {
                key: "enemy_ant_soldier",
                behavior: {
                    patterns: [
                        {
                            priority: 5,
                            intent: "attack",
                            condition: { turn: { equals: 1 } },
                            action: { selector: { key: "enemy_card_swarm_bite" }, mode: "random" },
                            describe: "第1回合：群咬"
                        }
                    ],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_acid_bite": 3, "enemy_card_swarm_bite": 1 }
                        },
                        describe: "蚀咬为主，偶尔群咬"
                    }
                }
            }
        ]
    },

    // 5. 蚁卫×1 + 蚁兵×1 — 两种蚂蚁配合
    {
        key: "battle_f1_guard_and_soldier",
        name: "蚁巢前线",
        description: "蚁卫与蚁兵协同防守",
        battleType: "normal",
        enemyConfigs: [
            {
                key: "enemy_ant_guard"
            },
            {
                key: "enemy_ant_soldier",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_swarm_bite": 2, "enemy_card_acid_bite": 1 }
                        },
                        describe: "随机攻击"
                    }
                }
            }
        ]
    },

    // 6. 装甲哨卫×1 + 维修无人机×1 — 先杀谁的抉择
    {
        key: "battle_f1_sentry_and_drone",
        name: "机械巡逻组",
        description: "哨卫与无人机联合巡逻",
        battleType: "normal",
        enemyConfigs: [
            {
                key: "enemy_armored_sentry"
            },
            {
                key: "enemy_repair_drone",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "heal",
                        action: { selector: { tags: ["skill"] }, mode: "random" },
                        describe: "修复"
                    }
                }
            }
        ]
    },

    // 7. 故障机器×1 + 维修无人机×1 — 无人机修故障机器
    {
        key: "battle_f1_broken_and_drone",
        name: "废弃工坊",
        description: "故障机器和维修无人机相互依存",
        battleType: "normal",
        enemyConfigs: [
            {
                key: "enemy_broken_machine",
                behavior: {
                    patterns: [{
                        condition: { hasOrgan: "enemy_organ_unstable_battery" },
                        intent: "attack",
                        action: { selector: { tags: ["attack"] }, mode: "random" },
                        describe: "重击"
                    }],
                    fallback: {
                        intent: "unknown",
                        action: { selector: { key: "fallback_struggle" }, mode: "random" },
                        describe: "无法重击"
                    }
                }
            },
            {
                key: "enemy_repair_drone",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "heal",
                        action: { selector: { tags: ["skill"] }, mode: "random" },
                        describe: "修复"
                    }
                }
            }
        ]
    },

    // 8. 孢子菌×1 + 毒液蟾×1 — 毒+孢子双重威胁
    {
        key: "battle_f1_spore_and_toad",
        name: "毒沼深处",
        description: "孢子与毒素弥漫在空气中",
        battleType: "normal",
        enemyConfigs: [
            {
                key: "enemy_spore_fungus",
                
            },
            {
                key: "enemy_poison_toad",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: { selector: { tags: ["attack"] }, mode: "random" },
                        describe: "易伤打击"
                    }
                }
            }
        ]
    },

    // 9. 蚁兵×2 + 蚁卫×1 — 蚁群+蚁卫协同
    {
        key: "battle_f1_ant_swarm",
        name: "蚁穴",
        description: "两只蚁兵和一只蚁卫守护蚁穴",
        battleType: "normal",
        enemyConfigs: [
            {
                key: "enemy_ant_guard"
            },
            {
                key: "enemy_ant_soldier",
                uiSize: "small",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_swarm_bite": 3, "enemy_card_acid_bite": 1 }
                        },
                        describe: "群咬为主"
                    }
                }
            },
            {
                key: "enemy_ant_soldier",
                uiSize: "small",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_acid_bite": 3, "enemy_card_swarm_bite": 1 }
                        },
                        describe: "蚀咬为主"
                    }
                }
            }
        ]
    },

    // 10. 故障机器×1 + 蚁兵×2 — 炸弹+蚁群双线压力
    {
        key: "battle_f1_machine_and_ants",
        name: "废堆角落",
        description: "故障机器和两只蚁兵占据废堆",
        battleType: "normal",
        enemyConfigs: [
            {
                key: "enemy_broken_machine",
                behavior: {
                    patterns: [{
                        condition: { hasOrgan: "enemy_organ_unstable_battery" },
                        intent: "attack",
                        action: { selector: { tags: ["attack"] }, mode: "random" },
                        describe: "重击"
                    }],
                    fallback: {
                        intent: "unknown",
                        action: { selector: { key: "fallback_struggle" }, mode: "random" },
                        describe: "无法重击"
                    }
                }
            },
            {
                key: "enemy_ant_soldier",
                uiSize: "small",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_swarm_bite": 2, "enemy_card_acid_bite": 1 }
                        },
                        describe: "群咬为主"
                    }
                }
            },
            {
                key: "enemy_ant_soldier",
                uiSize: "small",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_acid_bite": 2, "enemy_card_swarm_bite": 1 }
                        },
                        describe: "蚀咬为主"
                    }
                }
            }
        ]
    },

    // ========== 第一层精英战斗 ==========

    // 精英1：蚁后阵线 — 蚁后+蚁兵×2，指挥层成长
    {
        key: "battle_elite_ant_queen",
        name: "蚁后阵线",
        description: "蚁后的信息素指挥着两只蚁兵",
        battleType: "elite",
        enemyConfigs: [
            {
                key: "enemy_ant_queen",
                behavior: {
                    patterns: [
                        {
                            priority: 10,
                            intent: "unknown",
                            condition: { turn: { mod: [3, 0] } },
                            action: { selector: { key: "enemy_card_command_screech" }, mode: "random" },
                            describe: "每3回合：指挥嘶鸣"
                        }
                    ],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_command_strike": 2, "enemy_card_queen_acid_bite": 1 }
                        },
                        describe: "偏好指挥连击"
                    }
                }
            },
            {
                key: "enemy_ant_soldier",
                uiSize: "small",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_swarm_bite": 3, "enemy_card_acid_bite": 1 }
                        },
                        describe: "群咬为主"
                    }
                }
            },
            {
                key: "enemy_ant_soldier",
                uiSize: "small",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: {
                            selector: { tags: ["attack"] },
                            mode: "weighted",
                            weights: { "enemy_card_acid_bite": 3, "enemy_card_swarm_bite": 1 }
                        },
                        describe: "蚀咬为主"
                    }
                }
            }
        ]
    },

    // 精英2：铁壁要塞 — 叠甲+护甲冲撞
    {
        key: "battle_elite_iron_fortress",
        name: "铁壁要塞",
        description: "坚不可摧的机械要塞正在积蓄护甲",
        battleType: "elite",
        enemyConfigs: [
            {
                key: "enemy_iron_fortress",
                behavior: {
                    patterns: [
                        {
                            // 每3回合护甲冲撞
                            priority: 10,
                            intent: "attack",
                            condition: {
                                turn: { mod: [3, 0] }
                            },
                            action: {
                                selector: { key: "enemy_card_armor_bash" },
                                mode: "random"
                            },
                            describe: "每3回合：护甲冲撞"
                        }
                    ],
                    fallback: {
                        intent: "defend",
                        action: { selector: { key: "enemy_card_steel_wall" }, mode: "random" },
                        describe: "铁壁积甲"
                    }
                }
            }
        ]
    },

    // 精英3：腐化猎场 — 废堆猎手，力量递增+腐食回血
    {
        key: "battle_elite_heap_hunter",
        name: "腐化猎场",
        description: "废堆中进化出的掠食者正在积蓄力量",
        battleType: "elite",
        enemyConfigs: [
            {
                key: "enemy_heap_hunter",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: { selector: { key: "enemy_card_strength_bite" }, mode: "random" },
                        describe: "撕咬"
                    }
                }
            }
        ]
    },

    // ========== 第一层Boss战斗 ==========

    // Boss 1：自走焚烧炉 — 点火自锻+力量爆发
    {
        key: "battle_f1_boss_slag_king",
        name: "自走焚烧炉",
        description: "荒废垃圾场里仍在自动运转的焚烧炉",
        battleType: "boss",
        enemyConfigs: [
            {
                key: "enemy_slag_king",
                uiSize: "big",
                behavior: {
                    patterns: [
                        {
                            priority: 100,
                            intent: "buff",
                            condition: { turn: { equals: 1 } },
                            action: { selector: { key: "boss1_card_iron_might" }, mode: "random" },
                            describe: "第1回合固定：铸铁力"
                        },
                        {
                            priority: 50,
                            intent: "buff",
                            condition: { hasState: { target: "self", stateKey: "ignition", stacks: 4 } },
                            action: { selector: { key: "boss1_card_recasting" }, mode: "random" },
                            describe: "点火≥4：重铸"
                        }
                    ],
                    moves: {
                        mode: "loop",
                        list: [
                            {
                                cards: ["boss1_card_iron_spike"],
                                intent: "attack",
                                describe: "铁刺"
                            },
                            {
                                cards: ["boss1_card_cast_strike"],
                                intent: "attack",
                                describe: "熔铸打击"
                            },
                            {
                                cards: ["boss1_card_furnace_wall"],
                                intent: "defend",
                                describe: "高炉护壁"
                            }
                        ]
                    },
                    fallback: {
                        intent: "attack",
                        action: { selector: { key: "boss1_card_cast_strike" }, mode: "random" },
                        describe: "剧本筛空时：熔铸打击"
                    }
                }
            }
        ]
    },

    // Boss 2：疫孢菌母 — 孢子蔓延+中毒DoT
    {
        key: "battle_f1_boss_plague_mother",
        name: "疫孢菌母",
        description: "腐败的源点正在散播孢子",
        battleType: "boss",
        enemyConfigs: [
            {
                key: "enemy_plague_mother",
                uiSize: "big",
                behavior: {
                    moves: {
                        mode: "loop",
                        list: [
                            {
                                condition: { selfHealth: { above: 30 } },
                                cards: ["boss2_card_spore_burst"],
                                describe: "常规1：孢子爆发"
                            },
                            {
                                condition: { selfHealth: { above: 30 } },
                                cards: ["boss2_card_mycelium_spread"],
                                describe: "常规2：菌丝蔓延"
                            },
                            {
                                condition: { selfHealth: { above: 30 } },
                                cards: [["boss2_card_infection_strike", "enemy_card_harden"]],
                                describe: "常规3：感染或硬化"
                            },
                            {
                                condition: { selfHealth: { above: 30 } },
                                cards: [["boss2_card_infection_strike", "enemy_card_harden"]],
                                describe: "常规4：感染或硬化"
                            },
                            {
                                condition: { selfHealth: { below: 31 } },
                                cards: ["boss2_card_spore_burst", "boss2_card_mycelium_spread"],
                                describe: "狂暴1：爆发+蔓延"
                            },
                            {
                                condition: { selfHealth: { below: 31 } },
                                cards: ["boss2_card_mycelium_spread", "enemy_card_harden"],
                                describe: "狂暴2：蔓延+硬化"
                            },
                            {
                                condition: { selfHealth: { below: 31 } },
                                cards: ["boss2_card_mycelium_spread", "enemy_card_harden"],
                                describe: "狂暴3：蔓延+硬化"
                            },
                            {
                                condition: { selfHealth: { below: 31 } },
                                cards: ["boss2_card_mycelium_spread", "enemy_card_harden"],
                                describe: "狂暴4：蔓延+硬化"
                            }
                        ]
                    },
                    fallback: {
                        action: { selector: { key: "boss2_card_infection_strike" }, mode: "random" },
                        describe: "剧本筛空时：感染打击"
                    }
                }
            }
        ]
    },

    // Boss 3：废铁战甲 — 护甲堆叠 → 钢铁压碾爆发
    {
        key: "battle_f1_boss_iron_war_machine",
        name: "废铁战甲",
        description: "废料拼凑的巨型机甲，第一层机械种族的顶点",
        battleType: "boss",
        enemyConfigs: [
            {
                key: "enemy_iron_war_machine",
                uiSize: "big",
                behavior: {
                    patterns: [
                        {
                            priority: 50,
                            intent: "attack",
                            condition: {
                                custom: (enemy) => Number((enemy as any).current?.armor?.value ?? 0) >= 40
                            },
                            action: { selector: { key: "boss3_card_steel_roll" }, mode: "random" },
                            describe: "护甲≥40：钢铁压碾"
                        }
                    ],
                    fallback: {
                        action: {
                            selector: {},
                            mode: "loop",
                            sequence: [
                                "boss3_card_armor_assembly",
                                "boss3_card_firepower_suppression",
                                "boss3_card_armor_assembly",
                                "boss3_card_firepower_suppression",
                                "boss3_card_overload_barrier"
                            ]
                        },
                        describe: "循环：装甲组装/火力压制/过载屏障"
                    }
                }
            }
        ]
    },

]
