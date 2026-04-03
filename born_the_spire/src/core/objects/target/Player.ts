import type { Potion } from "../item/Subclass/Potion"
import type { Relic } from "../item/Subclass/Relic"
import type { Card } from "../item/Subclass/Card";
import type { CharaMap } from "./Target";
import type { Entity } from "../system/Entity";
import { getStateModifier } from "../system/modifier/StateModifier";



import { drawCardFromDrawPile } from "../item/Subclass/Card";
import { getPotionModifier } from "../system/modifier/PotionModifier";
import { getCardModifier } from "../system/modifier/CardModifier";
import { getRelicModifier } from "../system/modifier/RelicModifier";
import { washPile } from "@/core/effects/card";
import { Chara } from "./Target";

import { getReserveModifier } from "../system/modifier/ReserveModifier";
import { getStatusValue } from "../system/status/Status";

import { nanoid } from "nanoid";
import { reactive } from "vue";
import { getPotionByKey } from "@/static/list/item/potionList";
import { handleBattleStart, handleBattleEnd } from "@/core/hooks/activeAbility";
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier";

export type PlayerMap = CharaMap & {
    key:string
    reserves?:Record<string,number>,  // 储备（金钱等）
    potion:{
        now:string[]  // 初始拥有的药水
    }
    organ:string[]
    card:string[],
    relic?:string[]  // 初始拥有的遗物
}

export type CardPiles = {
    handPile:Card[],
    drawPile:Card[],
    discardPile:Card[],
    exhaustPile:Card[]
}
// 每一局游戏中，玩家扮演的角色
export class Player extends Chara{
    public readonly targetType = 'player' as const  // 类型标识
    //唯一键
    public readonly __key:string = nanoid()
    //当前的各个卡组的情况
    public cardPiles:CardPiles = reactive({
        handPile:[],
        drawPile:[],
        discardPile:[],
        exhaustPile:[]
    })
    //药水的持有情况 - 通过 PotionModifier 管理，这里不需要存储
    // public potions - 已移除，使用 getPotionModifier(this).getPotions() 获取
    // 启用的器官奖励动作（由遗物等解锁）
    public enabledOrganRewardActions: Set<string> = new Set()
    // 启用的水池行动（由遗物等解锁）
    public enabledPoolActions: Set<string> = new Set()
    constructor(map:PlayerMap){
        super(map)

        //玩家特有内容的初始化

        // 初始化储备（金钱等）
        if(map.reserves) {
            const reserveModifier = getReserveModifier(this)
            for(const [reserveKey, amount] of Object.entries(map.reserves)) {
                reserveModifier._setReserve(reserveKey, amount)
            }
        }

        const potion = map.potion
        // 药水最大数量现在由 status["max-potion"] 控制
        for(let key of potion.now){
            //获取初始药水
            this.getPotion(key)
        }

        //获取初始拥有的卡组（来源是玩家自身）
        const cardModifier = getCardModifier(this)
        cardModifier.addCardsFromSource(this, map.card)

        //获取初始拥有的遗物
        if(map.relic && map.relic.length > 0) {
            const relicModifier = getRelicModifier(this)
            relicModifier.acquireRelicsFromKeys(map.relic, this)
        }
    }
    
    //获取自身
    getSelf(){
        return this
    }
    //获取药水,一次一瓶
    async getPotion(potionKey:string){
        const maxNum = getStatusValue(this, "max-potion")
        const potionModifier = getPotionModifier(this)
        const nowNum = potionModifier.getPotions().length
        if(nowNum >= maxNum){
            return false
        }
        else{
            //获取药水对象的数据
            const potion = await getPotionByKey(potionKey)
            // 使用 PotionModifier 系统添加药水
            potionModifier.acquirePotion(potion, this)
            return true
        }
    }
    //获取卡牌
    getCard(cardKey:string){
        // 使用 CardModifier 添加卡牌
        const cardModifier = getCardModifier(this)
        cardModifier.addCardsFromSource(this, [cardKey])
    }

