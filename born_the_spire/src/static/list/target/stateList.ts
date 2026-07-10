import type { StateData } from "@/core/objects/system/State"

export const stateList: StateData[] = [
    // 力量：造成伤害时，伤害增加（允许负数，负数时减少伤害）
    {
        label: "力量",
        key: "power",
        category: "buff",
        describe: ["造成的伤害增加"],
        showType: "number",
        repeate: "stack",
        allowNegative: true,
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "make",
                    key: "damage",
                    action: "powerBoost"
                }],
                reaction: {
                    powerBoost: [{
                        key: "powerBoost",
                        label: "力量增伤",
                        targetType: "triggerEffect",
                        effect: [{
                            key: "modifyDamageValue",
                            params: { delta: "$source.stateStack()" }
                        }]
                    }]
                }
            }
        }
    },
    // 中毒：回合结束时受到伤害，然后层数-1
    {
        label: "中毒",
        key: "poison",
        category: "debuff",
        describe: ["回合结束时受到伤害"],
        showType: "number",
        repeate: "stack",
        stackChange: [
            { timing: "turnEnd", delta: -1 }
        ],
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "take",
                    key: "turnEnd",
                    action: "poisonDamage"
                }],
                reaction: {
                    poisonDamage: [{
                        key: "poisonDamage",
                        label: "中毒伤害",
                        targetType: "triggerOwner",
                        effect: [{
                            key: "damage",
                            params: { value: "$source.stateStack()" }
                        }]
                    }]
                }
            }
        }
    },
    // 虚弱：造成伤害时，伤害减少25%
    {
        label: "虚弱",
        key: "weak",
        category: "debuff",
        describe: ["造成的伤害减少25%"],
        showType: "number",
        repeate: "stack",
        stackChange: [
            { timing: "turnEnd", delta: -1 }
        ],
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "make",
                    key: "damage",
                    action: "weakDebuff"
                }],
                reaction: {
                    weakDebuff: [{
                        key: "weakDebuff",
                        label: "虚弱减伤",
                        targetType: "triggerEffect",
                        effect: [{
                            key: "modifyDamageByPercent",
                            params: { percent: -0.25 }
                        }]
                    }]
                }
            }
        }
    },
    // 易伤：承受攻击牌伤害时，伤害增加50%
    {
        label: "易伤",
        key: "vulnerable",
        category: "debuff",
        describe: ["承受攻击的伤害增加50%"],
        showType: "number",
        repeate: "stack",
        stackChange: [
            { timing: "turnEnd", delta: -1 }
        ],
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "take",
                    key: "damage",
                    action: "vulnerableDebuff",
                    condition: "$triggerCard.hasTag(attack)"
                }],
                reaction: {
                    vulnerableDebuff: [{
                        key: "vulnerableDebuff",
                        label: "易伤增伤",
                        targetType: "triggerEffect",
                        effect: [{
                            key: "modifyDamageByPercent",
                            params: { percent: 0.5 }
                        }]
                    }]
                }
            }
        }
    },
    // 蚀伤：承受伤害时固定+1，层数为持续时间，回合结束-1层
    {
        label: "蚀伤",
        key: "acidWound",
        category: "debuff",
        describe: ["承受的伤害+1"],
        showType: "number",
        repeate: "stack",
        stackChange: [
            { timing: "turnEnd", delta: -1 }
        ],
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "take",
                    key: "damage",
                    action: "acidWoundDebuff"
                }],
                reaction: {
                    acidWoundDebuff: [{
                        key: "acidWoundDebuff",
                        label: "蚀伤增伤",
                        targetType: "triggerEffect",
                        effect: [{
                            key: "modifyDamageValue",
                            params: { delta: 1 }
                        }]
                    }]
                }
            }
        }
    },
    // 蓄势：攻击时消耗全部层数，每层+1伤害，然后归零；层数由蓄力腺器官在回合结束时增加
    {
        label: "蓄势",
        key: "momentum",
        category: "buff",
        describe: ["攻击时消耗全部层数，每层+1伤害"],
        showType: "number",
        repeate: "stack",
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "make",
                    key: "damage",
                    action: "momentumBoost"
                }],
                reaction: {
                    momentumBoost: [
                        {
                            key: "momentumDamage",
                            label: "蓄势增伤",
                            targetType: "triggerEffect",
                            effect: [{
                                key: "modifyDamageValue",
                                params: { delta: "$source.stateStack()" }
                            }]
                        },
                        {
                            key: "momentumReset",
                            label: "蓄势清零",
                            targetType: "triggerOwner",
                            effect: [{
                                key: "removeState",
                                params: { stateKey: "momentum" }
                            }]
                        }
                    ]
                }
            }
        }
    },
    // 指挥：由蚁后信息素腺体每回合分发，指挥连击效果消耗层数
    {
        label: "指挥",
        key: "command",
        category: "buff",
        describe: ["每2层使友军造成1次3点伤害"],
        showType: "number",
        repeate: "stack",
    },
    // 腐蚀：由有毒混合物每次使用腐蚀爆发时+1，增加后续腐蚀爆发的伤害
    {
        label: "腐蚀",
        key: "corrosion",
        category: "buff",
        describe: ["增加腐蚀爆发的伤害"],
        showType: "number",
        repeate: "stack",
    },
    // 充能：由不稳定充能卡随机积累，放电卡消耗全部层数并按倍数造成伤害
    {
        label: "充能",
        key: "charge",
        category: "buff",
        describe: ["放电时消耗全部层数，伤害×层数"],
        showType: "number",
        repeate: "stack",
    },
    // 热量：由不稳定电池器官每回合50%概率+1，超过3层时爆炸逻辑由器官的heatTick效果函数处理
    {
        label: "热量",
        key: "heat",
        category: "debuff",
        describe: ["热量超过3时引发爆炸"],
        showType: "number",
        repeate: "stack",
    },
    // 敏捷：获得护甲时，护甲值增加（允许负数）
    {
        label: "敏捷",
        key: "dexterity",
        category: "buff",
        describe: ["获得的护甲增加"],
        showType: "number",
        repeate: "stack",
        allowNegative: true,
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "make",
                    key: "gainArmor",
                    action: "dexterityBoost"
                }],
                reaction: {
                    dexterityBoost: [{
                        key: "dexterityBoost",
                        label: "敏捷增甲",
                        targetType: "triggerEffect",
                        effect: [{
                            key: "modifyArmorValue",
                            params: { delta: "$source.stateStack()" }
                        }]
                    }]
                }
            }
        }
    },
    // 临时敏捷标记：回合结束时失去等量敏捷层数
    {
        label: "临时敏捷",
        key: "tempDex",
        describe: ["回合结束时失去等量敏捷"],
        showType: "number",
        repeate: "stack",
        allowNegative: true,
        interaction: {
            possess: {
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "turnEnd",
                    action: "removeTempDex"
                }],
                reaction: {
                    removeTempDex: [{
                        key: "removeTempDex",
                        label: "移除临时敏捷",
                        targetType: "triggerOwner",
                        effect: [{
                            key: "changeStateStack",
                            params: {
                                stateKey: "dexterity",
                                delta: "$source.stateStack()",
                                negate: true
                            }
                        }, {
                            key: "removeState",
                            params: { stateKey: "tempDex" }
                        }]
                    }]
                }
            }
        }
    },
    // 临时力量标记：回合结束时失去等量力量层数
    {
        label: "临时力量",
        key: "tempPower",
        describe: ["回合结束时失去等量力量"],
        showType: "number",
        repeate: "stack",
        allowNegative: true,
        interaction: {
            possess: {
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "turnEnd",
                    action: "removeTempPower"
                }],
                reaction: {
                    removeTempPower: [{
                        key: "removeTempPower",
                        label: "移除临时力量",
                        targetType: "triggerOwner",
                        effect: [{
                            key: "changeStateStack",
                            params: {
                                stateKey: "power",
                                delta: "$source.stateStack()",
                                negate: true
                            }
                        }, {
                            key: "removeState",
                            params: { stateKey: "tempPower" }
                        }]
                    }]
                }
            }
        }
    },
    // 人工制品：抵消下一个负面效果
    {
        label: "人工制品",
        key: "artifact",
        category: "buff",
        describe: ["抵消下一个负面效果"],
        showType: "number",
        repeate: "stack",
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "take",
                    key: "applyState",
                    action: "artifactBlock"
                }],
                reaction: {
                    artifactBlock: [{
                        key: "artifactBlock",
                        label: "人工制品抵消",
                        targetType: "triggerEffect",
                        effect: [{
                            key: "artifactBlockDebuff"
                        }]
                    }]
                }
            }
        }
    },
    // 双发：下一张攻击牌打出两次
    {
        label: "双发",
        key: "doubleTap",
        category: "buff",
        describe: ["下一张攻击牌打出两次"],
        showType: "number",
        repeate: "stack",
        stackChange: [
            { timing: "turnEnd", delta: "all" }
        ],
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "make",
                    key: "useCard",
                    action: "doubleTapRepeat"
                }],
                reaction: {
                    doubleTapRepeat: [{
                        key: "doubleTapRepeat",
                        label: "双发",
                        targetType: "triggerEffect",
                        effect: [{
                            key: "modifyRepeat",
                            params: { requiredTag: "attack", addRepeat: 1, consumeStateKey: "doubleTap" }
                        }]
                    }]
                }
            }
        }
    },
    // 壁垒：护甲不在回合开始时消失（同步拦截 clearArmor 事件）
    {
        label: "壁垒",
        key: "barricade",
        category: "buff",
        describe: ["护甲不在回合开始时消失"],
        showType: "bool",
        repeate: "stack",
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "take",
                    key: "clearArmor",
                    cancelEvent: true
                }]
            }
        }
    },
    // 金属化：回合结束时获得等量护甲
    {
        label: "金属化",
        key: "metallicize",
        category: "buff",
        describe: ["回合结束时获得等量护甲"],
        showType: "number",
        repeate: "stack",
        interaction: {
            possess: {
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "turnEnd",
                    action: "metallicizeTick"
                }],
                reaction: {
                    metallicizeTick: [{
                        key: "metallicizeTick",
                        label: "金属化：获得护甲",
                        targetType: "triggerOwner",
                        effect: [{ key: "gainArmor", params: { value: "$source.stateStack()" } }]
                    }]
                }
            }
        }
    },
    // 柔韧：受到攻击时获得护甲（固定值 = 层数）
    {
        label: "柔韧",
        key: "malleable",
        category: "buff",
        describe: ["受到攻击时获得等量护甲"],
        showType: "number",
        repeate: "stack",
        interaction: {
            possess: {
                triggers: [{
                    when: "after",
                    how: "take",
                    key: "damage",
                    action: "malleableTick",
                    requirePositiveEffect: true,
                    condition: "$triggerCard.hasTag(attack)"
                }],
                reaction: {
                    malleableTick: [{
                        key: "malleableTick",
                        label: "柔韧：获得护甲",
                        targetType: "triggerOwner",
                        effect: [{ key: "gainArmor", params: { value: "$source.stateStack()" } }]
                    }]
                }
            }
        }
    },
    // 凌迟：每打出一张牌，对所有敌人造成伤害
    {
        label: "凌迟",
        key: "thousandCuts",
        category: "buff",
        describe: ["每打出一张牌，对所有敌人造成伤害"],
        showType: "number",
        repeate: "stack",
        interaction: {
            possess: {
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "useCard",
                    action: "thousandCutsDamage"
                }],
                reaction: {
                    thousandCutsDamage: [{
                        key: "thousandCutsDamage",
                        label: "凌迟伤害",
                        targetType: "allEnemies",
                        effect: [{
                            key: "damage",
                            params: { value: "$source.stateStack()" }
                        }]
                    }]
                }
            }
        }
    },
