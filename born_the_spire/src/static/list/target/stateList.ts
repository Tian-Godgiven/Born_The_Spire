import type { StateData } from "@/core/objects/system/State"

export const stateList: StateData[] = [
    // 力量：造成伤害时，伤害增加
    {
        label: "力量",
        key: "power",
        describe: ["造成的伤害增加"],
        showType: "number",
        repeate: "stack",
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
                            params: { delta: "$source.stack.default" }
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
                            params: { value: "$source.stack.default" }
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
                                delta: "$source.stack.default",
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
    }
]
