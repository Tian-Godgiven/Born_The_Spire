/**
 * 事件房间（重构版）
 * 支持从配置列表加载事件，支持原子效果和复杂交互
 * 支持嵌入战斗场景
 */

import { Room } from "./Room"
import type { RoomConfig } from "./Room"
import { Choice, ChoiceGroup } from "../system/Choice"
import type { EventMap, EventSceneMap, BattleSceneConfig, BattleRewardConfig } from "@/core/types/EventMapData"
import { executeEventEffects } from "@/static/list/room/event/eventEffectMap"
import { newLog } from "@/ui/hooks/global/log"
import type { Component } from "vue"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { completeAndGoNext } from "@/core/hooks/step"
import { startNewBattle, nowPlayerTeam, endNowBattle } from "../game/battle"
import type { Enemy } from "../target/Enemy"
import type { EnemyMap } from "../target/Enemy"
import { createEnemy } from "@/core/factories"
import { rewardRegistry } from "@/static/registry/rewardRegistry"
import { nowPlayer } from "../game/run"
import { showBattleDefeat } from "@/ui/hooks/interaction/battleDefeat"

/**
 * 事件房间配置
 */
export interface EventRoomConfig extends RoomConfig {
    type: "event"
    eventConfig?: EventMap          // 事件配置（可选，如果不提供则从 eventKey 加载）
    eventKey?: string               // 事件 key（从 eventList 中加载）
    customData?: {                  // 自定义数据（用于从 roomList 创建）
        eventKey?: string
    }
}

/**
 * 事件房间类
 * 提供多个选项供玩家选择，支持简单效果和复杂交互
 * 支持单幕事件和多幕事件
 * 支持嵌入战斗场景
 */
export class EventRoom extends Room {
    public readonly eventConfig: EventMap
    public readonly choiceGroup: ChoiceGroup
    public customComponent?: Component | string  // 自定义事件组件

    // 多幕事件相关
    private isMultiScene: boolean = false       // 是否为多幕事件
    private _currentSceneKey: string | null = null  // 当前幕的 key
    private sceneData: Record<string, any> = {}     // 幕间共享数据

    // 当前显示的标题和描述（响应式，随幕切换更新）
    public currentTitle: string = ""
    public currentDescription: string = ""

    // 战斗阶段相关
    public currentPhase: "event" | "battle" = "event"
    private battleEnemies: Enemy[] = []
    private currentBattleConfig: BattleSceneConfig | null = null

    constructor(config: EventRoomConfig) {
        super(config)

        // 加载事件配置
        if (config.eventConfig) {
            this.eventConfig = config.eventConfig
        } else if (config.eventKey) {
            this.eventConfig = this.loadEventByKey(config.eventKey)
        } else if (config.customData?.eventKey) {
            // 从 customData 中加载（用于从 roomList 创建）
            this.eventConfig = this.loadEventByKey(config.customData.eventKey)
        } else {
            throw new Error("[EventRoom] 必须提供 eventConfig 或 eventKey")
        }

        // 保存自定义组件
        this.customComponent = this.eventConfig.component

        // 判断是单幕还是多幕事件
        this.isMultiScene = !!(this.eventConfig.scenes && this.eventConfig.scenes.length > 0)

        if (this.isMultiScene) {
            // 多幕事件：从第一幕开始
            const firstScene = this.eventConfig.scenes![0]
            this._currentSceneKey = firstScene.key
            this.currentTitle = firstScene.title
            this.currentDescription = firstScene.description
            this.choiceGroup = this.createChoiceGroupForScene(firstScene)
        } else {
            // 单幕事件
            this.currentTitle = this.eventConfig.title
            this.currentDescription = this.eventConfig.description
            const choices = this.createChoicesFromOptions(
                this.eventConfig.options!,
                this.eventConfig.mutuallyExclusiveGroups
            )

            this.choiceGroup = new ChoiceGroup({
                title: this.eventConfig.title,
                description: this.eventConfig.description,
                choices,
                minSelect: 1,
                maxSelect: 1,
                onComplete: async () => {
                    await this.complete()
                }
            })
        }
    }

