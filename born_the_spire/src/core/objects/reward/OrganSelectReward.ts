import { Reward, RewardConfig } from "./Reward"
import { Organ } from "@/core/objects/target/Organ"
import { OrganMap } from "@/static/list/target/organList"
import { newLog } from "@/ui/hooks/global/log"
import { getLazyModule } from "@/core/utils/lazyLoader"

/**
 * 器官选择奖励配置
 */
export interface OrganSelectRewardConfig extends RewardConfig {
    type: "organSelect"
    organOptions: OrganMap[] | string[]  // 可选器官列表（配置或 key）
    selectCount?: number  // 可选择数量（默认 1）
}

/**
 * 器官选择奖励类
 * 点击后打开器官选择界面
 */
export class OrganSelectReward extends Reward {
    public readonly organOptions: OrganMap[]
    public readonly selectCount: number
    public selectedOrgans: string[] = []  // 存储选择的器官 key

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
     * 将选择的器官添加到玩家
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
        const { nowPlayer } = await import("@/core/objects/game/run")
        const { getOrganModifier } = await import("@/core/objects/system/modifier/OrganModifier")
        const { Organ } = await import("@/core/objects/target/Organ")

        // 将选择的器官添加到玩家
        const organModifier = getOrganModifier(nowPlayer)
        for (const organKey of this.selectedOrgans) {
            const organConfig = this.organOptions.find(o => o.key === organKey)
            if (organConfig) {
                const organ = new Organ(organConfig)
                organModifier.acquireOrgan(organ, nowPlayer)
                newLog([`获得器官: ${organConfig.label}`])
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
