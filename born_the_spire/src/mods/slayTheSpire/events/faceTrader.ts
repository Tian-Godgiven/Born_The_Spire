/**
 * SlayTheSpire Mod - 换脸商事件
 * 原作：Face Trader，出现在第一或第二阶段
 */

import type { EventMap } from '@/core/types/EventMapData'

const desc_main = [
    "你经过一尊举着许多不同面具的奇怪雕像，但没走几步……",
    "你就听见身后传来一个轻柔的声音：",
    "「请留步。」",
    "你回了回头，却发现那尊雕像也已经转向了你！",
    "仔细一看，原来这并不是一尊雕像，只是一个肤色如同雕像的消瘦男人……他是不是根本没有在呼吸？",
    "「你的脸，让我碰碰？或者，想要交易？」"
].join("\n")

const desc_touch = [
    "「补偿吗？当然了」",
    "他动作机械地伸出手来，将一叠金币放进了你的钱袋里。",
    "「真是张好脸，啊啊，多好的脸。」",
    "当他触碰你的脸颊时，你觉得自己的生命好像正在流失！",
    "突然之间，只见他带着的面具掉落了下来在地上摔得粉碎，他立即尖叫起来，六只手飞快地捂住了自己的脸，这下那些面具全都摔落下来了！在这凄厉的尖叫和众多面具粉碎的声音中，你赶紧逃离了这里。",
    "你在不经意间瞥到了他面具下的样子：他的脸是一片空白。"
].join("\n")

const desc_trade = [
    "「和我？和我吗？啊，当然了……可以。可以……唔嗯……」",
    "你看见他的一根手臂抖动了一下，突然你的脸出现在了他的手里！似乎你的脸和那个面具交换了。",
    "「很好的脸，唔，很好的脸。」"
].join("\n")

const desc_leave = [
    "「留步，留步啊，请留步，请留步，请留步。」",
    "你觉得自己做出了正确的选择。"
].join("\n")

export const faceTraderEvent: EventMap = {
    key: "sts_event_face_trader",
    title: "换脸商",
    description: desc_main,
    icon: "🎭",
    scenes: [
        {
            key: "choice",
            title: "换脸商",
            description: desc_main,
            options: [
                {
                    title: "触碰",
                    description: "失去10%最大生命值的生命，获得75金币。",
                    icon: "✋",
                    nextScene: "touch_result",
                    effects: [
                        { key: "loseHealthPercent", params: { percent: 10 } },
                        { key: "gainGold", params: { amount: 75 } }
                    ]
                },
                {
                    title: "交易",
                    description: "50%获得好脸；50%获得坏脸。",
                    icon: "🔄",
                    nextScene: "trade_result",
                    effects: [
                        {
                            key: "gainRelicFromPool", params: {
                                pool: [
                                    {
                                        keys: ["sts_relic_cleric_face", "sts_relic_serpent_head"],
                                        weight: 50
                                    },
                                    {
                                        keys: ["sts_relic_cultist_mask", "sts_relic_gremlin_face", "sts_relic_nloth_face"],
                                        weight: 50
                                    }
                                ]
                            }
                        }
                    ]
                },
                {
                    title: "离开",
                    description: "",
                    icon: "🚪",
                    nextScene: "leave_result"
                }
            ]
        },
        {
            key: "touch_result",
            title: "触碰",
            description: desc_touch,
            options: [{
                title: "离开",
                description: ""
            }]
        },
        {
            key: "trade_result",
            title: "交易",
            description: desc_trade,
            options: [{
                title: "离开",
                description: ""
            }]
        },
        {
            key: "leave_result",
            title: "离开",
            description: desc_leave,
            options: [{
                title: "离开",
                description: ""
            }]
        }
    ]
}
