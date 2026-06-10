
import type { CardMap } from "@/core/objects/item/Subclass/Card"
import { createCard } from "@/core/factories"

export const cardList:CardMap[] = [{
    label:"打击",
    tags:["attack", "basic"],
    status:{
        damage:5,
        cost:1,
    },
    describe:[
        "造成",{key:["status","damage","value"]},"点伤害"
    ],
    key:"original_card_00001",
    interaction:{
        use:{
            target:{faction:"opponent"},  // 攻击敌对阵营
            effects:[{
                key:"damage",
                params:{value:5},
            }]
        }
    }
},{
    label:"消耗打击",
    tags:["attack"],
    status:{
        damage:15,
        cost:1,
    },
    entry:["card_exhaust"],
    describe:[
        "造成",{key:["status","damage"]},"点伤害"
    ],
    key:"original_card_00002",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"damage",
                params:{value:15},
            }]
        }
    }
},{
    label:"虚无打击",
    tags:["attack"],
    status:{
        damage:15,
        cost:1,
    },
    entry:["card_void"],
    describe:[
        "造成",{key:["status","damage"]},"点伤害"
    ],
    key:"original_card_00003",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"damage",
                params:{value:15},
            }]
        }
    }
},{
    label:"固有打击",
    tags:["attack"],
    status:{
        damage:8,
        cost:1,
    },
    entry:["card_inherent"],
    describe:[
        "造成",{key:["status","damage"]},"点伤害"
    ],
    key:"original_card_00012",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"damage",
                params:{value:8},
            }]
        }
    }
},{
    label:"肌肉强化",
    tags:["power"],
    status:{
        power:1,
        cost:0
    },
    entry:["exhaust"],
    describe:["获得",{key:["status","power"]},"层",{$:"力量"}],
    key:"original_card_00004",
    interaction:{
        use:{
            target:{faction:"player",key:"self"},
            effects:[{
                key:"applyState",
                params:{stateKey:"power",stacks:1},
            }]
        }
    }
},{
    label:"淬毒",
    tags:["skill"],
    status:{
        poison:3,
        cost:1
    },
    describe:["使目标获得",{key:["status","poison"]},"层中毒"],
    key:"original_card_00008",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"applyState",
                params:{stateKey:"poison",stacks:3},
            }]
        }
    }
},{
    label:"随机打击",
    tags:["attack"],
    status:{
        cost:1,
        minDamage:5,
        maxDamage:10
    },
    describe:["造成",{key:["status","minDamage"]},"到",{key:["status","maxDamage"]},"点随机伤害"],
    key:"original_card_00009",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"damage",
                params:{value:"random(5,10)"},
            }]
        }
    }
},{
    label:"虚弱诅咒",
    tags:["curse"],
    status:{
        weak:2,
        cost:0
    },
    describe:["使自己获得",{key:["status","weak"]},"层",{$:"虚弱"}],
    key:"original_card_00010",
    interaction:{
        use:{
            target:{faction:"player",key:"self"},
            effects:[{
                key:"applyState",
                params:{stateKey:"weak",stacks:2},
            }]
        }
    }
},{
    label:"易伤打击",
    tags:["attack"],
    status:{
        vulnerable:2,
        damage:8,
        cost:1
    },
    describe:["造成",{key:["status","damage"]},"点伤害，使目标获得",{key:["status","vulnerable"]},"层",{$:"易伤"}],
    key:"original_card_00011",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"damage",
                params:{value:8},
            },{
                key:"applyState",
                params:{stateKey:"vulnerable",stacks:2},
            }]
        }
    }
},{
    label:"旋风斩",
    tags:["attack"],
    status:{
        cost:1,
        damage:3
    },
    describe:["对敌方全体造成",{key:["status","damage"]},"点伤害"],
    key:"original_card_00005",
    interaction:{
        use:{
            target:{number:"all"},//阵营默认为敌人
            effects:[{
                key:"damage",
                params:{value:3},
            }]
        }
    }
},{
    label:"末日",
    tags:["attack"],
    status:{
        cost:3,
        damage:999,
    },
    describe:["对所有人造成",{key:["status","damage"]},"点伤害"],
    key:"original_card_00006",
    interaction:{
        use:{
            target:{faction:"all",number:"all"},
            effects:[{
                key:"damage",
                params:{value:999},
            }]
        }
    }
},{
    label:"接二连三",
    tags:["attack"],
    status:{
        cost:1,
        damage:2,
    },
    describe:["对至多3个敌人造成",{key:["status","damage"]},"点伤害"],
    key:"original_card_00007",
    interaction:{
        use:{
            target:{faction:"enemy",number:3},
            effects:[{
                key:"damage",
                params:{value:2},
            }]
        }
    }
},{
    label:"发现",
    tags:["skill"],
    status:{
        cost:0,
    },
    describe:["发现一张攻击牌加入手牌"],
    key:"original_card_00013",
    interaction:{
        use:{
            target:{key:"self"},
            effects:[{
                key:"discoverCard",
                params:{
                    count:3,
                    selectCount:1,
                    tags:["attack"],
                    allowDuplicate:false,
                    addToHand:true
                },
            }]
        }
    }
},{
    label:"大发现",
    tags:["skill"],
    status:{
        cost:1,
    },
    describe:["从30张随机卡牌中选择一张加入手牌"],
    key:"original_card_00016",
    interaction:{
        use:{
            target:{key:"self"},
            effects:[{
                key:"discoverCard",
                params:{
                    count:30,           // 随机抽取30张
                    selectCount:1,      // 选择1张
                    allowDuplicate:false,  // 不允许重复
                    addToHand:true      // 加入手牌
                },
            }]
        }
    }
},{
    label:"防御",
    tags:["skill", "basic", "defence"],
    status:{
        armor:5,
        cost:1
    },
    describe:["获得",{key:["status","armor"]},"点护甲"],
    key:"original_card_00014",
    interaction:{
        use:{
            target:{key:"self"},
            effects:[{
                key:"gainArmor",
                params:{value:5},
            }]
        }
    }
},{
    label:"铁壁",
    tags:["skill", "defence"],
    status:{
        armor:12,
        cost:1
    },
    describe:["获得",{key:["status","armor"]},"点护甲"],
    key:"original_card_00015",
    interaction:{
        use:{
            target:{key:"self"},
            effects:[{
                key:"gainArmor",
                params:{value:12},
            }]
        }
    }
},{
    label:"终结一击",
    tags:["attack", "test"],
    status:{
        damage:999,
        cost:0
    },
    describe:["造成",{key:["status","damage"]},"点伤害","（测试用）"],
    key:"test_card_kill",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"damage",
                params:{value:999},
            }]
        }
    }
},{
    label:"挣扎",
    tags:["attack", "fallback"],
    status:{
        damage:5,
        cost:0
    },
    describe:["造成",{key:["status","damage"]},"点伤害","（兜底攻击）"],
    key:"fallback_struggle",
    interaction:{
        use:{
            target:{faction:"opponent"},  // 攻击敌对阵营
            effects:[{
                key:"damage",
                params:{value:5},
            }]
        }
    }
},{
    label:"石击",
    tags:["attack", "enemy"],
    status:{
        damage:6,
        cost:0
    },
    describe:["造成",{key:["status","damage"]},"点伤害"],
    key:"enemy_stone_strike",
    interaction:{
        use:{
            target:{faction:"opponent"},
            effects:[{
                key:"damage",
                params:{value:6},
            }]
        }
    }
},{
    label:"伤口",
    tags:["status"],
    status:{
        cost:0
    },
    entry:["card_cannot_play"],
    describe:["状态牌","无法被打出"],
    key:"original_card_00100",
    interaction:{}
},{
    label:"余热回收",
    tags:["skill", "enemy", "defence"],
    status:{
        armor:5,
        bonusArmor:5,
        cost:1
    },
    describe:[
        "获得",{key:["status","armor"]},"点护甲",
        "若玩家的弃牌堆中有状态牌，消耗一张并额外获得",{key:["status","bonusArmor"]},"点护甲"
    ],
    key:"enemy_waste_heat_recovery",
    interaction:{
        use:{
            target:{key:"self"},
            effects:[{
                key:"gainArmor",
                params:{value:5},
            },{
                key:"card_wasteHeatRecovery",
                params:{pile:"discardPile", hasTag:"status", targetType:"player", bonusArmor:5},
            }]
        }
    }
},{
    label:"余热回收",
    tags:["skill", "defence"],
    status:{
        armor:5,
        bonusArmor:5,
        cost:1
    },
    describe:[
        "获得",{key:["status","armor"]},"点护甲",
        "若手牌中有状态牌，消耗一张并额外获得",{key:["status","bonusArmor"]},"点护甲"
    ],
    key:"player_waste_heat_recovery",
    interaction:{
        use:{
            target:{key:"self"},
            effects:[{
                key:"gainArmor",
                params:{value:5},
            },{
                key:"card_wasteHeatRecovery",
                params:{pile:"handPile", hasTag:"status", targetType:"self", bonusArmor:5},
            }]
        }
    }
},
// ========== 器官系列：弱化之刃 ==========
{
    label:"侵蚀",
    tags:["skill"],
    status:{
        stacks:2,
        cost:1
    },
    describe:[
        "对目标施加",{key:["status","stacks"]},"层虚弱"
    ],
    key:"organ_card_erode",
    interaction:{
        use:{
            target:{faction:"enemy"},
            effects:[{
                key:"applyState",
                params:{stateKey:"weak", stacks:2}
            }]
        }
    }
},