    /**
     * 根据事件 key 加载事件配置
     */
    private loadEventByKey(key: string): EventMap {
        const eventList = getLazyModule<EventMap[]>('eventList')
        const config = eventList.find((e: EventMap) => e.key === key)
        if (!config) {
            throw new Error(`[EventRoom] 未找到事件配置: ${key}`)
        }
        return config
    }

    /**
     * 为指定幕创建 ChoiceGroup
     */
    private createChoiceGroupForScene(scene: EventSceneMap): ChoiceGroup {
        const choices = this.createChoicesFromOptions(scene.options, scene.mutuallyExclusiveGroups)

        return new ChoiceGroup({
            title: scene.title,
            description: scene.description,
            choices,
            minSelect: 1,
            maxSelect: 1,
            onComplete: async () => {
                // 多幕事件不在选择完成时立即 complete
                // 而是等待跳转到下一幕或手动完成
            }
        })
    }

    /**
     * 从选项配置创建 Choice 数组
     */
    private createChoicesFromOptions(
        options: any[],
        mutuallyExclusiveGroups?: string[][]
    ): Choice[] {
        return options
            .filter(option => {
                // 如果有条件函数，检查是否满足条件
                if (option.condition) {
                    return option.condition(this.sceneData)
                }
                return true
            })
            .map(option => {
                // 根据互斥组计算此选项的互斥列表
                let mutuallyExclusiveWith: string[] | undefined = undefined
                if (mutuallyExclusiveGroups && option.key) {
                    for (const group of mutuallyExclusiveGroups) {
                        if (group.includes(option.key)) {
                            mutuallyExclusiveWith = group.filter(k => k !== option.key)
                            break
                        }
                    }
                }

                return new Choice({
                    key: option.key,
                    title: option.title,
                    description: option.description,
                    icon: option.icon,
                    component: option.component,
                    customData: { option },
                    mutuallyExclusiveWith,
                    onSelect: async () => {
                        await this.onOptionSelected(option)
                    }
                })
            })
    }

    /**
     * 跳转到指定幕
     */
    goToScene(sceneKey: string): void {
        if (!this.isMultiScene) {
            console.warn("[EventRoom] 单幕事件不支持幕切换")
            return
        }

        const scene = this.eventConfig.scenes!.find(s => s.key === sceneKey)
        if (!scene) {
            console.error(`[EventRoom] 未找到幕: ${sceneKey}`)
            return
        }

        this._currentSceneKey = sceneKey
        this.currentTitle = scene.title
        this.currentDescription = scene.description
        newLog([`===== ${scene.title} =====`])
        if (scene.description) {
            newLog([scene.description])
        }

        // 如果是战斗场景，启动战斗
        if (scene.type === "battle" && scene.battle) {
            this.startBattleScene(scene.battle)
            return
        }

        // 文本场景：更新选项
        this.currentPhase = "event"

        // 清理当前选项
        this.choiceGroup.choices.splice(0, this.choiceGroup.choices.length)

        // 创建新幕的选项
        const newChoices = this.createChoicesFromOptions(scene.options, scene.mutuallyExclusiveGroups)
        newChoices.forEach(choice => this.choiceGroup.choices.push(choice))
    }

    /**
     * 启动战斗场景
     */
    private async startBattleScene(battleConfig: BattleSceneConfig): Promise<void> {
        this.currentBattleConfig = battleConfig
        this.currentPhase = "battle"

        newLog(["===== 战斗开始 ====="])

        // 加载敌人配置
        const enemyList = getLazyModule<EnemyMap[]>('enemyList')
        const enemyConfigs = battleConfig.enemies.map(key => {
            const config = enemyList.find((e: EnemyMap) => e.key === key)
            if (!config) {
                console.warn(`[EventRoom] 未找到敌人配置: ${key}`)
            }
            return config
        }).filter((c): c is EnemyMap => c !== undefined)

        // 创建敌人实例
        this.battleEnemies = await Promise.all(
            enemyConfigs.map(config => createEnemy(config))
        )

        newLog([`生成敌人: ${this.battleEnemies.map(e => e.label).join(", ")}`])

        // 启动战斗
        if (nowPlayerTeam.length === 0) {
            console.error("[EventRoom] 没有玩家队伍")
            return
        }

        await startNewBattle(nowPlayerTeam, this.battleEnemies)
    }

