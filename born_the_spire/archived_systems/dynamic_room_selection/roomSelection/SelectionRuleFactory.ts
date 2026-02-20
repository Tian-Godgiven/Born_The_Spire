/**
 * 选择规则工厂
 * 从配置创建规则实例
 */

import type { SelectionRule, SelectionRuleConfig } from "./types"
import { IncrementalProbabilityRule } from "./rules/IncrementalProbabilityRule"
import { PoolFrequencyRule } from "./rules/PoolFrequencyRule"
import { DeduplicationRule } from "./rules/DeduplicationRule"
import { LayoutSelectionRule } from "./rules/LayoutSelectionRule"

export class SelectionRuleFactory {
    /**
     * 创建单个规则
     */
    static create(ruleConfig: SelectionRuleConfig): SelectionRule {
        // 如果提供了自定义规则，直接使用
        if (ruleConfig.customRule) {
            return ruleConfig.customRule
        }

        // 根据类型创建预设规则
        switch (ruleConfig.type) {
            case 'pool-frequency':
                return new PoolFrequencyRule(ruleConfig.config)

            case 'incremental-probability':
                return new IncrementalProbabilityRule(ruleConfig.config)

            case 'deduplication':
                return new DeduplicationRule(ruleConfig.config)

            case 'layout':
                return new LayoutSelectionRule(ruleConfig.config)

            case 'custom':
                throw new Error('[SelectionRuleFactory] custom 类型必须提供 customRule 实例')

            default:
                throw new Error(`[SelectionRuleFactory] 未知的规则类型: ${ruleConfig.type}`)
        }
    }

    /**
     * 批量创建
     */
    static createMany(configs: SelectionRuleConfig[]): SelectionRule[] {
        return configs.map(config => this.create(config))
    }
}