// ========== 第一层：垃圾堆有机体 + 废弃机械 ==========

// 群咬：蚁兵的蚁颚，多段攻击，每段独立触发蚀伤；hits status 决定攻击次数
{
    label: "群咬",
    tags: ["attack", "enemy"],
    status: {
        damage: 3,
        hits: 2,
        cost: 1
    },
    describe: ["攻击", {key: ["status", "hits"]}, "次，每次造成", {key: ["status", "damage"]}, "点伤害"],
    key: "enemy_card_swarm_bite",
    interaction: {
        use: {
            target: {faction: "opponent"},
            effects: [
                { key: "repeatEffects", params: { times: "$owner.status(hits)", effects: [{ key: "damage", params: { value: 3 } }] } }
            ]
        }
    }
},

// 蚀咬：蚁兵的蚁酸腺，对目标施加蚀伤
{
    label: "蚀咬",
    tags: ["skill", "enemy"],
    status: {
        stacks: 3,
        cost: 1
    },
    describe: ["对目标施加", {key: ["status", "stacks"]}, "层蚀伤"],
    key: "enemy_card_acid_bite",
    interaction: {
        use: {
            target: {faction: "opponent"},
            effects: [
                { key: "applyState", params: { stateKey: "acidWound", stacks: 3 } }
            ]
        }
    }
},

