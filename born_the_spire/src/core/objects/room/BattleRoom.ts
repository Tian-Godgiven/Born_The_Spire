import { Room, RoomConfig, BattleRoomType } from "./Room"
import { startNewBattle, Battle } from "../game/battle"
import { Enemy } from "../target/Enemy"
import { EnemyMap } from "@/static/list/target/enemyList"
import { newLog } from "@/ui/hooks/global/log"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { nowPlayer } from "@/core/objects/game/run"

/**
 * 战斗房间配置
 */
export interface BattleRoomConfig extends RoomConfig {
    type: "battle"
    battleType?: BattleRoomType  // 战斗类型：normal, elite, boss
    enemyConfigs?: EnemyMap[] | string[]    // 敌人配置列表或敌人 key 列表
    customData?: {
        battleType?: BattleRoomType
        enemyConfigs?: string[]  // 敌人 key 列表
    }
}

/**
 * 战斗房间类
 * 包装 Battle 类，管理战斗流程和奖励
 */
export class BattleRoom extends Room {
    public readonly battleType: BattleRoomType
    public readonly enemyConfigs: EnemyMap[]
    private battle: Battle | null = null
    private enemies: Enemy[] = []

    constructor(config: BattleRoomConfig) {
        super(config)

        // 从 config 或 customData 中获取 battleType
        this.battleType = config.battleType
            || config.customData?.battleType
            || "normal"

        // 从 config 或 customData 中获取 enemyConfigs
        const enemyConfigsSource = config.enemyConfigs
            || config.customData?.enemyConfigs
            || []

        // 如果是字符串数组（敌人 key），需要从 enemyList 中查找
        if (enemyConfigsSource.length > 0 && typeof enemyConfigsSource[0] === 'string') {
            this.enemyConfigs = this.loadEnemyConfigsByKeys(enemyConfigsSource as string[])
        } else {
            this.enemyConfigs = enemyConfigsSource as EnemyMap[]
        }
    }

    /**
     * 根据敌人 key 列表加载敌人配置
     */
    private loadEnemyConfigsByKeys(keys: string[]): EnemyMap[] {
        const enemyList = getLazyModule<EnemyMap[]>('enemyList')
        return keys.map(key => {
            const config = enemyList.find((e: EnemyMap) => e.key === key)
            if (!config) {
                console.warn(`[BattleRoom] 未找到敌人配置: ${key}`)
            }
            return config
        }).filter((config): config is EnemyMap => config !== undefined)
    }

    /**
     * 进入战斗房间
     */
    async enter(): Promise<void> {
        newLog([`===== 进入${this.getDisplayName()} =====`])

        // 生成敌人
        this.enemies = this.enemyConfigs.map(config => new Enemy(config))

        newLog([`生成敌人: ${this.enemies.map(e => e.label).join(", ")}`])
    }

    /**
     * 处理战斗内容
     * 启动战斗系统
     */
    async process(): Promise<void> {
        // 获取玩家队伍（从 battle.ts 中导入）
        const { nowPlayerTeam } = await import("../game/battle")

        if (nowPlayerTeam.length === 0) {
            console.error("[BattleRoom] 没有玩家队伍")
            return
        }

        // 启动战斗
        this.battle = await startNewBattle(nowPlayerTeam, this.enemies)

        newLog(["战斗开始！"])
    }

    /**
     * 完成战斗房间
     * 处理战斗奖励
     */
    async complete(): Promise<void> {
        if (!this.battle) {
            console.warn("[BattleRoom] 战斗未开始")
            return
        }

        // 检查战斗结果
        const battleResult = this.battle.checkBattleEnd()

        if (battleResult === "player_win") {
            newLog([`===== ${this.getDisplayName()}胜利 =====`])
            await this.handleVictoryRewards()
        } else if (battleResult === "player_lose") {
            newLog([`===== ${this.getDisplayName()}失败 =====`])
            // TODO: 处理失败逻辑
        }
    }

    /**
     * 离开战斗房间
     */
    async exit(): Promise<void> {
        newLog([`===== 离开${this.getDisplayName()} =====`])

        // 清理 targetManager 中的目标
        const { targetManager } = await import("@/ui/interaction/target/targetManager")
        this.enemies.forEach(enemy => {
            targetManager.removeTarget(enemy)
        })

        // 清理全局战斗状态
        const { endNowBattle } = await import("../game/battle")
        endNowBattle()

        // 清理本地战斗状态
        this.battle = null
        this.enemies = []
    }

