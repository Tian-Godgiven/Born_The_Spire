import { Chara } from "./Target";
import type { CharaMap } from "./Target";
import { newLog } from "@/ui/hooks/global/log";
import { Card } from "../item/Subclass/Card";
import { getOrganModifier } from "../system/modifier/OrganModifier";
import { getCardByKey } from "@/static/list/item/cardList";
import { getCardModifier } from "../system/modifier/CardModifier";
import { cardsToIntent } from "../system/Intent";
import type { Intent, IntentType, IntentVisibility } from "../system/Intent";
import { doEvent, ActionEvent } from "../system/ActionEvent";
import { selectAction, selectTurnActions } from "../system/EnemyBehavior";
import type { EnemyBehaviorConfig } from "../system/EnemyBehavior";
import { isOrganDisabled } from "@/core/effects/organ/disableOrgan";
import { nowBattle } from "../game/battle";
import { getCurrentValue } from "../system/Current/current";
import { getStatusValue } from "../system/status/Status";
import { beginTransaction, endTransaction } from "../game/transaction";
import type { EffectUnit } from "../system/effect/EffectUnit";

export type EnemyUiSize = "small" | "normal" | "big"

export type EnemyMap = CharaMap & {
    key:string
    status:Record<string,number|boolean>,
    behavior?: EnemyBehaviorConfig  // 敌人行为配置
    cards?: string[]  // 敌人专属卡牌（不通过器官提供）
    uiSize?: EnemyUiSize  // 战斗卡片尺寸，一般在 battleList 的这场实例上写，省略则 normal
}

const DEFAULT_MAX_ENERGY = 3

const DEFAULT_ENERGY_REACTION = {
    recoverEnergy: [{
        key: "turnStart_recoverEnergy",
        label: "回合开始时恢复能量",
        effect: [{ key: "refillEnergy", params: {} }],
        targetType: "creatorOwner" as const,
    }],
    emptyEnergy: [{
        key: "turnEnd_emptyEnergy",
        label: "回合结束时清空能量",
        effect: [{ key: "emptyEnergy", params: {} }],
        targetType: "creatorOwner" as const,
    }],
}

function hasCurrentKey(current: EnemyMap["current"], key: string) {
    return !!current?.find((i: any) => i === key || (typeof i === "object" && i.key === key))
}

export class Enemy extends Chara{
    public readonly targetType: 'enemy' | 'companion' = 'enemy'  // 类型标识
    public intent?: Intent  // 当前意图（下回合要执行的行动）
    public _intentType?: IntentType | (IntentType | undefined)[]  // 声明的意图类型（单招或多张各一）
    public _intentTarget?: any  // 意图的模拟目标（用于计算 target 端 buff）
    public behavior?: EnemyBehaviorConfig  // 敌人行为配置
    public exclusiveCards: string[] = []  // 敌人专属卡牌key列表
    public aiCursor: number = 0  // 剧本 / loop 序列指针，存在实例上以免改到共享配置
    public uiSize: EnemyUiSize = "normal"

