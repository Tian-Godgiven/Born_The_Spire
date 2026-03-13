import type { TreasureRoomConfig } from "@/core/objects/room/TreasureRoom"

export const treasureList: TreasureRoomConfig[] = [
    {
        key: "treasure_default",
        name: "神秘宝箱",
        description: "一个散发着神秘光芒的宝箱",
        type: "treasure",
        layer: 0,
        baseGoldAmount: 30,
        goldPerLayer: 5,
        goldVariance: { variance: 0.15 },
        relicFilter: {
            rarityWeights: {
                common: 60,
                uncommon: 30,
                rare: 10
            },
            count: 1
        },
        markKey: "mark_treasure"
    }
]