    /**
     * 处理战斗结束（由 UI 层调用）
     */
    async handleBattleEnd(result: "player_win" | "player_lose"): Promise<void> {
        const battleConfig = this.currentBattleConfig
        if (!battleConfig) return

        if (result === "player_win") {
            newLog(["===== 战斗胜利 ====="])

            // 显示奖励（如果配置了）
            if (battleConfig.rewards) {
                await this.showBattleRewards(battleConfig.rewards)
            }

            // 清理战斗状态
            await this.cleanupBattle()

            // 执行战斗后效果
            if (battleConfig.afterEffects && battleConfig.afterEffects.length > 0) {
                await executeEventEffects(battleConfig.afterEffects)
            }

            // 跳转到下一场景
            if (battleConfig.onWin) {
                this.goToScene(battleConfig.onWin)
            } else {
                // 没有下一幕，事件结束
                newLog(["===== 事件结束 ====="])
                await completeAndGoNext()
            }
        } else {
            newLog(["===== 战斗失败 ====="])

            // 清理战斗状态
            await this.cleanupBattle()

            if (battleConfig.onLose && battleConfig.onLose !== "gameOver") {
                // 跳转到失败场景
                this.goToScene(battleConfig.onLose)
            } else {
                // 游戏结束
                showBattleDefeat()
            }
        }
    }

    /**
     * 显示战斗奖励
     */
    private async showBattleRewards(rewardConfig: BattleRewardConfig): Promise<void> {
        const rewards = []

        // 金币奖励
        if (rewardConfig.gold) {
            const goldReward = rewardRegistry.createReward({
                type: "material",
                amount: rewardConfig.gold
            } as any)
            if (goldReward) rewards.push(goldReward)
        }

        // 遗物奖励
        if (rewardConfig.relics && rewardConfig.relics.length > 0) {
            const relicList = getLazyModule<any[]>('relicList')
            for (const relicConfig of rewardConfig.relics) {
                const filtered = relicList.filter((r: any) => r.rarity === relicConfig.rarity)
                if (filtered.length > 0) {
                    const randomRelic = filtered[Math.floor(Math.random() * filtered.length)]
                    const relicReward = rewardRegistry.createReward({
                        type: "relicSelect",
                        title: "选择遗物",
                        customData: {
                            relicOptions: [randomRelic],
                            selectCount: 1
                        }
                    })
                    if (relicReward) rewards.push(relicReward)
                }
            }
        }

        // 药水奖励
        if (rewardConfig.potions && rewardConfig.potions.length > 0) {
            const potionList = getLazyModule<any[]>('potionList')
            for (const potionConfig of rewardConfig.potions) {
                const filtered = potionList.filter((p: any) => p.rarity === potionConfig.rarity)
                if (filtered.length > 0) {
                    const randomPotion = filtered[Math.floor(Math.random() * filtered.length)]
                    const potionReward = rewardRegistry.createReward({
                        type: "potion",
                        potionConfig: randomPotion
                    })
                    if (potionReward) rewards.push(potionReward)
                }
            }
        }

        // 卡牌奖励（从指定卡池中选择）
        if (rewardConfig.cardPool && rewardConfig.cardPool.length > 0) {
            const cardList = getLazyModule<any[]>('cardList')
            const choices = rewardConfig.cardChoices ?? 3
            const poolCards = rewardConfig.cardPool
                .map(key => cardList.find((c: any) => c.key === key))
                .filter((c): c is any => c !== undefined)

            if (poolCards.length > 0) {
                const shuffled = [...poolCards].sort(() => Math.random() - 0.5)
                const selected = shuffled.slice(0, choices)
                // 使用 relicSelect 类型的模式展示卡牌选择（后续可扩展专用类型）
                const cardReward = rewardRegistry.createReward({
                    type: "relicSelect",
                    title: "选择卡牌",
                    customData: {
                        relicOptions: selected.map((c: any) => ({
                            key: c.key,
                            label: c.label,
                            description: c.describe?.join?.("") || ""
                        })),
                        selectCount: rewardConfig.cardPick ?? 1
                    }
                })
                if (cardReward) rewards.push(cardReward)
            }
        }

        if (rewards.length > 0) {
            const { showRewards } = await import("@/ui/hooks/interaction/rewardDisplay")
            await showRewards(rewards, "战斗胜利", "选择你的奖励", { navigate: false })
        }
    }

