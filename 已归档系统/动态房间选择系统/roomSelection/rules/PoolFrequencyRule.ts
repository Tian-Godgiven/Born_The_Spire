/**
 * 水池频率规则
 * 专门用于控制水池出现频率：
 * - 基础概率
 * - 连续N次未出现强制触发
 * - 递减阈值（出现但未进入时降低阈值）
 */

import type { SelectionRule, SelectionIntent, RoomPools, SelectionContext } from "../types"

export interface PoolFrequencyConfig {
    baseProbability: number      // 基础概率
    initialThreshold: number     // 初始强制触发阈值
    minThreshold: number         // 最小阈值
}

export class PoolFrequencyRule implements SelectionRule {
    private consecutiveMiss = 0      // 连续未出现次数
    private forceThreshold: number   // 当前强制触发阈值
    private config: PoolFrequencyConfig

    constructor(config: PoolFrequencyConfig) {
        this.config = config
        this.forceThreshold = config.initialThreshold
    }

    getIntent(_roomPools: RoomPools, _count: number, context: SelectionContext): SelectionIntent {
        // 情况1：达到强制阈值
        if (this.consecutiveMiss >= this.forceThreshold) {
            return {
                mustHave: [{ type: "pool", count: 1 }],  // 必须包含1个水池
                fallback: 'random'
            }
        }

        // 情况2：按概率决定
        const probability = this.calculateProbability(context)
        if (Math.random() < probability) {
            return {
                prefer: [{ type: "pool", count: 1 }],  // 偏好包含1个水池
                fallback: 'random'
            }
        }

        // 情况3：不特别要求水池
        return {
            fallback: 'random'
        }
    }

    updateAfterSelection(selectedRooms: string[], enteredRoom: string | null): void {
        const poolAppeared = selectedRooms.some(key => this.isPool(key))

        if (poolAppeared) {
            if (enteredRoom && this.isPool(enteredRoom)) {
                // 玩家进入了水池 → 完全重置
                this.consecutiveMiss = 0
                this.forceThreshold = this.config.initialThreshold
            } else {
                // 水池出现但玩家没进 → 降低阈值，重置计数
                this.consecutiveMiss = 0
                this.forceThreshold = Math.max(
                    this.config.minThreshold,
                    this.forceThreshold - 1
                )
            }
        } else {
            // 水池没出现 → 计数+1
            this.consecutiveMiss++
        }
    }

    serialize(): any {
        return {
            consecutiveMiss: this.consecutiveMiss,
            forceThreshold: this.forceThreshold
        }
    }

    deserialize(state: any): void {
        this.consecutiveMiss = state.consecutiveMiss || 0
        this.forceThreshold = state.forceThreshold || this.config.initialThreshold
    }

    /**
     * 计算动态概率（可被子类覆盖）
     */
    protected calculateProbability(_context: SelectionContext): number {
        // 基础概率，可以根据context调整
        // 例如：根据难度、玩家血量等
        return this.config.baseProbability
    }

    private isPool(roomKey: string): boolean {
        // 判断是否是水池房间
        return roomKey.startsWith('pool_')
    }
}
