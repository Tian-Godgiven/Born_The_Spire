/**
 * 器官部位系统
 */

import { OrganPart, PartConfig } from "@/core/types/OrganTypes"

/**
 * 部位配置列表
 * 定义所有可用的器官部位及其限制
 */
export const partConfigList: PartConfig[] = [
    {
        key: OrganPart.Heart,
        label: "心脏",
        maxCount: 1,
        description: "生命的核心，只能装备一个"
    },
    {
        key: OrganPart.Lung,
        label: "肺",
        maxCount: 2,
        description: "呼吸器官，可以装备两个"
    },
    {
        key: OrganPart.Liver,
        label: "肝脏",
        maxCount: 1,
        description: "解毒器官"
    },
    {
        key: OrganPart.Stomach,
        label: "胃",
        maxCount: 1,
        description: "消化器官"
    },
    {
        key: OrganPart.Brain,
        label: "大脑",
        maxCount: 1,
        description: "思维中枢"
    },
    {
        key: OrganPart.Eye,
        label: "眼睛",
        maxCount: 2,
        description: "视觉器官，可以装备两个"
    },
    {
        key: OrganPart.Skin,
        label: "皮肤",
        maxCount: 3,
        description: "防护层，可以装备多个"
    },
    {
        key: OrganPart.Bone,
        label: "骨骼",
        maxCount: 3,
        description: "支撑结构，可以装备多个"
    },
    {
        key: OrganPart.Muscle,
        label: "肌肉",
        maxCount: 3,
        description: "力量来源，可以装备多个"
    },
    {
        key: OrganPart.Blood,
        label: "血液",
        maxCount: 1,
        description: "循环系统"
    },
    {
        key: OrganPart.Nerve,
        label: "神经",
        maxCount: 2,
        description: "感知系统，可以装备两个"
    },
    {
        key: OrganPart.Gland,
        label: "腺体",
        maxCount: 3,
        description: "分泌器官，可以装备多个"
    },
    {
        key: OrganPart.Core,
        label: "核心",
        maxCount: 1,
        description: "强大的核心器官，只能装备一个"
    }
]

/**
 * 根据部位获取配置
 */
export function getPartConfig(part: OrganPart): PartConfig {
    const config = partConfigList.find(c => c.key === part)
    if (!config) {
        throw new Error(`未找到部位配置: ${part}`)
    }
    return config
}

/**
 * 根据部位获取显示名称
 */
export function getPartLabel(part: OrganPart): string {
    return getPartConfig(part).label
}

/**
 * 根据部位获取最大数量限制
 */
export function getPartMaxCount(part: OrganPart): number {
    return getPartConfig(part).maxCount
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
