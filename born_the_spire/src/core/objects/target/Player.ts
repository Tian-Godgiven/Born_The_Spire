import { Card, drawCardFromDrawPile } from "../item/Subclass/Card";
import type { Potion } from "../item/Subclass/Potion"
import type { Relic } from "../item/Subclass/Relic"
import { PlayerMap } from "@/static/list/target/playerList";
import { getPotionByKey } from "@/static/list/item/potionList";
import { nanoid } from "nanoid";
import { Chara } from "./Target";
import { Entity } from "../system/Entity";
import { washPile } from "@/core/effects/card";
import { reactive } from "vue";
import { getReserveModifier } from "../system/modifier/ReserveModifier";
import { getStatusValue } from "../system/status/Status";
import { getPotionModifier } from "../system/modifier/PotionModifier";
import { getCardModifier } from "../system/modifier/CardModifier";
import { doEvent } from "../system/ActionEvent";

export type CardPiles = {
    handPile:Card[],
    drawPile:Card[],
    discardPile:Card[],
    exhaustPile:Card[]
}

// 每一局游戏中，玩家扮演的角色
export class Player extends Chara{
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
    public relics:Relic[] = []//拥有的遗物
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
    }
    
    //获取自身
    getSelf(){
        return this
    }
    //获取药水,一次一瓶
    getPotion(potionKey:string){
        const maxNum = getStatusValue(this, "max-potion")
        const potionModifier = getPotionModifier(this)
        const nowNum = potionModifier.getPotions().length
        if(nowNum >= maxNum){
            return false
        }
        else{
            //获取药水对象的数据
            const potion = getPotionByKey(potionKey)
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
    startBattle(){
        //清理所有可清理的属性修饰器（双重保险，防止异常残留）
        for(const statusKey in this.status){
            this.status[statusKey].clearClearableModifiers()
        }

        //初始化牌堆:洗牌+清空牌堆
        this.initCardPile()
        //初始化状态：清空状态栏
        this.initState()
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
    //初始化状态
    initState(){
        this.state = []
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
        return this.relics
    }
    //获取当前持有的卡牌
    getCardGroup(){
        const cardModifier = getCardModifier(this)
        return cardModifier.getAllCards()
    }
}



