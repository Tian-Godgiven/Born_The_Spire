import { Reward, RewardConfig } from "./Reward"
import { Organ } from "@/core/objects/target/Organ"
import { OrganMap } from "@/static/list/target/organList"
import { newLog } from "@/ui/hooks/global/log"

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
    private selectedOrgans: Organ[] = []

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
        const { organList } = require("@/static/list/target/organList")
        return keys.map(key => {
            const config = organList.find((o: OrganMap) => o.key === key)
            if (!config) {
                console.warn(`[OrganSelectReward] 未找到器官配置: ${key}`)
            }
            return config
        }).filter(Boolean)
    }

    /**
     * 领取器官选择奖励
     * 打开器官选择界面
     */
    async claim(): Promise<void> {
        if (!this.isAvailable()) {
            console.warn("[OrganSelectReward] 奖励不可领取")
            return
        }

        newLog(["打开器官选择界面..."])

        // TODO: 打开器官选择 UI
        // 这里应该触发一个全局事件或调用 UI 系统
        // 暂时先模拟选择第一个器官
        if (this.organOptions.length > 0) {
            const selectedOrgan = new Organ(this.organOptions[0])
            this.selectedOrgans.push(selectedOrgan)
            newLog([`选择了器官: ${selectedOrgan.label}`])

            // TODO: 将器官添加到玩家
            // nowPlayer.addOrgan(selectedOrgan)
        }

        this.markAsClaimed()
    }

    /**
     * 获取已选择的器官
     */
    getSelectedOrgans(): Organ[] {
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
