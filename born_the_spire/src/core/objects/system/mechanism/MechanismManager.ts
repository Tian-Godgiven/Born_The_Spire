/**
 * 游戏机制管理器
 * 管理单个实体的所有游戏机制（护甲、能量护盾等）
 */

import { Entity } from "../Entity"
import { MechanismVote, TriggerRemover } from "@/static/registry/mechanismRegistry"

/**
 * 机制管理器类
 * 封装实体的机制投票、触发器和状态管理
 */
export class MechanismManager {
    private owner: Entity
    private votes: Map<string, MechanismVote[]> = new Map()
    private triggers: Map<string, TriggerRemover[]> = new Map()
    private state: Map<string, boolean> = new Map()

    constructor(owner: Entity) {
        this.owner = owner
    }

    /**
     * 添加投票
     */
    addVote(mechanismKey: string, vote: MechanismVote): void {
        let voteList = this.votes.get(mechanismKey)
        if (!voteList) {
            voteList = []
            this.votes.set(mechanismKey, voteList)
        }

        // 检查是否已有相同来源的投票
        const existingVote = voteList.find(v => v.source === vote.source)
        if (existingVote) {
            // 更新现有投票
            existingVote.priority = vote.priority
            existingVote.vote = vote.vote
        } else {
            // 添加新投票
            voteList.push(vote)
        }
    }

    /**
     * 移除投票
     */
    removeVote(mechanismKey: string, source: any): boolean {
        const voteList = this.votes.get(mechanismKey)
        if (!voteList) return false

        const index = voteList.findIndex(v => v.source === source)
        if (index === -1) return false

        voteList.splice(index, 1)

        // 如果没有投票了，清理数据
        if (voteList.length === 0) {
            this.votes.delete(mechanismKey)
        }

        return true
    }

    /**
     * 获取所有投票
     */
    getVotes(mechanismKey: string): MechanismVote[] {
        return this.votes.get(mechanismKey) || []
    }

    /**
     * 计算最终投票结果
     * @returns "enable" | "disable" | null（无投票）
     */
    getFinalVote(mechanismKey: string): "enable" | "disable" | null {
        const voteList = this.votes.get(mechanismKey)
        if (!voteList || voteList.length === 0) {
            return null
        }

        // 按优先级排序（降序）
        const sortedVotes = [...voteList].sort((a, b) => b.priority - a.priority)

        // 返回优先级最高的投票
        return sortedVotes[0].vote
    }

    /**
     * 设置机制状态
     */
    setState(mechanismKey: string, enabled: boolean): void {
        this.state.set(mechanismKey, enabled)
    }

    /**
     * 获取机制状态
     */
    getState(mechanismKey: string): boolean {
        return this.state.get(mechanismKey) || false
    }

    /**
     * 检查机制是否启用
     */
    isEnabled(mechanismKey: string): boolean {
        return this.getState(mechanismKey)
    }

    /**
     * 添加触发器
     */
    addTriggers(mechanismKey: string, triggers: TriggerRemover[]): void {
        this.triggers.set(mechanismKey, triggers)
    }

    /**
     * 移除触发器
     */
    removeTriggers(mechanismKey: string): void {
        const triggerList = this.triggers.get(mechanismKey)
        if (triggerList) {
            triggerList.forEach(t => t.remove())
            this.triggers.delete(mechanismKey)
        }
    }

    /**
     * 获取触发器
     */
    getTriggers(mechanismKey: string): TriggerRemover[] {
        return this.triggers.get(mechanismKey) || []
    }

    /**
     * 清理所有数据
     */
    clear(): void {
        // 移除所有触发器
        for (const [key, triggerList] of this.triggers.entries()) {
            triggerList.forEach(t => t.remove())
        }

        this.votes.clear()
        this.triggers.clear()
        this.state.clear()
    }

    /**
     * 获取所有已启用的机制
     */
    getEnabledMechanisms(): string[] {
        const enabled: string[] = []
        for (const [key, isEnabled] of this.state.entries()) {
            if (isEnabled) {
                enabled.push(key)
            }
        }
        return enabled
    }

    /**
     * 调试信息
     */
    debug(mechanismKey?: string): void {
        if (mechanismKey) {
            console.log(`[MechanismManager] ${this.owner.label} - ${mechanismKey}:`)
            console.log(`  投票:`, this.getVotes(mechanismKey))
            console.log(`  最终投票:`, this.getFinalVote(mechanismKey))
            console.log(`  状态:`, this.getState(mechanismKey))
            console.log(`  触发器数量:`, this.getTriggers(mechanismKey).length)
        } else {
            console.log(`[MechanismManager] ${this.owner.label}:`)
            console.log(`  所有投票:`, this.votes)
            console.log(`  所有状态:`, this.state)
            console.log(`  已启用机制:`, this.getEnabledMechanisms())
        }
    }
}

/**
 * 获取实体的机制管理器（如果不存在则创建）
 */
export function getMechanismManager(entity: Entity): MechanismManager {
    if (!entity.mechanisms) {
        entity.mechanisms = new MechanismManager(entity)
    }
    return entity.mechanisms
}
