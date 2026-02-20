/**
 * 单个层级的选择状态
 * 管理该层级的规则、房间池、状态等
 */

import type { SelectionRule, SelectionContext } from "./types"
import type { FloorConfig } from "@/core/types/FloorConfig"
import { RoomSelector } from "./RoomSelector"
import { SelectionRuleFactory } from "./SelectionRuleFactory"

export class FloorSelectionState {
    private roomSelector: RoomSelector
    private rules: SelectionRule[]
    private ruleStates: Map<string, any> = new Map()

    // 动态规则（遗物、buff等添加）
    private dynamicRules: Array<{ id: string, rule: SelectionRule }> = []

    constructor(floorConfig: FloorConfig) {
        // 创建基础规则
        this.rules = SelectionRuleFactory.createMany(floorConfig.selectionRules || [])

        // 创建房间选择器
        this.roomSelector = new RoomSelector({
            pools: floorConfig.roomPools,
            exhaustionStrategies: floorConfig.exhaustionStrategies
        })
    }

    /**
     * 选择房间
     */
    selectRooms(count: number, context: SelectionContext): string[] {
        // 合并基础规则 + 动态规则
        const allRules = [
            ...this.rules,
            ...this.dynamicRules.map(dr => dr.rule)
        ]

        // 恢复规则状态
        this.restoreRuleStates(allRules)

        // 选择房间
        const selected = this.roomSelector.select(allRules, count, context)

        // 保存规则状态
        this.saveRuleStates(allRules)

        return selected
    }

    /**
     * 添加动态规则
     */
    addDynamicRule(ruleId: string, rule: SelectionRule): void {
        this.dynamicRules.push({ id: ruleId, rule })
        console.log(`[FloorSelectionState] 添加动态规则: ${ruleId}`)
    }

    /**
     * 移除动态规则
     */
    removeDynamicRule(ruleId: string): void {
        this.dynamicRules = this.dynamicRules.filter(dr => dr.id !== ruleId)
        this.ruleStates.delete(ruleId)
        console.log(`[FloorSelectionState] 移除动态规则: ${ruleId}`)
    }

    /**
     * 通知房间已进入
     */
    notifyRoomEntered(roomKey: string, selectedRooms: string[]): void {
        // 通知池管理器
        this.roomSelector.notifyRoomEntered(roomKey)

        // 通知所有规则更新状态
        const allRules = [
            ...this.rules,
            ...this.dynamicRules.map(dr => dr.rule)
        ]

        this.restoreRuleStates(allRules)

        for (const rule of allRules) {
            rule.updateAfterSelection(selectedRooms, roomKey)
        }

        this.saveRuleStates(allRules)
    }

    /**
     * 保存规则状态
     */
    private saveRuleStates(rules: SelectionRule[]): void {
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i]
            if ('serialize' in rule && typeof rule.serialize === 'function') {
                const ruleId = this.getRuleId(rule, i)
                this.ruleStates.set(ruleId, rule.serialize())
            }
        }
    }

    /**
     * 恢复规则状态
     */
    private restoreRuleStates(rules: SelectionRule[]): void {
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i]
            if ('deserialize' in rule && typeof rule.deserialize === 'function') {
                const ruleId = this.getRuleId(rule, i)
                const savedState = this.ruleStates.get(ruleId)
                if (savedState) {
                    rule.deserialize(savedState)
                }
            }
        }
    }

    /**
     * 获取规则ID
     */
    private getRuleId(rule: SelectionRule, index: number): string {
        // 动态规则有自己的ID
        const dynamicRule = this.dynamicRules.find(dr => dr.rule === rule)
        if (dynamicRule) {
            return dynamicRule.id
        }

        // 基础规则用类型+索引
        return `${rule.constructor.name}_${index}`
    }

    /**
     * 序列化
     */
    serialize(): any {
        return {
            ruleStates: Object.fromEntries(this.ruleStates),
            dynamicRules: this.dynamicRules.map(dr => ({
                id: dr.id
                // TODO: 序列化动态规则配置
            })),
            poolManagerState: this.roomSelector.serialize()
        }
    }

    /**
     * 反序列化
     */
    deserialize(data: any): void {
        if (data.ruleStates) {
            this.ruleStates = new Map(Object.entries(data.ruleStates))
        }

        if (data.poolManagerState) {
            this.roomSelector.deserialize(data.poolManagerState)
        }

        // TODO: 恢复动态规则
    }
}