    /**
     * 清理战斗状态
     */
    private async cleanupBattle(): Promise<void> {
        // 清理 targetManager
        const { targetManager } = await import("@/ui/interaction/target/targetManager")
        this.battleEnemies.forEach(enemy => {
            targetManager.removeTarget(enemy)
        })

        // 清理全局战斗状态
        endNowBattle()

        // 清理本地状态
        this.battleEnemies = []
        this.currentBattleConfig = null
    }

    /**
     * 获取幕间共享数据
     */
    getSceneData(): Record<string, any> {
        return this.sceneData
    }

    /**
     * 进入事件房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog(["===== 事件 ====="])
        newLog([this.eventConfig.title])
        if (this.eventConfig.description) {
            newLog([this.eventConfig.description])
        }

        // 如果第一幕是战斗场景，直接启动战斗
        if (this.isMultiScene) {
            const firstScene = this.eventConfig.scenes![0]
            if (firstScene.type === "battle" && firstScene.battle) {
                this.startBattleScene(firstScene.battle)
            }
        }
    }

    /**
     * 处理事件房间
     * 等待玩家选择
     */
    async process(): Promise<void> {
        // 事件房间的处理由 UI 驱动
        // 玩家通过 UI 选择选项
    }

    /**
     * 完成事件房间
     */
    async complete(): Promise<void> {
        // 注意：不要在这里设置 state = "completed"
        // 让 GameRun.completeCurrentRoom() 来设置，以确保地图节点正确完成
        newLog(["===== 事件结束 ====="])

        // 清理所有选项
        this.choiceGroup.choices.splice(0, this.choiceGroup.choices.length)

        // 添加"离开"选项
        const leaveChoice = new Choice({
            title: "离开",
            description: "前往下一层",
            icon: "🚪",
            onSelect: async () => {
                await completeAndGoNext()
            }
        })
        this.choiceGroup.choices.push(leaveChoice)
    }

    /**
     * 离开事件房间
     */
    async exit(): Promise<void> {
        // 确保战斗状态被清理
        if (this.currentPhase === "battle") {
            await this.cleanupBattle()
        }
    }

    /**
     * 当选项被选择时
     */
    private async onOptionSelected(option: any): Promise<void> {
        newLog([`选择了: ${option.title}`])

        // 1. 保存数据到 sceneData（多幕事件）
        if (option.saveData) {
            await option.saveData(this.sceneData)
        }

        // 2. 执行简单效果（使用 eventEffectMap）
        if (option.effects && option.effects.length > 0) {
            await executeEventEffects(option.effects)
        }

        // 3. 执行自定义回调
        if (option.customCallback) {
            await option.customCallback(this.sceneData)
        }

        // 4. 如果有复杂交互组件，由 UI 层处理
        // 组件会通过 choice.component 传递给 ChoiceContainer

        // 5. 处理幕切换（多幕事件）
        if (this.isMultiScene) {
            if (option.nextScene) {
                // 有下一幕：延迟跳转
                setTimeout(() => {
                    this.goToScene(option.nextScene)
                }, 500)
            } else {
                // 没有下一幕：最后一幕，直接离开
                newLog(["===== 事件结束 ====="])
                await completeAndGoNext()
            }
        }
    }

    /**
     * 获取选项组
     */
    getChoiceGroup(): ChoiceGroup {
        return this.choiceGroup
    }

    /**
     * 获取自定义事件组件
     */
    getCustomComponent(): Component | string | undefined {
        return this.customComponent
    }

    getDisplayName(): string {
        return this.name || this.eventConfig.title || "事件"
    }

    getIcon(): string {
        return this.eventConfig.icon || "?"
    }
}