    //战斗开始
    async startBattle(){
        //清理所有可清理的属性修饰器（双重保险，防止异常残留）
        for(const statusKey in this.status){
            this.status[statusKey].clearClearableModifiers()
        }

        //初始化牌堆:洗牌+清空牌堆
        this.initCardPile()
        //初始化状态：清空状态栏
        this.initState()

        // 处理主动能力系统的战斗开始
        await this.handleActiveAbilitiesBattleStart()
    }
    //从抽牌堆中抽牌
    drawCard(number:number,medium:Entity){
        drawCardFromDrawPile(this,number,medium)
    }
    //指定的牌堆洗牌
    washCardPile(pileName:keyof CardPiles){
        const cardPiles = this.cardPiles[pileName];
        washPile(cardPiles)
    }
    //填充弃牌堆全部进入抽牌堆
    fillDrawPile(){
        const cards = this.cardPiles.discardPile;
        this.cardPiles.drawPile.push(...cards)
        this.cardPiles.discardPile.length = 0
        //洗牌
        this.washCardPile("drawPile")
    }
    //初始化牌堆，将卡组内的卡牌洗进抽牌堆
    initCardPile(){
        //从 CardModifier 获取所有卡牌
        const cardModifier = getCardModifier(this)
        const cards = cardModifier.getAllCards()

        //洗抽牌堆 - 清空后 push，而不是直接赋值
        this.cardPiles.drawPile.length = 0
        this.cardPiles.drawPile.push(...cards)

        this.washCardPile("drawPile")

        //其他牌堆清空
        this.cardPiles.discardPile = []
        this.cardPiles.exhaustPile = []
        this.cardPiles.handPile = []
    }
    //初始化状态（通过 StateModifier 清空所有状态）
    initState(){
        const stateModifier = getStateModifier(this)
        // 获取所有状态key并逐个移除
        const allStates = stateModifier.getAllStates()
        for (const state of [...allStates]) {
            stateModifier.removeState(state.key, false)
        }
    }

    //获取药水列表（用于 UI 显示，包含空槽位）
    getPotionList(){
        const potionModifier = getPotionModifier(this)
        const currentPotions = potionModifier.getPotions()
        const maxPotions = getStatusValue(this, "max-potion")

        const list:(Potion|null)[] = [...currentPotions]
        while (list.length < maxPotions) {
            list.push(null);
        }
        return list
    }
    //获取遗物列表
    getRelicsList(){
        const relicModifier = getRelicModifier(this)
        return relicModifier.getRelics()
    }
    //获取当前持有的卡牌
    getCardGroup(){
        const cardModifier = getCardModifier(this)
        return cardModifier.getAllCards()
    }

    /**
     * 处理主动能力系统的战斗开始
     */
    private async handleActiveAbilitiesBattleStart() {
        // 处理器官的主动能力
        const organModifier = getOrganModifier(this)
        const organs = organModifier.getOrgans()

        for (const organ of organs) {
            if (organ.activeAbilities) {
                handleBattleStart(organ, organ.activeAbilities)
            }
        }

        // 处理遗物的主动能力
        const relicModifier = getRelicModifier(this)
        const relics = relicModifier.getRelics()

        for (const relic of relics) {
            if (relic.activeAbilities) {
                handleBattleStart(relic, relic.activeAbilities)
            }
        }
    }

    /**
     * 处理主动能力系统的战斗结束
     */
    async handleActiveAbilitiesBattleEnd() {
        // 处理器官的主动能力
        const organModifier = getOrganModifier(this)
        const organs = organModifier.getOrgans()

        for (const organ of organs) {
            if (organ.activeAbilities) {
                handleBattleEnd(organ, organ.activeAbilities)
            }
        }

        // 处理遗物的主动能力
        const relicModifier = getRelicModifier(this)
        const relics = relicModifier.getRelics()

        for (const relic of relics) {
            if (relic.activeAbilities) {
                handleBattleEnd(relic, relic.activeAbilities)
            }
        }
    }
}