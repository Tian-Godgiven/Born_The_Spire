import type { Card } from "./Card";
import type { Potion } from "./Potion"
import type { Relic } from "./Relic"
import { setMoney } from "@/hooks/player";
import { Money } from "@/interface/Money";
import { PlayerMap } from "@/static/list/playerList";
import { getPotionByKey } from "@/static/list/potionList";
import { nanoid } from "nanoid";
import { Target } from "./Target";

// 每一局游戏中，玩家扮演的角色
export class Player extends Target{
    //唯一键
    public readonly __key:string = nanoid()
    //药水的持有情况
    private potions:{max:number,now:Potion[]} = {
        max:0,
        now:[]
    }
    //当前的各个卡组的情况
    public cardPiles = {
        handPile:[],
        drawPile:[],
        discardPile:[],
        exhaustPile:[]
    }
    constructor(
        private cards:Card[],//卡组
        private relics:Relic[],//拥有的遗物
        private moneys:Money[],//资产
    ){
        super()
    }
    //初始化对象
    initPlayer(playerMap:PlayerMap){
        this.label = playerMap.label;
        this.initTarget(playerMap)
        //玩家特有内容的初始化
        this.getMoney(playerMap.money)
        const potion = playerMap.potion
        //设定药水总数
        this.setPotionsMaxNum(potion.max)
        for(let key of potion.now){
            //获取初始药水
            this.getPotion(key)
        }
    }
    
    //获取金钱
    getMoney(moneyKeyMap:Record<string,number>){
        //获得金钱对象
        for(let key in moneyKeyMap){
            const value = moneyKeyMap[key]
            const money = setMoney(key,value)
            //添加到资产中
            this.moneys.push(money) 
        }
    }
    //获取药水,一次一瓶
    getPotion(potionKey:string){
        const maxNum = this.potions.max
        const nowNum = this.potions.now.length
        if(nowNum==maxNum){
            console.log("药水栏已满")
            return false
        }
        else{
            //获取药水对象的数据
            const potion = getPotionByKey(potionKey)
            this.potions.now.push(potion)
            return true
        }
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