// 猛扑：蚁卫的蚁颚高等级，3段攻击
{
    label: "猛扑",
    tags: ["attack", "enemy"],
    status: {
        damage: 4,
        cost: 1
    },
    describe: ["攻击3次，每次造成", {key: ["status", "damage"]}, "点伤害"],
    key: "enemy_card_fierce_pounce",
    interaction: {
        use: {
            target: {faction: "opponent"},
            effects: [
                { key: "damage", params: { value: 4 } },
                { key: "damage", params: { value: 4 } },
                { key: "damage", params: { value: 4 } }
            ]
        }
    }
},

// 毒孢：孢子菌的孢子囊，对所有角色施加1层中毒（包括自身）
{
    label: "毒孢",
    tags: ["skill", "enemy"],
    status: {
        cost: 1
    },
    describe: ["对所有角色施加1层中毒"],
    key: "enemy_card_toxic_spore",
    interaction: {
        use: {
            target: {faction: "all"},
            effects: [
                { key: "applyState", params: { stateKey: "poison", stacks: 1 } }
            ]
        }
    }
},

// 硬化：孢子菌的菌盖，获得护甲
{
    label: "硬化",
    tags: ["skill", "enemy"],
    status: {
        armor: 6,
        cost: 1
    },
    describe: ["获得", {key: ["status", "armor"]}, "点护甲"],
    key: "enemy_card_harden",
    interaction: {
        use: {
            target: {key: "self"},
            effects: [
                { key: "gainArmor", params: { value: 6 } }
            ]
        }
    }
},

// 修复：维修无人机的维修模块，恢复目标器官质量
{
    label: "修复",
    tags: ["skill", "enemy"],
    status: {
        cost: 1,
        heal: 8
    },
    describe: ["恢复最受损器官", {key: ["status", "heal"]}, "点质量"],
    key: "enemy_card_repair",
    interaction: {
        use: {
            target: {key: "self"},
            effects: [
                { key: "repairOrgan", params: { value: 8 } }
            ]
        }
    }
},

// 重击：故障机器的重锤，消耗2费造成大量伤害
{
    label: "重击",
    tags: ["attack", "enemy"],
    status: {
        damage: 14,
        cost: 2
    },
    describe: ["造成", {key: ["status", "damage"]}, "点伤害"],
    key: "enemy_card_heavy_strike",
    interaction: {
        use: {
            target: {faction: "opponent"},
            effects: [
                { key: "damage", params: { value: 14 } }
            ]
        }
    }
},

// 不稳定充能：装甲哨卫的充能炮，随机积累充能层数
{
    label: "不稳定充能",
    tags: ["skill", "enemy"],
    status: {
        cost: 0
    },
    describe: ["随机获得充能（1%归零/9%空/60%+1/20%+2/10%+3）"],
    key: "enemy_card_unstable_charge",
    interaction: {
        use: {
            target: { key: "self" },
            effects: [
                { key: "card_unstableCharge", params: {} }
            ]
        }
    }
},

