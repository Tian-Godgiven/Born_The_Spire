import { Chara } from "./Target";
import type { CharaMap } from "./Target";
import { newLog } from "@/ui/hooks/global/log";
import { Card } from "../item/Subclass/Card";
import { getOrganModifier } from "../system/modifier/OrganModifier";
import { getCardByKey } from "@/static/list/item/cardList";
import { getCardModifier } from "../system/modifier/CardModifier";
import { cardsToIntent } from "../system/Intent";
import type { Intent, IntentType, IntentVisibility } from "../system/Intent";
import { doEvent } from "../system/ActionEvent";
import type { Player } from "./Player";
import { selectAction } from "../system/EnemyBehavior";
import type { EnemyBehaviorConfig } from "../system/EnemyBehavior";
import { isOrganDisabled } from "@/core/effects/organ/disableOrgan";

export type EnemyMap = CharaMap & {
    key:string
    status:Record<string,number|boolean>,
    behavior?: EnemyBehaviorConfig  // 敌人行为配置
    cards?: string[]  // 敌人专属卡牌（不通过器官提供）
}

export class Enemy extends Chara{
    public readonly targetType = 'enemy' as const  // 类型标识
    public intent?: Intent  // 当前意图（下回合要执行的行动）
    public _intentType?: IntentType  // 当前意图的声明类型（来自 BehaviorPattern）
    public _intentTarget?: any  // 意图的模拟目标（用于计算 target 端 buff）
    public behavior?: EnemyBehaviorConfig  // 敌人行为配置
    public exclusiveCards: string[] = []  // 敌人专属卡牌key列表

    // 双牌堆系统
    public drawPile: {
        actions: { card: Card, order: number, intent?: IntentType }[]
        junk: Card[]
    } = { actions: [], junk: [] }
    public hand: Card[] = []
    constructor(
        map:EnemyMap
    ){
        //默认有生命值和存活状态
        newLog(["创建了敌人",map])
        if(map.current){
            // 确保有 health
            if(!map.current.find((i: any)=>{
                return i === "health" || (typeof i === 'object' && i.key === "health");
            })){
                map.current.push("health")
            }
            // 确保有 isAlive
            if(!map.current.find((i: any)=>{
                return i === "isAlive" || (typeof i === 'object' && i.key === "isAlive");
            })){
                map.current.push("isAlive")
            }
        }
        else{
            map.current = ["health", "isAlive"]
        }
        super(map)

        // 初始化行为配置
        this.behavior = map.behavior

        // 初始化专属卡牌
        if (map.cards) {
            this.exclusiveCards = map.cards
        }
    }

    async initialize(): Promise<void> {
        await super.initialize()

        // 初始化专属卡牌到牌组
        if (this.exclusiveCards.length > 0) {
            const cardModifier = getCardModifier(this)
            await cardModifier.addCardsFromSource(this, this.exclusiveCards)
        }

        doEvent({
            key: "enemyCreation",
            source: this,
            medium: this,
            target: this,
            effectUnits: []
        })
    }

    /**
     * 获取敌人当前可用的卡牌列表
     *
     * 从 CardModifier 获取所有卡牌（包括器官提供的和专属卡牌）
     * 过滤掉被禁用器官提供的卡牌
     * 如果没有可用卡牌，返回兜底的"挣扎"卡牌
     * @returns 可用卡牌列表
     */
    async getAvailableCards(): Promise<Card[]> {
        const cardModifier = getCardModifier(this)
        const allCards = cardModifier.getAllCards()


        // 过滤掉被禁用器官提供的卡牌
        const availableCards = allCards.filter(card => {
            // 如果卡牌没有 source，认为是专属卡牌，允许使用
            if (!card.source) return true
            // 检查卡牌来源是否被禁用
            if (card.source && (card.source as any).targetType === 'organ' && isOrganDisabled(card.source as any)) {
                return false
            }
            return true
        })

        // 兜底机制：如果没有可用卡牌，使用"挣扎"
        if (availableCards.length === 0) {
            console.warn(`[Enemy.getAvailableCards] ${this.label} 没有可用卡牌，使用兜底"挣扎"`)
            try {
                const struggleCard = await getCardByKey("fallback_struggle")
                struggleCard.source = this
                struggleCard.owner = this
                return [struggleCard]
            } catch (error) {
                console.error(`[Enemy.getAvailableCards] 无法创建兜底卡牌:`, error)
                return []
            }
        }

        return availableCards
    }

