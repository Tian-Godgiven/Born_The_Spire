import { Card, drawCardFromDrawPile } from "../item/Subclass/Card";
import type { Potion } from "../item/Subclass/Potion"
import type { Relic } from "../item/Subclass/Relic"
import { PlayerMap } from "@/static/list/target/playerList";
import { getPotionByKey } from "@/static/list/item/potionList";
import { nanoid } from "nanoid";
import { Chara } from "./Target";
import { getCardByKey } from "@/static/list/item/cardList";
import { getMoneyByKey, Money } from "@/static/list/item/moneyList";
import { Entity } from "../system/Entity"; 
import { washPile } from "@/core/effects/card";
import { reactive } from "vue";

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
    //药水的持有情况
    public potions:{max:number,now:Potion[]} = {
        max:0,
        now:[]
    }
    public cards:Card[]  // 不要在这里初始化！
    public relics:Relic[] = []//拥有的遗物
    public moneys:Money[] = []//资产
    constructor(map:PlayerMap){
        console.log('[Player 构造函数] 开始，调用 super 之前')
        super(map)
        console.log('[Player 构造函数] super 完成后')

        // 在字段初始化后，初始化 cards 数组
        this.cards = []
        console.log('[Player 构造函数] cards 初始化为空数组')

        // 现在添加器官（这样 CardModifier 才能正确添加卡牌）
        console.log('[Player 构造函数] 准备初始化器官')
        this.initOrgans()
        console.log('[Player 构造函数] 器官初始化完成，cards 长度：', this.cards.length)
        console.log('[Player 构造函数] cards 内容：', this.cards.map(c => c.label))

        //玩家特有内容的初始化
        this.getMoney(map.money)
        const potion = map.potion
        //设定药水总数
        this.setPotionsMaxNum(potion.max)
        for(let key of potion.now){
            //获取初始药水
            this.getPotion(key)
        }

        console.log('[Player 构造函数] 准备添加初始卡组')
        //获取初始拥有的卡组
        for(let key of map.card){
            this.getCard(key)
        }
        console.log('[Player 构造函数] 完成，最终 cards 长度：', this.cards.length)
        console.log('[Player 构造函数] 最终 cards 内容：', this.cards.map(c => c.label))
    }
    
    //获取自身
    getSelf(){
        return this
    }
    //获取金钱
    getMoney(moneyKeyMap:Record<string,number>){
        //获得指定种类的金钱对象
        for(let key in moneyKeyMap){
            const value = moneyKeyMap[key]
            const money = getMoneyByKey(key,value)
            //添加到资产中
            this.moneys.push(money) 
        }
    }
    //获取药水,一次一瓶
    getPotion(potionKey:string){
        const maxNum = this.potions.max
        const nowNum = this.potions.now.length
        if(nowNum==maxNum){
            return false
        }
        else{
            //获取药水对象的数据
            const potion = getPotionByKey(potionKey)
            this.potions.now.push(potion)
            return true
        }
    }
    //获取卡牌
    getCard(cardKey:string){
        //获取卡牌对象
        const card = getCardByKey(cardKey)
        //添加到卡组中
        this.cards.push(card)
    }

    //战斗开始
    startBattle(){
        //初始化牌堆:洗牌+清空牌堆
        this.initCardPile()
        //初始化状态：清空状态栏
        this.initState()
        //初始化属性：所有属性变成默认值
        // refreshAllStatus(this)
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
        console.log(`[Player.initCardPile] 开始初始化牌堆，当前 cards 数组长度：`, this.cards.length)
        console.log(`[Player.initCardPile] cards 内容：`, this.cards.map(c => c.label))

        //洗抽牌堆
        const cards = this.cards;
        this.cardPiles.drawPile = cards;
        this.washCardPile("drawPile")

        console.log(`[Player.initCardPile] 初始化完成，drawPile 长度：`, this.cardPiles.drawPile.length)

        //其他牌堆清空
        this.cardPiles.discardPile = []
        this.cardPiles.exhaustPile = []
        this.cardPiles.handPile = []
    }
    //初始化状态
    initState(){
        this.state = []
    }

    //获取药水列表
    getPotionList(){
        const list:(Potion|null)[] = [...this.potions.now]
        while (list.length < this.potions.max) {
            list.push(null);
        }
        return list
    }
    //获取遗物列表
    getRelicsList(){
        return this.relics
    }
    //设置药水的最大数量
    setPotionsMaxNum(maxNum:number){
        this.potions.max = maxNum
    }

    //获取当前持有的金钱
    getNowMoneys(){
        return this.moneys
    }
    //获取当前持有的卡牌
    getCardGroup(){
        return this.cards
    }
}



