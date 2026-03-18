/**
 * 器官部位系统
 */

import { OrganPartEnum } from "@/core/types/OrganTypes"
import type { PartConfig } from "@/core/types/OrganTypes"

/**
 * 部位配置列表
 * 定义所有可用的器官部位及其限制
 */
export const partConfigList: PartConfig[] = [
    {
        key: OrganPartEnum.Heart,
        label: "心脏",
        maxCount: 1,
        description: "生命的核心，只能装备一个"
    },
    {
        key: OrganPartEnum.Lung,
        label: "肺",
        maxCount: 2,
        description: "呼吸器官，可以装备两个"
    },
    {
        key: OrganPartEnum.Liver,
        label: "肝脏",
        maxCount: 1,
        description: "解毒器官"
    },
    {
        key: OrganPartEnum.Stomach,
        label: "胃",
        maxCount: 1,
        description: "消化器官"
    },
    {
        key: OrganPartEnum.Brain,
        label: "大脑",
        maxCount: 1,
        description: "思维中枢"
    },
    {
        key: OrganPartEnum.Eye,
        label: "眼睛",
        maxCount: 2,
        description: "视觉器官，可以装备两个"
    },
    {
        key: OrganPartEnum.Skin,
        label: "皮肤",
        maxCount: 3,
        description: "防护层，可以装备多个"
    },
    {
        key: OrganPartEnum.Bone,
        label: "骨骼",
        maxCount: 3,
        description: "支撑结构，可以装备多个"
    },
    {
        key: OrganPartEnum.Muscle,
        label: "肌肉",
        maxCount: 3,
        description: "力量来源，可以装备多个"
    },
    {
        key: OrganPartEnum.Blood,
        label: "血液",
        maxCount: 1,
        description: "循环系统"
    },
    {
        key: OrganPartEnum.Nerve,
        label: "神经",
        maxCount: 2,
        description: "感知系统，可以装备两个"
    },
    {
        key: OrganPartEnum.Gland,
        label: "腺体",
        maxCount: 3,
        description: "分泌器官，可以装备多个"
    },
    {
        key: OrganPartEnum.Core,
        label: "核心",
        maxCount: 1,
        description: "强大的核心器官，只能装备一个"
    }
]

/**
 * 根据部位获取配置
 * 如果部位未注册，返回 undefined
 */
export function getPartConfig(part: string): PartConfig | undefined {
    return partConfigList.find(c => c.key === part)
}

/**
 * 根据部位获取显示名称
 * 如果部位未注册，返回部位原始值
 */
export function getPartLabel(part: string): string {
    const config = getPartConfig(part)
    return config?.label || part
}

/**
 * 根据部位获取最大数量限制
 * 如果部位未注册，返回默认值 1（独特的部位只能有一个）
 */
export function getPartMaxCount(part: string): number {
    const config = getPartConfig(part)
    return config?.maxCount ?? 1
}

/**
 * 注册新的部位（用于 Mod 扩展）
 */
export function registerPart(config: PartConfig): void {
    // 检查是否已存在
    const existingIndex = partConfigList.findIndex(c => c.key === config.key)
    if (existingIndex >= 0) {
        // 替换现有配置
        partConfigList[existingIndex] = config
    } else {
        // 添加新配置
        partConfigList.push(config)
    }
}
