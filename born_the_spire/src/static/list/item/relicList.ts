import { Relic, RelicMap } from "@/core/objects/item/Subclass/Relic";

export const relicList: RelicMap[] = [
    // 被动遗物 - 只有 possess
    {
        label: "回血石",
        describe: ["战斗结束时", "回复", { key: ["status", "heal"] }, "生命"],
        key: "original_relic_00001",
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
    }
]

/**
 * 获取遗物对象
 */
export function getRelicByKey(relicKey: string): Relic {
    // 获取数据
    const map = relicList.find(item => item.key == relicKey)
    if (!map) {
        throw new Error(`不存在的遗物key: ${relicKey}`)
    }
    // 生成遗物对象
    const relic = new Relic(map)
    return relic
}

/**
 * 获取所有遗物数据
 */
export function getAllRelics(): RelicMap[] {
    return [...relicList]
}
