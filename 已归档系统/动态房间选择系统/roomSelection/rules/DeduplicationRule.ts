/**
 * 去重规则
 * 控制房间的去重行为
 */

import type { SelectionRule, SelectionIntent, RoomPools, SelectionContext } from "../types"

export interface DeduplicationConfig {
    // 同一次选择中去重（默认 true，由 RoomSelector 自动处理）
    noDuplicatesInSelection?: boolean

    // 历史去重（已由 RoomPoolManager 处理，这里不需要额外逻辑）

    // 类型内去重（允许同类型，但不同房间）
    allowSameType?: boolean  // 默认 true
}

export class DeduplicationRule implements SelectionRule {
    constructor(_config: DeduplicationConfig = {}) {
        // 配置已由 RoomPoolManager 和 RoomSelector 处理
    }

    getIntent(_roomPools: RoomPools, _count: number, _context: SelectionContext): SelectionIntent {
        // 去重主要由 RoomPoolManager 和 RoomSelector 处理
        // 这个规则主要用于配置，实际逻辑在选择器中
        return {
            fallback: 'random'
        }
    }

    updateAfterSelection(_selectedRooms: string[], _enteredRoom: string | null): void {
        // 不需要维护状态
    }

    serialize(): any {
        return {}
    }

    deserialize(_state: any): void {
        // 无状态
    }
}
