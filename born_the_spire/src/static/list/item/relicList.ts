import type { RelicMap } from "@/core/objects/item/Subclass/Relic";
import { Relic } from "@/core/objects/item/Subclass/Relic";
import { createRelic } from "@/core/factories";

export const relicList: RelicMap[] = [
    // 被动遗物 - 只有 possess
    {
        label: "回血石",
        describe: ["战斗结束时", "回复", { key: ["status", "heal"] }, "生命"],
        key: "original_relic_00001",
        rarity: "common",
        status: {
            "heal": 5
        },
        interaction: {
            possess: {
                target: { key: "self" },
                effects: [],
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "battleEnd",
                    event: [{
                        targetType: "owner",
                        key: "heal",
                        effect: [{
                            key: "heal",
                            params: { value: 5 }
                        }]
                    }]
                }]
            }
        }
    },
    // 主动遗物 - 单个 use
    {
        label: "爆炸药瓶",
        describe: ["使用时", "对所有敌人造成", { key: ["status", "damage"] }, "伤害"],
        key: "original_relic_00002",
        rarity: "uncommon",
        status: {
            "damage": 10
        },
        interaction: {
            use: {
                label: "投掷",
                target: { faction: "enemy" },
                effects: [{
                    key: "damage",
                    params: { value: 10 }
                }]
            }
        }
    },
    // 多功能遗物 - 多个 use
    {
        label: "神秘遗物",
        describe: ["可以激活、充能或粉碎"],
        key: "original_relic_00003",
        rarity: "rare",
        status: {
            "energy": 1,
            "draw": 2,
            "damage": 50
        },
        interaction: {
            possess: {
                target: { key: "self" },
                effects: [],
                // 可以添加持有时的被动效果
            },
            use: [
                {
                    label: "激活",
                    target: { key: "self" },
                    effects: [{
                        key: "gainEnergy",
                        params: { value: 1 }
                    }]
                },
                {
                    label: "充能",
                    target: { key: "self" },
                    effects: [{
                        key: "drawCard",
                        params: { value: 2 }
                    }]
                },
                {
                    label: "粉碎（销毁遗物）",
                    target: { faction: "enemy" },
                    effects: [{
                        key: "damage",
                        params: { value: 50 }
                    }]
                }
            ]
        }
    },
    // 献祭遗物 - 解锁器官奖励中的献祭动作
    {
        label: "血祭之石",
        describe: ["战斗奖励中，器官选择时可以选择献祭，回复生命值"],
        key: "original_relic_sacrifice",
        rarity: "uncommon",
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "enableOrganRewardAction",
                    params: {
                        actionKey: "sacrifice"
                    }
                }],
            },
            lose: {
                target: { key: "owner" },
                effects: [{
                    key: "disableOrganRewardAction",
                    params: {
                        actionKey: "sacrifice"
                    }
                }]
            }
        }
    },
    // 示例：修改抽牌数量的遗物
    {
        label: "学者之戒",
        describe: ["每回合多抽", { key: ["status", "extra-draw"] }, "张牌"],
        key: "original_relic_00004",
        rarity: "common",
        status: {
            "extra-draw": 2
        },
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "addStatusBase",
                    params: {
                        statusKey: "draw-per-turn",
                        value: 2,
                        type: "additive"
                    }
                }]
            }
        }
    },
    // 第一回合额外抽牌
    {
        label: "先手之戒",
        describe: ["第一回合", "额外抽", { key: ["status", "first-turn-draw"] }, "张牌"],
        key: "original_relic_00005",
        rarity: "common",
        status: {
            "first-turn-draw": 2
        },
        interaction: {
            possess: {
                target: { key: "self" },
                effects: [],
                triggers: [{
                    when: "after",
                    how: "make",
                    key: "battleStart",
                    event: [{
                        targetType: "owner",
                        key: "addFirstTurnDrawBonus",
                        effect: [{
                            key: "addFirstTurnDraw",
                            params: { value: 2 }
                        }]
                    }]
                }]
            }
        }
    },
    // 锻炼遗物 - 解锁水池中的锻炼行动
    {
        label: "健身手环",
        describe: ["水池中可以选择锻炼，消耗物质增加最大生命"],
        key: "original_relic_exercise",
        rarity: "uncommon",
        interaction: {
            possess: {
                target: { key: "owner" },
                effects: [{
                    key: "enablePoolAction",
                    params: {
                        actionKey: "exercise"
                    }
                }]
            },
            lose: {
                target: { key: "owner" },
                effects: [{
                    key: "disablePoolAction",
                    params: {
                        actionKey: "exercise"
                    }
                }]
            }
        }
    }
]

/**
 * 获取遗物对象
 */
export async function getRelicByKey(relicKey: string) {
    // 获取数据
    const map = relicList.find(item => item.key == relicKey)
    if (!map) {
        throw new Error(`不存在的遗物key: ${relicKey}`)
    }
    // 生成遗物对象
    const relic = await createRelic(map)
    return relic
}

/**
 * 获取所有遗物数据
 */
export function getAllRelics(): RelicMap[] {
    return [...relicList]
}