    /**
     * 处理战斗胜利奖励
     */
    private async handleVictoryRewards(): Promise<void> {
        newLog(["开始结算奖励..."])

        // 根据战斗类型提供不同奖励
        switch (this.battleType) {
            case "normal":
                await this.handleNormalRewards()
                break
            case "elite":
                await this.handleEliteRewards()
                break
            case "boss":
                await this.handleBossRewards()
                break
        }
    }

    /**
     * 普通战斗奖励
     * - 吞噬物质
     * - 同化器官（3选1）
     * - 药水（概率掉落）
     */
    private async handleNormalRewards(): Promise<void> {
        newLog(["普通战斗奖励："])

        const rewards = []

        // 1. 计算物质奖励（根据层级）
        const materialReward = this.calculateMaterialReward()

        // 创建物质奖励对象
        const { rewardRegistry } = await import("@/static/registry/rewardRegistry")
        const materialRewardObj = rewardRegistry.createReward({
            type: "material",
            amount: materialReward
        })
        if (materialRewardObj) {
            rewards.push(materialRewardObj)
        }

        // 2. 收集所有敌人的器官
        const allOrganKeys = this.collectEnemyOrgans()

        if (allOrganKeys.length > 0) {
            // 3. 随机选择3个器官（如果不足3个则全部显示）
            const selectedOrganKeys = this.selectRandomOrgans(allOrganKeys, 3)

            // 4. 创建器官选择奖励
            const organReward = rewardRegistry.createReward({
                type: "organSelect",
                organOptions: selectedOrganKeys,
                selectCount: 1
            })

            if (organReward) {
                rewards.push(organReward)
            }
        } else {
            newLog(["敌人没有可同化的器官"])
        }

        // 5. 药水掉落（概率）
        const potionReward = await this.tryGeneratePotionReward()
        if (potionReward) {
            rewards.push(potionReward)
        }

        // 6. 显示奖励页面并等待玩家完成选择
        if (rewards.length > 0) {
            const { showRewards } = await import("@/ui/hooks/interaction/rewardDisplay")
            await showRewards(rewards, "战斗胜利", "选择你的奖励")
        }
    }

    /**
     * 精英战斗奖励
     * - 普通奖励
     * - 遗物奖励（3选1）
     */
    private async handleEliteRewards(): Promise<void> {
        newLog(["精英战斗奖励："])

        const rewards = []

        // 1. 计算物质奖励（根据层级）
        const materialReward = this.calculateMaterialReward()

        // 创建物质奖励对象
        const { rewardRegistry } = await import("@/static/registry/rewardRegistry")
        const materialRewardObj = rewardRegistry.createReward({
            type: "material",
            amount: materialReward
        })
        if (materialRewardObj) {
            rewards.push(materialRewardObj)
        }

        // 2. 器官选择
        const allOrganKeys = this.collectEnemyOrgans()
        if (allOrganKeys.length > 0) {
            const selectedOrganKeys = this.selectRandomOrgans(allOrganKeys, 3)
            const organReward = rewardRegistry.createReward({
                type: "organSelect",
                organOptions: selectedOrganKeys,
                selectCount: 1
            })
            if (organReward) {
                rewards.push(organReward)
            }
        }

        // 3. 遗物选择（3选1）
        const relicReward = await this.generateRelicSelectReward(3, 1)
        if (relicReward) {
            rewards.push(relicReward)
        }

        // 4. 药水掉落（概率）
        const potionReward = await this.tryGeneratePotionReward()
        if (potionReward) {
            rewards.push(potionReward)
        }

        // 5. 显示奖励页面
        if (rewards.length > 0) {
            const { showRewards } = await import("@/ui/hooks/interaction/rewardDisplay")
            await showRewards(rewards, "精英战斗胜利", "选择你的奖励")
        }
    }

    /**
     * Boss战斗奖励
     * - 吞噬物质（双倍）
     * - Boss器官（所有器官选1）
     * - Boss遗物（3选1）
     */
    private async handleBossRewards(): Promise<void> {
        newLog(["Boss战斗奖励："])

        const rewards = []

        // 1. 给予更多物质奖励（双倍）
        const materialReward = this.calculateMaterialReward() * 2

        // 创建物质奖励对象
        const { rewardRegistry } = await import("@/static/registry/rewardRegistry")
        const materialRewardObj = rewardRegistry.createReward({
            type: "material",
            amount: materialReward
        })
        if (materialRewardObj) {
            rewards.push(materialRewardObj)
        }

        // 2. Boss器官（所有器官都可选择）
        const allOrganKeys = this.collectEnemyOrgans()
        if (allOrganKeys.length > 0) {
            const organReward = rewardRegistry.createReward({
                type: "organSelect",
                organOptions: allOrganKeys,
                selectCount: 1,
                title: "Boss器官",
                description: "选择一个强大的Boss器官"
            })
            if (organReward) {
                rewards.push(organReward)
            }
        }

        // 3. Boss遗物（3选1）
        const relicReward = await this.generateRelicSelectReward(3, 1, "Boss遗物")
        if (relicReward) {
            rewards.push(relicReward)
        }

        // 4. 显示奖励页面
        if (rewards.length > 0) {
            const { showRewards } = await import("@/ui/hooks/interaction/rewardDisplay")
            await showRewards(rewards, "Boss战斗胜利", "选择你的奖励")
        }
    }

