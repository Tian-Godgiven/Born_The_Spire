import { Card } from "../item/Card";
import type { Potion } from "../item/Potion"
import type { Relic } from "../item/Relic"
import { PlayerMap } from "@/static/list/target/playerList";
import { getPotionByKey } from "@/static/list/item/potionList";
import { nanoid } from "nanoid";
import { Chara } from "./Target";
import {shuffle} from "lodash"
import { getCardByKey } from "@/static/list/item/cardList";
import { getMoneyByKey, Money } from "@/static/list/item/moneyList";

// 每一局游戏中，玩家扮演的角色
export class Player extends Chara{
    //唯一键
    public readonly __key:string = nanoid()
    //药水的持有情况
    private potions:{max:number,now:Potion[]} = {
        max:0,
        now:[]
    }
    //当前的各个卡组的情况
    public cardPiles:Record<string,Card[]> = {
        handPile:[],
        drawPile:[],
        discardPile:[],
        exhaustPile:[]
    }
    private cards:Card[] = []//卡组
    private relics:Relic[] = []//拥有的遗物
    private moneys:Money[] = []//资产
    constructor(
        map:PlayerMap
    ){
        super(map)
        //玩家特有内容的初始化
        this.getMoney(map.money)
        const potion = map.potion
        //设定药水总数
        this.setPotionsMaxNum(potion.max)
        for(let key of potion.now){
            //获取初始药水
            this.getPotion(key)
        }
        //获取初始拥有的卡组
        for(let key of map.card){
            this.getCard(key)
        }
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
        //初始化抽牌堆
        this.initDrawPile()
    }
    //回合开始
    startTurn(){
        //抽牌
        this.drawCard(5)
    }

    //将牌放入手牌中
    getHandCard(card:Card|Card[]){
        if(card instanceof Card){
            this.cardPiles.handPile.push(card)
        }
        else{
            card.forEach(card=>{
                this.cardPiles.handPile.push(card)
            })
        }
    }
    //从抽牌堆中抽牌
    drawCard(number:number){
        const drawPile = this.cardPiles.drawPile
        const length = drawPile.length
        //抽牌堆数量不足
        if(length < number){
            //先抽足够的数量放进手牌
            const cards = drawPile.splice(0,length)
            this.getHandCard(cards)
            //弃牌堆填充抽牌堆
            this.fullDrawPile()
            //再抽剩余数量
            const leftCards = drawPile.splice(0,(number-length))
            this.getHandCard(leftCards)
            return;
        }
        //抽n张牌
        const cards = drawPile.splice(0,number)
        this.getHandCard(cards)
    }
    //抽牌堆洗牌
    washDrawPile(){
        const cards = this.cardPiles.drawPile
        const newCards = shuffle(cards)
        this.cardPiles.drawPile = newCards
    }
    //填充弃牌堆全部进入抽牌堆
    fullDrawPile(){
        const cards = this.cardPiles.discardPile;
        this.cardPiles.drawPile.push(...cards)
        this.cardPiles.discardPile = []
        //洗牌
        this.washDrawPile()
    }
    //初始化抽牌堆，将卡组内的卡牌洗进抽牌堆
    initDrawPile(){
        const cards = this.cards;
        this.cardPiles.drawPile = cards;
        this.washDrawPile()
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