    // 双牌堆系统
    public drawPile: {
        actions: { card: Card, order: number, intent?: IntentType }[]
        junk: Card[]
    } = { actions: [], junk: [] }
    public hand: Card[] = []
    /** 敌人没有弃牌循环；消耗牌保存在这里，取回后重新可用。 */
    public exhaustPile: Card[] = []
    constructor(
        map:EnemyMap
    ){
        //默认有生命、能量、存活
        newLog(["创建了敌人",map])
        if (map.status["max-energy"] === undefined) {
            map.status["max-energy"] = DEFAULT_MAX_ENERGY
        }
        if (!map.current) {
            map.current = ["health", "energy", "isAlive"]
        } else {
            if (!hasCurrentKey(map.current, "health")) map.current.push("health")
            if (!hasCurrentKey(map.current, "energy")) map.current.push("energy")
            if (!hasCurrentKey(map.current, "isAlive")) map.current.push("isAlive")
        }
        map.reaction = {
            ...DEFAULT_ENERGY_REACTION,
            ...map.reaction,
        }
        super(map)

        // 初始化行为配置
        this.behavior = map.behavior

        // 初始化专属卡牌
        if (map.cards) {
            this.exclusiveCards = map.cards
        }

        this.uiSize = map.uiSize ?? "normal"
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
            if (this.exhaustPile.includes(card)) return false
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
    async setIntent(
        cards: Card[],
        visibility: IntentVisibility = "card",
        intentType?: IntentType | (IntentType | undefined)[],
        target?: Chara
    ) {
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
    async updateIntent(player: Chara, turnCount: number) {
        if (!this.behavior) {
            console.warn(`[Enemy.updateIntent] 敌人 ${this.label} 没有行为配置`)
            return
        }

        const result = this.behavior.moves?.list?.length
            ? await selectTurnActions(this.behavior, this, player as any, turnCount)
            : await selectAction(this.behavior, this, player as any, turnCount)

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
    async executeIntent(target: Chara) {
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

        const playedCards = new Set<Card>()
        // 依次执行每张卡牌
        for (const card of cards) {
            if (await this.playCard(card, target)) playedCards.add(card)
        }

        // 脚本意图可能绕过 hand 执行，但消耗语义仍须一致。
        for (const card of playedCards) {
            if (card.hasEntry("card_exhaust")) this.exhaustCard(card)
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
    async executeHandInOrder(target: Chara): Promise<void> {
        const playedCards = new Set<Card>()
        for (const card of this.hand) {
            if (await this.playCard(card, target)) playedCards.add(card)
        }

        for (const card of this.hand) {
            if ((playedCards.has(card) && card.hasEntry("card_exhaust")) ||
                (!playedCards.has(card) && card.hasEntry("card_void"))) {
                this.exhaustCard(card)
            }
        }
    }

    /**
     * 回合结束后清空手牌
     */
    clearHandAfterTurn(): void {
        this.hand = []
    }

    exhaustCard(card: Card): boolean {
        if (this.exhaustPile.includes(card)) return false
        this.exhaustPile.push(card)
        return true
    }

    retrieveFromExhaust(card: Card): boolean {
        const index = this.exhaustPile.indexOf(card)
        if (index < 0) return false
        this.exhaustPile.splice(index, 1)
        return true
    }

    /**
     * 敌人打出一张卡牌
     *
     * 和玩家一样支付能量；费用不足则打不出。
     *
     * @param card 要打出的卡牌
     * @param target 目标
     */
    public async playCard(card: Card, target: Chara): Promise<boolean> {
        // 检查卡牌来源的器官是否被禁用
        if (card.source && (card.source as any).targetType === 'organ' && isOrganDisabled(card.source as any)) {
            newLog(["敌人使用卡牌被禁用", this.label, card.label])
            return false
        }

        const cardUse = card.getInteraction("use")
        if (!cardUse) {
            console.warn(`[Enemy.playCard] 卡牌 ${card.label} 没有使用效果`)
            return false
        }

        const cardEffects = cardUse.effects
        if (!cardEffects || cardEffects.length === 0) {
            console.warn(`[Enemy.playCard] 卡牌 ${card.label} 没有效果`)
            return false
        }

        const cardCost = getStatusValue(card, "cost") ?? 0
        const costEffect: EffectUnit = {
            key: "payEnergy",
            describe: [`支付${cardCost}点能量`],
            params: { value: cardCost },
            resultStoreAs: "payEnergyResult"
        }
        const tx = beginTransaction()
        const payEvent = new ActionEvent(
            "payEnergy",
            this,
            card,
            this,
            {},
            [costEffect]
        )
        tx.add(payEvent)
        await endTransaction()
        if (!payEvent.getEventResult("payEnergyResult")) {
            newLog([this, "能量不足，无法打出", card])
            return false
        }

        newLog(["敌人使用卡牌", this.label, card.label])

        const targets = this.resolveTargets(cardUse.target, target)

        await doEvent({
            key: "useCard",
            source: this,
            medium: card,
            target: targets,
            effectUnits: cardEffects
        })

        return true
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
    private resolveTargets(targetConfig: any, defaultTarget: Chara): any[] {
        // 如果没有配置，默认目标是玩家
        if (!targetConfig) {
            return [defaultTarget]
        }

        if (targetConfig.faction === "all") {
            const battle = nowBattle.value
            if (!battle) return [defaultTarget]
            const players = battle.getAlivePlayerTeam()
            const enemies = battle.getAliveEnemies()
            if (targetConfig.number === "all") {
                return [...players, ...enemies]
            }
            // 点选一张：AI 给自己或友军里血最低的奶
            if (enemies.length === 0) return [this]
            let lowest = enemies[0]
            for (const ally of enemies) {
                if (getCurrentValue(ally as any, "health") < getCurrentValue(lowest as any, "health")) {
                    lowest = ally
                }
            }
            return [lowest]
        }

        // 根据 faction 确定目标
        if (targetConfig.faction === "player" || targetConfig.faction === "enemy") {
            return [defaultTarget]
        }

        // 如果是 self，目标是自己
        if (targetConfig.key === "self") {
            return [this as any]
        }

        // 默认返回玩家
        return [defaultTarget]
    }
}
