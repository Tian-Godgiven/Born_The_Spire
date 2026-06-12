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
}

export const battleList: BattleRoomConfig[] = [
    // ========== 测试战斗（保留） ==========
    {
        key: "battle_normal_mouse",
        name: "不屈小鼠",
        description: "越打越硬的小家伙",
        battleType: "normal",
        enemyConfigs: ["test_enemy_mouse"]
    },
    {
        key: "battle_elite_berserker",
        name: "狂战士领地",
        description: "强大的狂战士守护着这里",
        battleType: "elite",
        enemyConfigs: ["test_enemy_berserker"]
    },
    {
        key: "battle_elite_hydra",
        name: "双头蛇巢穴",
        description: "危险的双头蛇盘踞在此",
        battleType: "elite",
        enemyConfigs: ["test_enemy_elite"]
    },
    {
        key: "battle_elite_plus_berserker",
        name: "染印狂战士领地",
        description: "更危险的狂战士守护着印记试炼",
        battleType: "elitePlus",
        enemyConfigs: ["test_enemy_berserker"]
    },

    // ========== 第一层普通战斗 ==========

    // 1. 毒液蟾×1 — 入门：中毒+易伤
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

    // 2. 装甲哨卫×1 — 入门：充能节奏
    {
        key: "battle_f1_sentry",
        name: "废弃哨站",
        description: "一台装甲哨卫守在路口",
        battleType: "normal",
        enemyConfigs: [
            {
                key: "enemy_armored_sentry",
                behavior: {
                    patterns: [
                        {
                            priority: 10,
                            intent: "attack",
                            condition: {
                                hasState: { target: "self", stateKey: "charge", stacks: 2 }
                            },
                            action: {
                                selector: { key: "enemy_card_discharge" },
                                mode: "random"
                            },
                            describe: "充能≥2：放电"
                        }
                    ],
                    fallback: {
                        intent: "unknown",
                        action: {
                            selector: { key: "enemy_card_unstable_charge" },
                            mode: "random"
                        },
                        describe: "不稳定充能"
                    }
                }
            }
        ]
    },

    // 3. 孢子菌×1 — 入门：死亡孢子
    {
        key: "battle_f1_spore_fungus",
        name: "孢子洞",
        description: "一朵孢子菌静静生长",
        battleType: "normal",
        enemyConfigs: [
            {
                key: "enemy_spore_fungus",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "unknown",
                        action: { selector: { tags: ["skill"] }, mode: "random" },
                        describe: "毒孢"
                    }
                }
            }
        ]
    },

    // 4. 蚁兵×2 — 入门：蚁群 debuff
    {
        key: "battle_f1_two_soldiers",
        name: "蚁群巡逻",
        description: "两只蚁兵正在巡逻",
        battleType: "normal",
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
                key: "enemy_ant_guard",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: { selector: { tags: ["attack"] }, mode: "random" },
                        describe: "群咬"
                    }
                }
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
                key: "enemy_armored_sentry",
                behavior: {
                    patterns: [
                        {
                            priority: 10,
                            intent: "attack",
                            condition: {
                                hasState: { target: "self", stateKey: "charge", stacks: 2 }
                            },
                            action: { selector: { key: "enemy_card_discharge" }, mode: "random" },
                            describe: "充能≥2：放电"
                        }
                    ],
                    fallback: {
                        intent: "unknown",
                        action: { selector: { key: "enemy_card_unstable_charge" }, mode: "random" },
                        describe: "不稳定充能"
                    }
                }
            },
            {
                key: "enemy_repair_drone",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "unknown",
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
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: { selector: { tags: ["attack"] }, mode: "random" },
                        describe: "重击"
                    }
                }
            },
            {
                key: "enemy_repair_drone",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "unknown",
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
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "unknown",
                        action: { selector: { tags: ["skill"] }, mode: "random" },
                        describe: "毒孢"
                    }
                }
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
                key: "enemy_ant_guard",
                behavior: {
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: { selector: { tags: ["attack"] }, mode: "random" },
                        describe: "群咬"
                    }
                }
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
                            weights: { "enemy_card_swarm_bite": 3, "enemy_card_acid_bite": 1 }
                        },
                        describe: "群咬为主"
                    }
                }
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
                    patterns: [],
                    fallback: {
                        intent: "attack",
                        action: { selector: { tags: ["attack"] }, mode: "random" },
                        describe: "重击"
                    }
                }
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
                        describe: "群咬为主"
                    }
                }
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

    // Boss 2：疫孢菌母 — 孢子蔓延+中毒DoT
    {
        key: "battle_f1_boss_plague_mother",
        name: "疫孢菌母",
        description: "腐败的源点正在散播孢子",
        battleType: "boss",
        enemyConfigs: [
            {
                key: "enemy_plague_mother",
                behavior: {
                    patterns: [
                        {
                            priority: 10,
                            intent: "unknown",
                            condition: { turn: { mod: [3, 1] } },
                            action: { selector: { key: "boss2_card_spore_burst" }, mode: "random" },
                            describe: "每3回合（第1、4、7...）：孢子爆发"
                        }
                    ],
                    fallback: {
                        intent: "attack",
                        action: { selector: { key: "boss2_card_infection_strike" }, mode: "random" },
                        describe: "感染打击"
                    }
                }
            }
        ]
    },

]
