/**
 * SlayTheSpire Mod - 金神像事件
 */

import type { EventMap } from '@/core/types/EventMapData'

export const goldenIdolEvent: EventMap = {
    key: "sts_event_golden_idol",
    title: "金神像",
    description: "在一个不引人注意的小高台上，你发现了一个闪闪发光的金神像安然放置在上面，看起来非常值钱。\n周围看起来完全没有什么陷阱的样子。",
    icon: "🗿",
    scenes: [
        {
            key: "choice",
            title: "金神像",
            description: "在一个不引人注意的小高台上，你发现了一个闪闪发光的金神像安然放置在上面，看起来非常值钱。\n周围看起来完全没有什么陷阱的样子。",
            options: [
                {
                    title: "拿走",
                    description: "得到金神像。触发一个陷阱。",
                    icon: "✋",
                    nextScene: "trap",
                    effects: [
                        { key: "gainRelic", params: { relicKey: "sts_relic_golden_idol" } }
                    ]
                },
                {
                    title: "离开",
                    description: "没有比这更明显的陷阱了吧。",
                    icon: "🚪",
                    nextScene: "leave_result"
                }
            ]
        },
        {
            key: "trap",
            title: "陷阱！",
            description: "你拿住金神像放入囊中，突然天花板上一块巨大的圆石掉到了你身边的地上。\n石头开始向你滚来，你这才发现地面有一点倾斜。",
            options: [
                {
                    title: "逃跑",
                    description: "被诅咒——受伤。",
                    icon: "🏃",
                    nextScene: "run_result",
                    effects: [
                        { key: "gainCard", params: { cardKey: "sts_card_injury" } }
                    ]
                },
                {
                    title: "砸烂",
                    description: "失去25%生命。",
                    icon: "💥",
                    nextScene: "smash_result",
                    effects: [
                        { key: "loseHealthPercent", params: { percent: 25 } }
                    ]
                },
                {
                    title: "躲藏",
                    description: "失去8%最大生命。",
                    icon: "🫣",
                    nextScene: "hide_result",
                    effects: [
                        { key: "loseMaxHealthPercent", params: { percent: 8 } }
                    ]
                }
            ]
        },
        {
            key: "run_result",
            title: "快跑！",
            description: "你勉强在石头碾到你之前跳进了旁边的一条小路，不幸的是你似乎扭伤了关节。",
            options: [{
                title: "离开",
                description: ""
            }]
        },
        {
            key: "smash_result",
            title: "砸烂巨石",
            description: "你用尽全力向巨石发起了攻击。尘埃落定之后，你可以寻找安全的出路。",
            options: [{
                title: "离开",
                description: ""
            }]
        },
        {
            key: "hide_result",
            title: "咕叽！",
            description: "巨石滚过时压到了你一点，但看起来你并没有大碍，可以离开了。",
            options: [{
                title: "离开",
                description: ""
            }]
        },
        {
            key: "leave_result",
            title: "明智的选择",
            description: "你决定还是不要去碰高台上的东西了。",
            options: [{
                title: "离开",
                description: ""
            }]
        }
    ]
}