    /**
     * 设置敌人的意图
     *
     * 根据选择的卡牌生成意图对象
     *
     * @param cards 要执行的卡牌列表
     * @param visibility 可见性等级（默认为 exact）
     */
    async setIntent(cards: Card[], visibility: IntentVisibility = "card", intentType?: IntentType, target?: Player) {
        this._intentType = intentType
        this._intentTarget = target
        this.intent = await cardsToIntent(cards, this, visibility, intentType, target)
        newLog(["敌人设置意图", this.label, this.intent])
    }

    /**
     * 更新敌人的意图
     *
     * 重新根据行为配置选择行动并更新意图
     * 用于在回合中动态改变意图（如形态转换）
     *
     * @param player 玩家
     * @param turnCount 当前回合数
     */
    async updateIntent(player: Player, turnCount: number) {
        if (!this.behavior) {
            console.warn(`[Enemy.updateIntent] 敌人 ${this.label} 没有行为配置`)
            return
        }

        const result = await selectAction(this.behavior, this, player, turnCount)

        if (result.cards.length > 0) {
            newLog(["敌人改变意图", this.label])
            await this.setIntent(result.cards, "card", result.intent, player)
        }
    }

    /**
     * 刷新意图的显示值
     *
     * 不重新选择卡牌，只根据当前 buff 状态重新计算 value
     * 用于敌人 buff 变化后更新意图显示（如力量变化）
     */
    async refreshIntent() {
        if (!this.intent || this.intent.actions.length === 0) return
        this.intent = await cardsToIntent(this.intent.actions, this, this.intent.visibility, this._intentType, this._intentTarget)
    }

    /**
     * 清除意图
     */
    clearIntent() {
        this.intent = undefined
    }

    /**
     * 获取当前意图
     */
    getIntent(): Intent | undefined {
        return this.intent
    }

    /**
     * 执行意图中的卡牌
     *
     * 敌人回合时，执行之前设置的意图中的所有卡牌
     *
     * @param target 目标（通常是玩家）
     */
    async executeIntent(target: Player) {
        if (!this.intent) {
            console.warn("[Enemy.executeIntent] 没有设置意图，无法执行")
            return
        }

        const cards = this.intent.actions

        if (cards.length === 0) {
            console.warn("[Enemy.executeIntent] 意图中没有卡牌")
            return
        }

        newLog(["敌人执行意图", this.label, `${cards.length}张卡牌`])

        // 依次执行每张卡牌
        for (const card of cards) {
            await this.playCard(card, target)
        }

        // 执行完成后清除意图
        this.clearIntent()
    }

    /**
     * 往抽牌堆里塞入一张垃圾牌
     */
    addJunkToDrawPile(card: Card): void {
        card.owner = this
        this.drawPile.junk.push(card)
    }

