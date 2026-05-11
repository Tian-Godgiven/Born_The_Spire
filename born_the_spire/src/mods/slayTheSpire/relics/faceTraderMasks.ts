/**
 * SlayTheSpire Mod - 换脸商面具遗物
 * 来自换脸商事件的5种面具
 */

import type { RelicMap } from '@/core/objects/item/Subclass/Relic'

/**
 * 牧师的脸
 * 每场战斗后最大生命值增加1
 */
export const clericFaceRelic: RelicMap = {
    label: "牧师的脸",
    tags: ["sts"],
    describe: ["每场战斗结束后", "最大生命值+1"],
    key: "sts_relic_cleric_face",
    rarity: "common",
    interaction: {
        possess: {
            target: { key: "owner" },
            triggers: [{
                when: "after",
                how: "make",
                key: "battleEnd",
                action: "gainMaxHealthOnBattleEnd"
            }]
        }
    },
    reaction: {
        gainMaxHealthOnBattleEnd: [{
            targetType: "owner",
            key: "gainMaxHealth",
            effect: [{
                key: "gainMaxHealth",
                params: { value: 1 }
            }]
        }]
    }
}

/**
 * 蛇的头
 * 每次进入事件房间时获得50金币
 */
export const serpentHeadRelic: RelicMap = {
    label: "蛇的头",
    tags: ["sts"],
    describe: ["每次进入？房间时", "获得50金币"],
    key: "sts_relic_serpent_head",
    rarity: "common",
    interaction: {
        possess: {
            target: { key: "owner" },
            triggers: [{
                when: "after",
                how: "take",
                key: "roomEnter",
                condition: "$event.info(roomType) == event",
                action: "gainGoldOnEventRoom"
            }]
        }
    },
    reaction: {
        gainGoldOnEventRoom: [{
            targetType: "owner",
            key: "gainGold",
            effect: [{
                key: "gainReserve",
                params: { reserveKey: "gold", amount: 50 }
            }]
        }]
    }
}

/**
 * 邪教徒头套
 * 无实际效果（原作中战斗开始时会说"咔咔"）
 */
export const cultistMaskRelic: RelicMap = {
    label: "邪教徒头套",
    tags: ["sts"],
    describe: ["你觉得自己有开腔的欲望"],
    key: "sts_relic_cultist_mask",
    rarity: "common",
    interaction: {
        possess: {
            target: { key: "owner" },
            effects: []
        }
    }
}

/**
 * 地精容貌
 * 每场战斗开始时获得1层虚弱
 */
export const gremlinFaceRelic: RelicMap = {
    label: "地精容貌",
    tags: ["sts"],
    describe: ["每场战斗开始时", "获得1层虚弱"],
    key: "sts_relic_gremlin_face",
    rarity: "common",
    interaction: {
        possess: {
            target: { key: "owner" },
            triggers: [{
                when: "after",
                how: "take",
                key: "battleStart",
                action: "applyWeakOnBattleStart"
            }]
        }
    },
    reaction: {
        applyWeakOnBattleStart: [{
            targetType: "owner",
            key: "applyState",
            effect: [{
                key: "applyState",
                params: { stateKey: "weak", stacks: 1 }
            }]
        }]
    }
}

/**
 * 恩洛斯的饥饿的脸
 * 下一个宝箱将是空的（一次性效果）
 */
export const nlothFaceRelic: RelicMap = {
    label: "恩洛斯的饥饿的脸",
    tags: ["sts"],
    describe: ["你打开的下一个宝箱将是空的"],
    key: "sts_relic_nloth_face",
    rarity: "common",
    interaction: {
        possess: {
            target: { key: "owner" },
            triggers: [{
                when: "before",
                how: "take",
                key: "openChest",
                action: "emptyNextChest"
            }]
        }
    },
    reaction: {
        emptyNextChest: [{
            targetType: "owner",
            key: "emptyChest",
            effect: [{
                key: "emptyChest",
                params: {}
            }]
        }]
    }
}
