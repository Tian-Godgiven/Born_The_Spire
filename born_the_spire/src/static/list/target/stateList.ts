import { StateData } from "@/core/objects/system/State"

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
                    event: [{
                        key: "powerBoost",
                        label: "力量增伤",
                        targetType: "triggerEffect",  // 目标是伤害效果本身
                        effect: [{
                            key: "modifyDamageValue",
                            params: { delta: "$source.stack.default" }  // 增加等同于力量层数的伤害
                        }]
                    }]
                }]
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
            { timing: "turnEnd", delta: -1 }  // after turnEnd 时层数-1
        ],
        interaction: {
            possess: {
                triggers: [{
                    when: "before",  // before turnEnd 时造成伤害
                    how: "take",     // 玩家/敌人承受回合结束事件
                    key: "turnEnd",
                    event: [{
                        key: "poisonDamage",
                        label: "中毒伤害",
                        targetType: "triggerOwner",
                        effect: [{
                            key: "damage",
                            params: { value: "$source.stack.default" }  // 伤害等于层数
                        }]
                    }]
                }]
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
            { timing: "turnEnd", delta: -1 }  // after turnEnd 时层数-1
        ],
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "make",  // 造成伤害时
                    key: "damage",
                    event: [{
                        key: "weakDebuff",
                        label: "虚弱减伤",
                        targetType: "triggerEffect",  // 目标是伤害效果本身
                        effect: [{
                            key: "modifyDamageByPercent",
                            params: { percent: -0.25 }  // 减少25%伤害
                        }]
                    }]
                }]
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
            { timing: "turnEnd", delta: -1 }  // after turnEnd 时层数-1
        ],
        interaction: {
            possess: {
                triggers: [{
                    when: "before",
                    how: "take",  // 承受伤害时
                    key: "damage",
                    event: [{
                        key: "vulnerableDebuff",
                        label: "易伤增伤",
                        targetType: "triggerEffect",  // 目标是伤害效果本身
                        effect: [{
                            key: "modifyDamageByPercent",
                            params: { percent: 0.5 }  // 增加50%伤害
                        }]
                    }]
                }]
            }
        }
    }
]