    /**
     * 计算物质奖励（根据层级）
     */
    private calculateMaterialReward(): number {
        // 基础物质 + 层级加成
        return 30 + this.layer * 5
    }

    /**
     * 收集所有敌人的器官
     */
    private collectEnemyOrgans(): string[] {
        const allOrganKeys: string[] = []

        for (const enemy of this.enemies) {
            const organModifier = getOrganModifier(enemy)
            const organs = organModifier.getOrgans()

            // 收集器官的 key
            organs.forEach(organ => {
                if (organ.key) {
                    allOrganKeys.push(organ.key)
                }
            })
        }

        return allOrganKeys
    }

    /**
     * 从器官列表中随机选择指定数量的器官
     */
    private selectRandomOrgans(organKeys: string[], count: number): string[] {
        if (organKeys.length <= count) {
            return [...organKeys]
        }

        // 随机打乱并选择前 count 个
        const shuffled = [...organKeys].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, count)
    }

    /**
     * 生成遗物选择奖励
     * @param optionCount 可选遗物数量
     * @param selectCount 可选择数量
     * @param title 标题（可选）
     */
    private async generateRelicSelectReward(
        optionCount: number,
        selectCount: number,
        title?: string
    ): Promise<any> {
        const relicList = getLazyModule<any[]>('relicList')

        // 随机选择遗物
        const shuffled = [...relicList].sort(() => Math.random() - 0.5)
        const selectedRelics = shuffled.slice(0, optionCount)

        if (selectedRelics.length === 0) {
            console.warn("[BattleRoom] 没有可用的遗物")
            return null
        }

        const { rewardRegistry } = await import("@/static/registry/rewardRegistry")
        return rewardRegistry.createReward({
            type: "relicSelect",
            relicOptions: selectedRelics,
            selectCount,
            title: title || "选择遗物",
            description: `从 ${selectedRelics.length} 个遗物中选择 ${selectCount} 个`
        })
    }

    /**
     * 尝试生成药水奖励（基于掉落概率）
     */
    private async tryGeneratePotionReward(): Promise<any> {
        // 获取药水掉落概率
        const potionDropChance = this.getPotionDropChance()

        // 随机判断是否掉落
        if (Math.random() > potionDropChance) {
            return null
        }

        // 随机选择一个药水
        const potionList = getLazyModule<any[]>('potionList')
        if (potionList.length === 0) {
            return null
        }

        const randomPotion = potionList[Math.floor(Math.random() * potionList.length)]

        const { rewardRegistry } = await import("@/static/registry/rewardRegistry")
        return rewardRegistry.createReward({
            type: "potion",
            potionConfig: randomPotion
        })
    }

    /**
     * 获取药水掉落概率
     * 优先从玩家属性读取，否则使用默认值
     */
    private getPotionDropChance(): number {
        // 尝试从玩家的 status 中读取药水掉落概率
        const potionChanceStatus = nowPlayer.status["potion-drop-chance"]
        if (potionChanceStatus) {
            return potionChanceStatus.value
        }

        // 默认掉落概率：40%
        return 0.4
    }

    /**
     * 获取战斗房间显示名称
     */
    getDisplayName(): string {
        if (this.name) {
            return this.name
        }

        const typeNameMap: Record<BattleRoomType, string> = {
            "normal": "普通战斗",
            "elite": "精英战斗",
            "boss": "Boss战斗"
        }

        return typeNameMap[this.battleType] || "战斗"
    }

    /**
     * 获取战斗房间图标
     */
    getIcon(): string {
        const iconMap: Record<BattleRoomType, string> = {
            "normal": "⚔️",
            "elite": "💀",
            "boss": "👑"
        }

        return iconMap[this.battleType] || "⚔️"
    }

    /**
     * 获取当前战斗实例
     */
    getBattle(): Battle | null {
        return this.battle
    }

    /**
     * 获取敌人列表
     */
    getEnemies(): Enemy[] {
        return this.enemies
    }
}
