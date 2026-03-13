/**
 * 临时物品测试示例
 *
 * 这些示例展示了如何在游戏中使用临时物品系统
 */

// 示例1: 创建临时卡牌的遗物
export const temporaryCardRelic = {
    label: "幻影召唤",
    key: "test_relic_phantom_summon",
    describe: ["战斗开始时", "获得一张临时的", "【幻影打击】"],
    interaction: {
        possess: {
            target: { key: "owner" },
            effects: [],
            triggers: [{
                when: "after",
                how: "make",
                key: "battleStart",
                event: [{
                    targetType: "owner",
                    key: "addTemporaryCard",
                    effect: [{
                        key: "addTemporaryCard",
                        params: {
                            cardKey: "original_card_00001", // 假设的卡牌key
                            removeOn: "battleEnd"
                        }
                    }]
                }]
            }]
        }
    }
}

// 示例2: 创建临时器官的卡牌
export const temporaryOrganCard = {
    label: "器官移植",
    key: "test_card_organ_transplant",
    describe: ["获得一个临时的", "【再生腺体】", "直到战斗结束"],
    status: {
        cost: 2
    },
    interaction: {
        use: {
            target: { key: "self" },
            effects: [{
                key: "addTemporaryOrgan",
                params: {
                    organKey: "original_organ_regeneration", // 假设的器官key
                    removeOn: "battleEnd"
                }
            }]
        }
    }
}

// 示例3: 将现有卡牌标记为临时的效果
export const markCardTemporaryEffect = {
    label: "时间扭曲",
    key: "test_card_time_warp",
    describe: ["选择一张手牌", "将其标记为临时", "回合结束时移除"],
    status: {
        cost: 1
    },
    interaction: {
        use: {
            target: { key: "self" },
            effects: [{
                key: "customCardChoice",
                params: {
                    title: "选择要标记为临时的卡牌",
                    source: "hand",
                    amount: 1,
                    callback: (selectedCards: any[]) => {
                        return [{
                            key: "markCardTemporary",
                            params: {
                                card: selectedCards[0],
                                removeOn: "turnEnd"
                            }
                        }]
                    }
                }
            }]
        }
    }
}

// 示例4: 回合结束时移除的临时效果
export const turnEndTemporaryCard = {
    label: "瞬息法术",
    key: "test_card_instant_spell",
    describe: ["获得一张临时的", "【闪电箭】", "回合结束时移除"],
    status: {
        cost: 1
    },
    interaction: {
        use: {
            target: { key: "self" },
            effects: [{
                key: "addTemporaryCard",
                params: {
                    cardKey: "original_card_lightning_bolt", // 假设的卡牌key
                    removeOn: "turnEnd"
                }
            }]
        }
    }
}

// 示例5: 层级结束时移除的临时器官
export const floorEndTemporaryOrgan = {
    label: "临时强化",
    key: "test_event_temporary_enhancement",
    describe: ["获得一个临时的强化器官", "层级结束时失去"],
    interaction: {
        choose: {
            target: { key: "self" },
            effects: [{
                key: "addTemporaryOrgan",
                params: {
                    organKey: "original_organ_power_boost", // 假设的器官key
                    removeOn: "floorEnd"
                }
            }]
        }
    }
}