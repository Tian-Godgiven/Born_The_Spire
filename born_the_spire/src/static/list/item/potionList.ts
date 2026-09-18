import type { PotionMap } from "@/core/objects/item/Subclass/Potion";
import { createPotion } from "@/core/factories";

/** 战斗掉落 / 黑市 / 随机奖励用。测试池药水不进这里。 */
export function isObtainablePotion(potion: PotionMap): boolean {
    const pool = potion.pool && potion.pool.length > 0 ? potion.pool : ["common"]
    return pool.includes("common") || pool.includes("shop")
}

export const potionList: PotionMap[] = [
    {
        label: "生命药剂",
        key: "original_potion_00001",
        rarity: "common",
        pool: ["common"],
        targetType: "player",
        status: { heal: 10 },
        effect: ["饮用，回复", { key: ["status", "heal"] }, "点生命"],
        interaction: {
            use: {
                label: "饮用",
                target: { key: "self" },
                effects: [{
                    key: "heal",
                    params: { value: "$medium.status(heal)" }
                }]
            }
        }
    },
    {
        label: "爆炸药水",
        key: "original_potion_00002",
        rarity: "uncommon",
        pool: ["common"],
        targetType: "enemy",
        status: { damage: 12 },
        effect: ["投掷，对所有敌人造成", { key: ["status", "damage"] }, "点伤害"],
        interaction: {
            use: {
                label: "投掷",
                target: { faction: "enemy", number: "all" },
                effects: [{
                    key: "attack",
                    params: { value: "$medium.status(damage)" }
                }]
            }
        }
    },
    {
        label: "火焰药水",
        key: "original_potion_00004",
        rarity: "common",
        pool: ["common"],
        targetType: "enemy",
        status: { damage: 20 },
        effect: ["投掷，对一名敌人造成", { key: ["status", "damage"] }, "点伤害"],
        interaction: {
            use: {
                label: "投掷",
                target: { faction: "enemy" },
                effects: [{
                    key: "attack",
                    params: { value: "$medium.status(damage)" }
                }]
            }
        }
    },
    {
        label: "力量药剂",
        key: "original_potion_strength",
        rarity: "common",
        pool: ["common"],
        targetType: "player",
        status: { stacks: 2 },
        effect: ["饮用，获得", { key: ["status", "stacks"] }, "层", {$:"力量"}],
        interaction: {
            use: {
                label: "饮用",
                target: { key: "self" },
                effects: [{
                    key: "applyState",
                    params: { stateKey: "power", stacks: "$medium.status(stacks)" }
                }]
            }
        }
    },
    {
        label: "敏捷药剂",
        key: "original_potion_dexterity",
        rarity: "common",
        pool: ["common"],
        targetType: "player",
        status: { stacks: 2 },
        effect: ["饮用，获得", { key: ["status", "stacks"] }, "层", {$:"敏捷"}],
        interaction: {
            use: {
                label: "饮用",
                target: { key: "self" },
                effects: [{
                    key: "applyState",
                    params: { stateKey: "dexterity", stacks: "$medium.status(stacks)" }
                }]
            }
        }
    },
    {
        label: "能量药剂",
        key: "original_potion_energy",
        rarity: "uncommon",
        pool: ["common"],
        targetType: "player",
        status: { energy: 2 },
        effect: ["饮用，获得", { key: ["status", "energy"] }, "点能量"],
        interaction: {
            use: {
                label: "饮用",
                target: { key: "self" },
                effects: [{
                    key: "gainEnergy",
                    params: { value: "$medium.status(energy)" }
                }]
            }
        }
    },
    {
        label: "灵视药剂",
        key: "original_potion_draw",
        rarity: "uncommon",
        pool: ["common"],
        targetType: "player",
        status: { draw: 3 },
        effect: ["饮用，抽", { key: ["status", "draw"] }, "张牌"],
        interaction: {
            use: {
                label: "饮用",
                target: { key: "self" },
                effects: [{
                    key: "drawFromDrawPile",
                    params: { value: "$medium.status(draw)" }
                }]
            }
        }
    },
    {
        label: "瓶中精灵",
        key: "original_potion_00005",
        rarity: "rare",
        pool: ["common"],
        targetType: "player",
        canDrop: false,
        status: { reviveHealth: 30 },
        effect: [
            "携带时，将一次致死伤害改为回复",
            { key: ["status", "reviveHealth"] },
            "点生命，随后消耗此药水"
        ],
        interaction: {
            possess: {
                target: { key: "owner" },
                triggers: [{
                    when: "before",
                    how: "take",
                    key: "dead",
                    action: "fairyRevive"
                }]
            }
        },
        reaction: {
            fairyRevive: [
                {
                    targetType: "thisOwner",
                    key: "cancelDeath",
                    effect: [{ key: "cancelCurrentEvent" }]
                },
                {
                    targetType: "thisOwner",
                    key: "healFairy",
                    effect: [{
                        key: "heal",
                        params: { value: "$this.status(reviveHealth)" }
                    }]
                },
                {
                    targetType: "thisOwner",
                    key: "consumeFairy",
                    effect: [{
                        key: "losePotion",
                        params: { potionKey: "original_potion_00005" }
                    }]
                }
            ]
        }
    },
    // 测试用，不进掉落 / 黑市 / 随机奖励
    {
        label: "诅咒药水",
        key: "original_potion_00003",
        rarity: "common",
        pool: ["test"],
        targetType: "player",
        canDrop: false,
        status: { damage: 5 },
        effect: [
            "无法丢弃。饮用，受到",
            { key: ["status", "damage"] },
            "点伤害"
        ],
        interaction: {
            possess: {
                target: { key: "self" },
                effects: []
            },
            use: {
                label: "勉强饮用",
                target: { key: "self" },
                effects: [{
                    key: "damage",
                    params: { value: "$medium.status(damage)" }
                }]
            }
        }
    }
]

export async function getPotionByKey(potionKey: string) {
    const map = potionList.find(item => item.key == potionKey)
    if (!map) {
        throw new Error(`不存在的药水key${potionKey}`)
    }
    const potion = await createPotion(map)
    return potion
}
