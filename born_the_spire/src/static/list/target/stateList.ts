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
    // 易伤：承受伤害时，伤害增加50%
    {
        label: "易伤",
        key: "vulnerable",
        category: "debuff",
        describe: ["承受的伤害增加50%"],
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
                    action: "vulnerableDebuff"
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
    }
]