// 放电：装甲哨卫的充能炮，消耗充能造成伤害
{
    label: "放电",
    tags: ["attack", "enemy"],
    status: {
        cost: 0,
        damage: 3
    },
    describe: ["造成", {key: ["status", "damage"]}, "×充能层数点伤害，充能归零"],
    key: "enemy_card_discharge",
    interaction: {
        use: {
            target: { faction: "opponent" },
            effects: [
                { key: "damage", params: { value: 3, multiplier: "$source.stateStack(charge)" } },
                { key: "removeState", params: { stateKey: "charge" } }
            ]
        }
    }
},

// ========== 蚁后卡牌 ==========

// 指挥连击：信息素腺体提供，所有友军每2层指挥造成1次3点伤害
{
    label: "指挥连击",
    tags: ["attack", "enemy"],
    status: { cost: 1 },
    describe: ["所有友军每2层指挥对目标造成1次3点伤害"],
    key: "enemy_card_command_strike",
    interaction: {
        use: {
            target: { faction: "opponent" },
            effects: [{ key: "card_commandStrike", params: { n: 2, damage: 3 } }]
        }
    }
},

// 女王蚀咬：女王大颚提供，攻击+易伤
{
    label: "女王蚀咬",
    tags: ["attack", "enemy"],
    status: { cost: 1, damage: 10 },
    describe: ["造成", {key: ["status", "damage"]}, "点伤害，施加2层易伤"],
    key: "enemy_card_queen_acid_bite",
    interaction: {
        use: {
            target: { faction: "opponent" },
            effects: [
                { key: "damage", params: { value: 10 } },
                { key: "applyState", params: { stateKey: "vulnerable", stacks: 2 } }
            ]
        }
    }
},

// 指挥嘶鸣：女王大颚提供，给所有友军+3指挥层
{
    label: "指挥嘶鸣",
    tags: ["skill", "enemy"],
    status: { cost: 1 },
    describe: ["给所有友军施加3层指挥"],
    key: "enemy_card_command_screech",
    interaction: {
        use: {
            target: { key: "self" },
            effects: [{ key: "card_commandScreech", params: { stacks: 3 } }]
        }
    }
},

// ========== 过载核心卡牌 ==========

// 热能冲击：过载炮提供，基础伤害+热量层/2
{
    label: "热能冲击",
    tags: ["attack", "enemy"],
    status: { cost: 1, damage: 6 },
    describe: ["造成", {key: ["status", "damage"]}, "+热量层/2点伤害"],
    key: "enemy_card_heat_blast",
    interaction: {
        use: {
            target: { faction: "opponent" },
            effects: [{ key: "card_heatBlast", params: { base: 6 } }]
        }
    }
},

// ========== 铁壁要塞卡牌 ==========

// 护甲冲撞：金属化核心提供，消耗所有护甲造成等量伤害
{
    label: "护甲冲撞",
    tags: ["attack", "enemy"],
    status: { cost: 1 },
    describe: ["消耗所有护甲，对目标造成等量伤害"],
    key: "enemy_card_armor_bash",
    interaction: {
        use: {
            target: { faction: "opponent" },
            effects: [{ key: "organ_armorBash", params: {} }]
        }
    }
},

// 铁壁：防御模块提供，单次大量补甲
{
    label: "铁壁",
    tags: ["skill", "enemy"],
    status: { cost: 1 },
    describe: ["获得8点护甲"],
    key: "enemy_card_steel_wall",
    interaction: {
        use: {
            target: { key: "self" },
            effects: [{ key: "gainArmor", params: { value: 8 } }]
        }
    }
},

// ========== 有毒混合物卡牌 ==========

// 腐蚀爆发：毒素核心提供，双面伤害+成长
{
    label: "腐蚀爆发",
    tags: ["attack", "enemy"],
    status: { cost: 1, damage: 6 },
    describe: ["对目标造成", {key: ["status", "damage"]}, "+腐蚀×2伤害，对自身造成2+腐蚀×1伤害；腐蚀+1"],
    key: "enemy_card_corrosive_burst",
    interaction: {
        use: {
            target: { faction: "opponent" },
            effects: [{ key: "card_corrosiveBurst", params: { damage: 6, selfDamage: 2 } }]
        }
    }
},

// ========== 废堆猎手卡牌 ==========
{
    label: "撕咬",
    key: "enemy_card_strength_bite",
    tags: ["attack"],
    status: { cost: 1 },
    describe: ["造成", { key: ["effect", "base"] }, "+力量×2点伤害"],
    interaction: {
        use: {
            target: { key: "singleEnemy" },
            effects: [{ key: "card_strengthBite", params: { base: 6, strengthMult: 2 } }]
        }
    }
}]

export async function getCardByKey(key:string){
    const data = cardList.find(value=>value.key == key)
    if(!data)throw new Error("不存在的卡牌")
    const card = await createCard(data)
    return card
}

export function getAllCards(){
    return cardList
}