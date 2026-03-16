/**
 * 递增概率规则
 * 通用的概率递增规则，支持：
 * - 每次尝试自动增加概率
 * - 出现但未进入时额外增加概率
 * - 进入后重置概率
 */

import type { SelectionRule, SelectionIntent, RoomPools, SelectionContext } from "../types"
import type { RoomType } from "@/core/objects/room/Room"

export interface IncrementalProbabilityConfig {
    targetType: RoomType | string          // 目标房间类型
    targetPool?: string[]                  // 或者指定具体的候选池
    baseProbability: number                // 基础概率
    increasePerAttempt: number             // 每次尝试增加的概率
    increasePerSkip: number                // 出现但未进入时增加的概率
    maxProbability: number                 // 最大概率上限
    maxCount?: number                      // 最多出现数量（默认1）
}

export class IncrementalProbabilityRule implements SelectionRule {
    private currentProbability: number
    private config: Required<IncrementalProbabilityConfig>

    constructor(config: IncrementalProbabilityConfig) {
        this.config = {
            targetType: config.targetType,
            targetPool: config.targetPool || [],
            baseProbability: config.baseProbability,
            increasePerAttempt: config.increasePerAttempt,
            increasePerSkip: config.increasePerSkip,
            maxProbability: config.maxProbability,
            maxCount: config.maxCount || 1
        }
        this.currentProbability = this.config.baseProbability
    }

    getIntent(_roomPools: RoomPools, _count: number, _context: SelectionContext): SelectionIntent {
        const probability = this.currentProbability

        // 每次调用自动增加概率
        this.currentProbability = Math.min(
            this.config.maxProbability,
            this.currentProbability + this.config.increasePerAttempt
        )

        const intent: SelectionIntent = {
            prefer: [
                {
                    count: 1,
                    weight: probability
                }
            ],
            maxCount: {},
            fallback: 'random'
        }

        // 根据配置设置目标
        if (this.config.targetPool) {
            intent.prefer![0].pool = this.config.targetPool
        } else {
            intent.prefer![0].type = this.config.targetType as RoomType
        }

        // 设置数量限制
        intent.maxCount![this.config.targetType] = this.config.maxCount

        return intent
    }

    updateAfterSelection(selectedRooms: string[], enteredRoom: string | null): void {
        const targetAppeared = selectedRooms.some(key => this.isTarget(key))

        if (targetAppeared) {
            if (enteredRoom && this.isTarget(enteredRoom)) {
                // 玩家进入了目标房间 → 重置概率
                this.currentProbability = this.config.baseProbability
            } else {
                // 目标出现但玩家没进 → 额外增加概率
                this.currentProbability = Math.min(
                    this.config.maxProbability,
                    this.currentProbability + this.config.increasePerSkip
                )
            }
        }
    }

    serialize(): any {
        return {
            currentProbability: this.currentProbability
        }
    }

    deserialize(state: any): void {
        this.currentProbability = state.currentProbability || this.config.baseProbability
    }

    private isTarget(roomKey: string): boolean {
        if (this.config.targetPool) {
            return this.config.targetPool.includes(roomKey)
        }
        // TODO: 需要通过 roomRegistry 判断类型
        // 暂时用简单的字符串匹配
        return roomKey.startsWith(this.config.targetType + '_')
    }
}