    /**
     * 从抽牌堆构建手牌
     *
     * 行动牌与垃圾牌合并后随机抽取 handSize 张：
     * 已抽到的行动牌按原始顺序排列，垃圾牌随机插入其中。
     * 未抽到的垃圾牌留在 drawPile.junk 等待下回合；行动牌清空（始终保留在 CardModifier）。
     *
     * @returns 已抽到的行动牌列表（含意图类型，用于设置意图）
     */
    buildHand(handSize: number): { card: Card, intent?: IntentType }[] {
        type ActionEntry = { card: Card, isAction: true, order: number, intent?: IntentType }
        type JunkEntry   = { card: Card, isAction: false }
        type Entry = ActionEntry | JunkEntry

        const pool: Entry[] = [
            ...this.drawPile.actions.map(a => ({ card: a.card, isAction: true as const, order: a.order, intent: a.intent })),
            ...this.drawPile.junk.map(j => ({ card: j, isAction: false as const }))
        ]

        // Fisher-Yates 洗牌
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]]
        }

        const drawn    = pool.slice(0, handSize)
        const notDrawn = pool.slice(handSize)

        // 未抽到的垃圾牌留待下回合；行动牌条目清空
        this.drawPile.junk    = notDrawn.filter((e): e is JunkEntry => !e.isAction).map(e => e.card)
        this.drawPile.actions = []

        // 抽到的行动牌按原始顺序排列
        const drawnActions = drawn
            .filter((e): e is ActionEntry => e.isAction)
            .sort((a, b) => a.order - b.order)

        const drawnJunk = drawn.filter(e => !e.isAction).map(e => e.card)

        // 将垃圾牌随机插入行动牌序列
        const finalHand: Card[] = drawnActions.map(e => e.card)
        for (const junkCard of drawnJunk) {
            const pos = Math.floor(Math.random() * (finalHand.length + 1))
            finalHand.splice(pos, 0, junkCard)
        }

        this.hand = finalHand
        return drawnActions.map(e => ({ card: e.card, intent: e.intent }))
    }

    /**
     * 按手牌顺序执行所有卡牌
     *
     * 有 use 交互的牌正常打出；无 use 交互的牌（A型垃圾）跳过。
     */
    async executeHandInOrder(target: Player): Promise<void> {
        for (const card of this.hand) {
            await this.playCard(card, target)
        }
    }

    /**
     * 回合结束后清空手牌
     */
    clearHandAfterTurn(): void {
        this.hand = []
    }

    /**
     * 敌人打出一张卡牌
     *
     * 敌人打出卡牌不需要支付能量，直接执行效果
     *
     * @param card 要打出的卡牌
     * @param target 目标
     */
    public async playCard(card: Card, target: Player) {
        // 检查卡牌来源的器官是否被禁用
        if (card.source && (card.source as any).targetType === 'organ' && isOrganDisabled(card.source as any)) {
            newLog(["敌人使用卡牌被禁用", this.label, card.label])
            return
        }

        newLog(["敌人使用卡牌", this.label, card.label])

        // 获取卡牌的使用效果
        const cardUse = card.getInteraction("use")
        if (!cardUse) {
            console.warn(`[Enemy.playCard] 卡牌 ${card.label} 没有使用效果`)
            return
        }

        const cardEffects = cardUse.effects
        if (!cardEffects || cardEffects.length === 0) {
            console.warn(`[Enemy.playCard] 卡牌 ${card.label} 没有效果`)
            return
        }

        // 确定目标
        const targets = this.resolveTargets(cardUse.target, target)

        // 创建使用卡牌事件
        doEvent({
            key: "useCard",
            source: this,
            medium: card,
            target: targets,
            effectUnits: cardEffects
        })
    }

    /**
     * 解析卡牌目标
     *
     * 根据卡牌的目标配置，确定实际目标
     *
     * @param targetConfig 目标配置
     * @param defaultTarget 默认目标（玩家）
     * @returns 目标数组
     */
    private resolveTargets(targetConfig: any, defaultTarget: Player): Player[] {
        // 如果没有配置，默认目标是玩家
        if (!targetConfig) {
            return [defaultTarget]
        }

        // 根据 faction 确定目标
        if (targetConfig.faction === "player" || targetConfig.faction === "enemy") {
            return [defaultTarget]
        }

        // 如果是 self，目标是自己
        if (targetConfig.key === "self") {
            return [this as any]  // 敌人自己作为目标
        }

        // 默认返回玩家
        return [defaultTarget]
    }
}