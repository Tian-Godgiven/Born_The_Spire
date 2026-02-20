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
    }

    // 未来可以添加更多印记：
    // - 绿色印记（强化精英）
    // - 金色印记（宝箱）
    // - 等等...
]
