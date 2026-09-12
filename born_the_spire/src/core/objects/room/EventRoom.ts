/**
 * 事件房间（重构版）
 * 支持从配置列表加载事件，支持原子效果和复杂交互
 * 支持嵌入战斗场景
 */

import { Room } from "./Room"
import type { RoomConfig } from "./Room"
import { Choice, ChoiceGroup } from "../system/Choice"
import type { EventMap, EventSceneMap, BattleSceneConfig, BattleRewardConfig } from "@/core/types/EventMapData"
import type { EventEffectUnit, EventSceneApplyOffer } from "@/core/types/EventSceneProps"
import { executeEventEffect, executeEventEffects } from "@/static/list/room/event/eventEffectMap"
import { newLog } from "@/ui/hooks/global/log"
import { markRaw, reactive, nextTick, type Component } from "vue"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { openMapToLeave, finishRoomAndOpenMap } from "@/core/hooks/step"
import { settings } from "@/core/persistence/settings"
import { isAnimationCategoryEnabled } from "@/ui/animation/categories"
import { startNewBattle, nowPlayerTeam, endNowBattle } from "../game/battle"
import type { Enemy } from "../target/Enemy"
import type { EnemyMap } from "../target/Enemy"
import { createEnemy } from "@/core/factories"
import { rewardRegistry } from "@/static/registry/rewardRegistry"
import { nowPlayer } from "../game/run"
import { showBattleDefeat } from "@/ui/hooks/interaction/battleDefeat"
import { checkCondition, type Condition } from "@/core/types/ConditionSystem"
import { drawItems } from "@/core/hooks/draw"
import type { DrawItemType } from "@/core/hooks/draw"

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
    public customComponent?: Component | string  // 事件顶层插页组件（正文和选项之间）

    // 多幕事件相关
    private isMultiScene: boolean = false       // 是否为多幕事件
    private _currentSceneKey: string | null = null  // 当前幕的 key
    private sceneData: Record<string, any> = reactive({})     // 幕间共享数据（reactive：幕级组件能盯着点数/奖惩变）

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
            this.currentDescription = this.resolveDescription(firstScene)
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
            })
        }
    }

    /**
     * 解析幕描述：字符串直接返回；函数则以当前 sceneData 求值
     */
    private resolveDescription(scene: EventSceneMap): string {
        return typeof scene.description === "function"
            ? scene.description(this.sceneData)
            : scene.description
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
            description: this.resolveDescription(scene),
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
                // ifShow：不满足则不显示
                if (option.ifShow) {
                    return option.ifShow(this.sceneData)
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

                const peek = this.isPeekLeave(option)
                const sceneAble = typeof option.ifAble === "function"
                    ? option.ifAble as (sceneData: any) => boolean
                    : undefined
                const choice = new Choice({
                    key: option.key,
                    title: option.title,
                    description: typeof option.description === "function"
                        ? () => option.description(this.sceneData)
                        : option.description,
                    icon: option.icon,
                    component: option.component,
                    customData: { option },
                    mutuallyExclusiveWith,
                    repeatable: peek,
                    ifAble: sceneAble
                        ? () => sceneAble(this.sceneData)
                        : undefined,
                    onSelect: async () => {
                        await this.onOptionSelected(option)
                    }
                })

                // 字符串条件 ifAble：创建时检查一次，不满足则置灰
                if (option.ifAble && !sceneAble) {
                    const context = { owner: nowPlayer, item: nowPlayer } as any
                    if (!checkCondition(option.ifAble as Condition, context)) {
                        choice.disable()
                    }
                }

                return choice
            })
    }

    /**
     * 跳转到指定幕
     */
    async goToScene(sceneKey: string): Promise<void> {
        if (!this.isMultiScene) {
            console.warn("[EventRoom] 单幕事件不支持幕切换")
            return
        }

        const scene = this.eventConfig.scenes!.find(s => s.key === sceneKey)
        if (!scene) {
            console.error(`[EventRoom] 未找到幕: ${sceneKey}`)
            return
        }

        if (scene.onEnter) {
            await scene.onEnter(this.sceneData)
        }

        this._currentSceneKey = sceneKey
        this.currentTitle = scene.title
        const resolvedDesc = this.resolveDescription(scene)
        this.currentDescription = resolvedDesc
        newLog([`===== ${scene.title} =====`])
        if (resolvedDesc) {
            newLog([resolvedDesc])
        }

        // 如果是战斗场景，启动战斗
        if (scene.type === "battle" && scene.battle) {
            this.startBattleScene(scene.battle)
            return
        }

        this.currentPhase = "event"
        this.replaceSceneChoices(scene)
    }

    private replaceSceneChoices(scene: EventSceneMap): void {
        this.choiceGroup.choices.splice(0, this.choiceGroup.choices.length)
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
                await this.goToScene(battleConfig.onWin)
            } else {
                // 没有下一幕：打开地图离开，不立刻 complete
                newLog(["===== 事件结束 ====="])
                await finishRoomAndOpenMap()
            }
        } else {
            newLog(["===== 战斗失败 ====="])

            // 清理战斗状态
            await this.cleanupBattle()

            if (battleConfig.onLose && battleConfig.onLose !== "gameOver") {
                // 跳转到失败场景
                await this.goToScene(battleConfig.onLose)
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
                        relicOptions: [randomRelic],
                        selectCount: 1
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
                    relicOptions: selected.map((c: any) => ({
                        key: c.key,
                        label: c.label,
                        description: c.describe?.join?.("") || ""
                    })),
                    selectCount: rewardConfig.cardPick ?? 1
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

        // 事件级 onEnter 钩子：用于预 pick / 掷骰等一次性写入 sceneData
        if (this.eventConfig.onEnter) {
            await this.eventConfig.onEnter(this.sceneData)
        }

        if (this.isMultiScene) {
            const firstScene = this.eventConfig.scenes![0]
            if (firstScene.onEnter) {
                await firstScene.onEnter(this.sceneData)
            }
            // 构造时 sceneData 还是空的。onEnter 写完再画正文和选项，
            // 否则 ifShow 依赖预 pick 的选项会整场藏起来（收藏家「瞧不上你」）。
            this.currentDescription = this.resolveDescription(firstScene)
            this.replaceSceneChoices(firstScene)
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
        const peek = this.isPeekLeave(option)
        await this.apply({
            saveData: option.saveData,
            effects: option.effects,
            afterEffects: option.afterEffects,
            rewards: option.rewards,
            customCallback: option.customCallback,
            nextScene: option.nextScene,
            openMap: peek,
            leave: !option.nextScene && !peek,
        })
    }

    /**
     * 选项链和自定义组件共用的结算入口。
     */
    async apply(offer: EventSceneApplyOffer): Promise<void> {
        if (offer.saveData) {
            await offer.saveData(this.sceneData)
        }

        if (offer.effects && offer.effects.length > 0) {
            await this.runEffects(offer.effects)
        }

        if (offer.rewards && offer.rewards.length > 0) {
            const resolvedConfigs = offer.rewards.map((config: any) => {
                if (config.draw) {
                    const drawn = drawItems(
                        config.type.replace("Select", "") as DrawItemType,
                        config.draw.count ?? 3,
                        config.draw
                    )
                    const optionsKey = config.type.replace("Select", "") + "Options"
                    return { ...config, [optionsKey]: drawn, draw: undefined }
                }
                return config
            })
            const rewards = rewardRegistry.createRewards(resolvedConfigs)
            if (rewards.length > 0) {
                const { showRewards } = await import("@/ui/hooks/interaction/rewardDisplay")
                await showRewards(rewards, this.currentTitle, undefined, { navigate: false })
            }
        }

        let dynamicNextScene: string | undefined
        if (offer.customCallback) {
            const result = await offer.customCallback(this.sceneData, this)
            if (typeof result === "string") dynamicNextScene = result
        }

        const nextScene = dynamicNextScene ?? offer.nextScene

        if (this.isMultiScene && nextScene) {
            if (nextScene !== this._currentSceneKey) {
                this.lockOfferChoices()
            }
            await this.wait(500)
            await this.goToScene(nextScene)
            await this.runAfterEffects(offer)
            return
        }

        await this.runAfterEffects(offer)

        if (offer.leave) {
            await this.leave()
            return
        }

        if (offer.openMap) {
            await this.openMap()
        }
    }

    async selectChoice(choice: Choice): Promise<void> {
        await this.choiceGroup.selectChoice(choice)
    }

    async runEffect(key: string, params?: any): Promise<any> {
        return executeEventEffect(key, this.bindEffectParams(params))
    }

    async runEffects(effects: EventEffectUnit[]): Promise<void> {
        for (const effect of effects) {
            await executeEventEffect(effect.key, this.bindEffectParams(effect.params))
        }
    }

    private async runAfterEffects(offer: EventSceneApplyOffer): Promise<void> {
        if (!offer.afterEffects?.length) return
        await nextTick()
        await this.runEffects(offer.afterEffects)
    }

    /** 锁选项并开地图（成交离开） */
    async leave(): Promise<void> {
        this.lockOfferChoices()
        await openMapToLeave()
    }

    /** 只开地图，不锁选项 */
    async openMap(): Promise<void> {
        await openMapToLeave()
    }

    /** 等待。跳过动画 / 关掉 ui 类别时立刻结束；时长跟 animationSpeed */
    wait(ms: number): Promise<void> {
        if (settings.skipAnimation === true || !isAnimationCategoryEnabled("ui")) {
            return Promise.resolve()
        }
        const speed = Number(settings.animationSpeed)
        const wait = ms / (Number.isFinite(speed) && speed > 0 ? speed : 1)
        if (wait <= 0) return Promise.resolve()
        return new Promise(resolve => setTimeout(resolve, wait))
    }

    private bindEffectParams(params?: any): any {
        return {
            sceneData: this.sceneData,
            ...(params ?? {}),
            data: params?.data ?? this.sceneData,
        }
    }

    /** 「无视他」这类：只开地图，成交过的选项不能再选 */
    private isPeekLeave(option: any): boolean {
        if (option.openMap) return true
        if (option.nextScene) return false
        if (option.rewards?.length) return false
        if (option.afterEffects?.length) return false
        if (option.customCallback) return false
        if (option.component) return false
        const effects = option.effects ?? []
        return effects.length === 0 || effects.every((e: { key: string }) => e.key === "nothing")
    }

    private lockOfferChoices(): void {
        this.lockInteraction()
        for (const choice of this.choiceGroup.choices) {
            if (choice.state !== "selected") choice.disable()
        }
    }

    /**
     * 获取选项组
     */
    getChoiceGroup(): ChoiceGroup {
        return this.choiceGroup
    }

    get currentSceneKey(): string | null {
        return this._currentSceneKey
    }

    getCurrentScene(): EventSceneMap | undefined {
        if (!this.isMultiScene || !this._currentSceneKey) return undefined
        return this.eventConfig.scenes!.find(s => s.key === this._currentSceneKey)
    }

    /**
     * 幕级整页组件。有则 EventRoom.vue 不再画默认标题/正文/选项。
     */
    getSceneComponent(): Component | string | undefined {
        const component = this.getCurrentScene()?.component
        return component ? markRaw(component as Component) : undefined
    }

    /**
     * 事件顶层插页组件（夹在正文和选项之间）
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