// 变硬：每回合一次，受到攻击时减少本次伤害（层数×10%），触发后状态消耗
{
    label: "变硬",
    key: "harden",
    category: "buff",
    describe: ["受到攻击时减少本次伤害（层数×10%），触发后消耗"],
    showType: "number",
    repeate: "refresh",
    interaction: {
        possess: {
            triggers: [{
                when: "before",
                how: "take",
                key: "damage",
                action: "hardenAbsorb",
                condition: "$triggerCard.hasTag(attack)"
            }],
            reaction: {
                hardenAbsorb: [
                    {
                        key: "hardenAbsorb_reduce",
                        label: "变硬：减少伤害",
                        targetType: "triggerEffect",
                        effect: [{ key: "state_hardenAbsorb", params: { stacks: "$source.stateStack()" } }]
                    },
                    {
                        key: "hardenAbsorb_remove",
                        label: "变硬：消耗状态",
                        targetType: "triggerOwner",
                        effect: [{ key: "removeState", params: { stateKey: "harden" } }]
                    }
                ]
            }
        }
    }
},
// 力场护盾：每层免疫下一次攻击牌伤害，被打消耗1层，不自动衰减（充能次数型防御）
{
    label: "力场护盾",
    key: "forceFieldShield",
    category: "buff",
    describe: ["每层免疫下一次攻击伤害"],
    showType: "number",
    repeate: "stack",
    interaction: {
        possess: {
            triggers: [{
                when: "before",
                how: "take",
                key: "damage",
                action: "absorbAndConsume",
                condition: "$triggerCard.hasTag(attack)"
            }],
            reaction: {
                absorbAndConsume: [
                    {
                        key: "forceFieldShield_absorb",
                        label: "力场护盾：吸收伤害",
                        targetType: "triggerEffect",
                        effect: [{ key: "nullifyDamageValue" }]
                    },
                    {
                        key: "forceFieldShield_consume",
                        label: "力场护盾：消耗层数",
                        targetType: "triggerOwner",
                        effect: [{ key: "changeStateStack", params: { stateKey: "forceFieldShield", delta: -1 } }]
                    }
                ]
            }
        }
    }
},
// 液压已释放：液压双管器官的内部标记，本回合首次攻击后附加，turnEnd 清除
{
    label: "液压已释放",
    key: "hydraulicUsed",
    category: "buff",
    describe: ["液压双管本回合首次攻击已释放"],
    showType: "bool",
    repeate: "refresh",
    stackChange: [{ timing: "turnEnd", delta: "all" }]
},
// 钢铁意志充能：致命保命器官的内部标记，战斗开始时附加，触发后消耗
{
    label: "钢铁意志充能",
    key: "lethalGuardReady",
    category: "buff",
    describe: ["钢铁意志：下次致命伤害将被免疫"],
    showType: "bool",
    repeate: "refresh"
},
// lifeStealBudget：腐食再生的每场战斗回血预算，层数=剩余可回血量
{
    label: "回血预算",
    key: "lifeStealBudget",
    category: "buff",
    describe: ["腐食再生每场战斗可回血的剩余额度"],
    showType: "number",
    repeate: "refresh"
},
// 点火：通用计数器状态，可被任何"逐步积累到阈值触发爆发"的敌人复用
// Boss 1 炙渣王：攻击牌积累 ignition，达到 4 时释放重铸获得+4力量
{
    label: "点火",
    key: "ignition",
    category: "buff",
    describe: ["积累计数，用于触发爆发型行动"],
    showType: "number",
    repeate: "stack"
},
// 愤怒：这回合每打出攻击牌，获得等同层数的格挡（"歇斯底里"卡专用）
{
    label: "愤怒",
    key: "rage",
    category: "buff",
    describe: ["这回合每打出一张攻击牌，获得等同于本状态层数的格挡"],
    showType: "number",
    repeate: "stack",
    stackChange: [
        { timing: "turnEnd", delta: "all" }
    ],
    interaction: {
        possess: {
            triggers: [{
                when: "after",
                how: "make",
                key: "useCard",
                action: "rageGainBlock",
                condition: "$triggerCard.hasTag(attack)"
            }],
            reaction: {
                rageGainBlock: [{
                    key: "rageGainBlock",
                    label: "愤怒格挡",
                    targetType: "owner",
                    effect: [{
                        key: "gainArmor",
                        params: { value: "$source.stateStack()" }
                    }]
                }]
            }
        }
    }
},
]
