/**
 * 竞技场事件
 * 多幕事件，包含两场嵌入式战斗
 */

import type { EventMap } from "@/core/types/EventMapData"

export const colosseumEvent: EventMap = {
    key: "sts_event_colosseum",
    title: "竞技场",
    description: "你走进一座巨大的竞技场，看台上的观众们发出震耳欲聋的欢呼声。",
    icon: "⚔️",

    scenes: [
        // 第一幕：进入竞技场
        {
            key: "intro",
            type: "text",
            title: "竞技场",
            description: "你走进一座巨大的竞技场，看台上的观众们发出震耳欲聋的欢呼声。一个声音从高处传来：「勇士！证明你的实力吧！」",
            options: [
                {
                    key: "fight",
                    title: "迎战",
                    description: "拔出武器，迎接挑战。",
                    nextScene: "battle_1"
                }
            ]
        },

        // 第二幕：第一场战斗
        {
            key: "battle_1",
            type: "battle",
            title: "竞技场 - 第一轮",
            description: "第一轮挑战者登场！",
            battle: {
                enemies: ["test_enemy_slime", "test_enemy_berserker"],
                onWin: "post_battle",
                onLose: "gameOver"
            },
            options: []
        },

        // 第三幕：第一场战斗后的选择
        {
            key: "post_battle",
            type: "text",
            title: "竞技场 - 中场",
            description: "观众们为你的胜利欢呼！主持人再次开口：「精彩！你愿意继续挑战更强大的对手吗？奖赏将更加丰厚！」",
            options: [
                {
                    key: "continue",
                    title: "继续挑战",
                    description: "迎接更强大的对手，获取更丰厚的奖赏。",
                    nextScene: "battle_2"
                },
                {
                    key: "leave",
                    title: "见好就收",
                    description: "带着荣耀离开竞技场。",
                    effects: [
                        { key: "gainGold", params: { amount: 50 } }
                    ]
                }
            ]
        },

        // 第四幕：第二场战斗（更难，有奖励）
        {
            key: "battle_2",
            type: "battle",
            title: "竞技场 - 决赛",
            description: "最终的挑战者登场！",
            battle: {
                enemies: ["test_enemy_elite", "test_enemy_mage"],
                rewards: {
                    gold: 100,
                    relics: [
                        { rarity: "rare" },
                        { rarity: "uncommon" }
                    ]
                },
                onWin: "victory",
                onLose: "gameOver"
            },
            options: []
        },

        // 第五幕：胜利
        {
            key: "victory",
            type: "text",
            title: "竞技场 - 冠军",
            description: "观众们疯狂地欢呼！你被授予竞技场冠军的称号。主持人向你深深鞠躬：「无人能挡！今天的冠军——就是你！」",
            options: [
                {
                    key: "leave_victory",
                    title: "带着荣耀离开",
                    description: "在欢呼声中走出竞技场。"
                }
            ]
        }
    ]
}
