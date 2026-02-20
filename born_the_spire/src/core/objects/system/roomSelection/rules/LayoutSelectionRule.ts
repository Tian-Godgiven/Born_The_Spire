/**
 * 布局规则
 * 用于精确控制特定步数的房间
 */

import type { SelectionRule, SelectionIntent, RoomPools, SelectionContext } from "../types"
import type { RoomType } from "@/core/objects/room/Room"

export interface LayoutConfig {
    layout: {
        [step: number]: {
            key?: string           // 固定房间key
            type?: RoomType        // 固定房间类型
            pool?: string[]        // 候选池
        }
    }
}

export class LayoutSelectionRule implements SelectionRule {
    private config: LayoutConfig

    constructor(config: LayoutConfig) {
        this.config = config
    }

    getIntent(_roomPools: RoomPools, _count: number, context: SelectionContext): SelectionIntent {
        const stepConfig = this.config.layout[context.step]

        if (!stepConfig) {
            // 当前步数没有特殊配置
            return { fallback: 'random' }
        }

        // 有配置，返回强制意图
        const intent: SelectionIntent = {
            mustHave: [],
            fallback: 'random'
        }

        if (stepConfig.key) {
            // 固定房间key
            intent.mustHave!.push({ key: stepConfig.key, count: 1 })
        } else if (stepConfig.pool) {
            // 候选池
            intent.mustHave!.push({ pool: stepConfig.pool, count: 1 })
        } else if (stepConfig.type) {
            // 固定类型
            intent.mustHave!.push({ type: stepConfig.type, count: 1 })
        }

        return intent
    }

    updateAfterSelection(_selectedRooms: string[], _enteredRoom: string | null): void {
        // 无状态
    }

    serialize(): any {
        return {}
    }

    deserialize(_state: any): void {
        // 无状态
    }
}
