import { EnemyMap } from "@/static/list/target/enemyList";
import { Chara } from "./Target";
import { newLog } from "@/ui/hooks/global/log";
import { Card } from "../item/Subclass/Card";
import { getOrganModifier } from "../system/modifier/OrganModifier";
import { getCardByKey } from "@/static/list/item/cardList";
import { Intent, cardsToIntent, IntentVisibility } from "../system/Intent";
import { doEvent } from "../system/ActionEvent";
import { Player } from "./Player";
import { EnemyBehaviorConfig, selectAction } from "../system/EnemyBehavior";

export class Enemy extends Chara{
    public intent?: Intent  // 当前意图（下回合要执行的行动）
    public behavior?: EnemyBehaviorConfig  // 敌人行为配置
    constructor(
        map:EnemyMap
    ){
        //默认有生命值和存活状态
        newLog(["创建了敌人",map])
        if(map.current){
            // 确保有 health
            if(!map.current.find(i=>{
                return i === "health" || (typeof i === 'object' && i.key === "health");
            })){
                map.current.push("health")
            }
            // 确保有 isAlive
            if(!map.current.find(i=>{
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
    }

    /**
     * 获取敌人当前可用的卡牌列表
     *
     * 从所有器官获取卡牌，过滤掉损坏器官提供的卡牌
     * @returns 可用卡牌列表
     */
    getAvailableCards(): Card[] {
        const organModifier = getOrganModifier(this)
        const organs = organModifier.getOrgans()

        const availableCards: Card[] = []

        for (const organ of organs) {
            // 跳过损坏的器官
            if (organ.isDisabled || organ.isBroken) {
                continue
            }

            // 获取器官提供的卡牌
            if (organ.cards && organ.cards.length > 0) {
                for (const cardKey of organ.cards) {
                    try {
                        const card = getCardByKey(cardKey)
                        // 设置卡牌来源
                        card.source = organ
                        card.owner = this
                        availableCards.push(card)
                    } catch (error) {
                        console.warn(`[Enemy.getAvailableCards] 无法创建卡牌 ${cardKey}:`, error)
                    }
                }
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
    setIntent(cards: Card[], visibility: IntentVisibility = "exact") {
        this.intent = cardsToIntent(cards, this, visibility)
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
    updateIntent(player: Player, turnCount: number) {
        if (!this.behavior) {
            console.warn(`[Enemy.updateIntent] 敌人 ${this.label} 没有行为配置`)
            return
        }

        const selectedCards = selectAction(this.behavior, this, player, turnCount)

        if (selectedCards.length > 0) {
            newLog(["敌人改变意图", this.label])
            this.setIntent(selectedCards)
        }
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
     * 敌人打出一张卡牌
     *
     * 敌人打出卡牌不需要支付能量，直接执行效果
     *
     * @param card 要打出的卡牌
     * @param target 目标
     */
    private async playCard(card: Card, target: Player) {
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