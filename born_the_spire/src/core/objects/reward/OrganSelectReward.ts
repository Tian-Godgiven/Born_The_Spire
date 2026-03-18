import { Reward } from "./Reward"
import type { RewardConfig } from "./Reward"
import type { OrganMap } from "@/core/objects/target/Organ"
import { nowPlayer } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { organRewardActionRegistry } from "@/static/registry/organRewardActionRegistry"
import type { OrganRewardActionContext } from "@/core/types/organRewardAction"
import { createOrgan } from "@/core/factories"

/**
 * 器官选择奖励配置
 */
export interface OrganSelectRewardConfig extends RewardConfig {
    type: "organSelect"
    organOptions: OrganMap[] | string[]  // 可选器官列表（配置或 key）
    selectCount?: number  // 可选择数量（默认 1）
    battleType?: "normal" | "elite" | "boss"  // 战斗类型
}

/**
 * 器官选择奖励类
 * 点击后打开器官选择界面
 */
export class OrganSelectReward extends Reward {
    public readonly organOptions: OrganMap[]
    public readonly selectCount: number
    public readonly battleType?: "normal" | "elite" | "boss"
    public selectedOrgans: string[] = []  // 存储选择的器官 key
    public selectedActions: Map<string, string> = new Map()  // organKey -> actionKey

    constructor(config: OrganSelectRewardConfig) {
        super(config)

        // 处理器官选项
        if (config.organOptions.length > 0 && typeof config.organOptions[0] === 'string') {
            this.organOptions = this.loadOrgansByKeys(config.organOptions as string[])
        } else {
            this.organOptions = config.organOptions as OrganMap[]
        }

        this.selectCount = config.selectCount || 1
    }

    /**
     * 根据器官 key 列表加载器官配置
     */
    private loadOrgansByKeys(keys: string[]): OrganMap[] {
        const organList = getLazyModule<OrganMap[]>('organList')
        return keys.map(key => {
            const config = organList.find((o: OrganMap) => o.key === key)
            if (!config) {
                console.warn(`[OrganSelectReward] 未找到器官配置: ${key}`)
            }
            return config
        }).filter((config): config is OrganMap => config !== undefined)
    }

    /**
     * 领取器官选择奖励
     * 根据选择的动作处理每个器官
     */
    async claim(): Promise<void> {
        if (!this.isAvailable()) {
            console.warn("[OrganSelectReward] 奖励不可领取")
            return
        }

        if (this.selectedOrgans.length === 0) {
            console.warn("[OrganSelectReward] 没有选择任何器官")
            this.markAsClaimed()
            return
        }

        // 动态导入避免循环依赖
        

        const player = nowPlayer
        const context: OrganRewardActionContext = {
            source: "battleReward",
            battleType: this.battleType
        }

        // 对每个选择的器官执行对应的动作
        for (const organKey of this.selectedOrgans) {
            const organConfig = this.organOptions.find(o => o.key === organKey)
            if (!organConfig) continue

            const organ = await createOrgan(organConfig)

            // 获取选择的动作
            const actionKey = this.selectedActions.get(organKey)
            if (!actionKey) {
                console.warn(`[OrganSelectReward] 器官 ${organConfig.label} 没有选择动作，跳过`)
                continue
            }

            // 执行动作
            const success = await organRewardActionRegistry.executeAction(
                actionKey,
                organ,
                player,
                context
            )

            if (success) {
                newLog([`对 ${organConfig.label} 执行了 ${actionKey}`])
            }
        }

        this.markAsClaimed()
    }

    /**
     * 获取已选择的器官 key 列表
     */
    getSelectedOrganKeys(): string[] {
        return this.selectedOrgans
    }

    protected getDefaultTitle(): string {
        return `选择器官 (${this.selectCount}/${this.organOptions.length})`
    }

    protected getDefaultDescription(): string {
        return `从 ${this.organOptions.length} 个器官中选择 ${this.selectCount} 个`
    }

    protected getDefaultIcon(): string {
        return "🫀"
    }
}
