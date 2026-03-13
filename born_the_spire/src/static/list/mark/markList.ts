/**
 * 印记列表
 * 定义游戏中所有的印记配置
 */

import type { MarkConfig } from "@/core/types/MarkConfig"

/**
 * 所有印记配置
 */
export const markList: MarkConfig[] = [
    // 红色印记（染血）
    {
        key: "mark_blood",
        name: "红色印记",
        description: "最大生命值 -10",
        displayText: "已染血",
        displayColor: "red",
        statusKey: "ifBloodMark",
        onGain: {
            key: "bloodMark",
            effectUnits: [{
                key: "addStatusBaseCurrentValue",
                params: {
                    value: -10,
                    statusKey: "max-health",
                    currentKey: "health"
                }
            }]
        }
    },

    // 金色印记（宝箱）
    {
        key: "mark_treasure",
        name: "宝箱印记",
        description: "打开神秘宝箱获得的印记",
        displayText: "已开宝箱",
        displayColor: "#D4AF37",
        statusKey: "ifTreasureMark"
    }
]
