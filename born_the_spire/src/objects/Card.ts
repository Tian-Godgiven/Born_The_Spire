import { Describe } from "@/hooks/express/describe";
import { EffectMap, makeEffect } from "@/static/list/effectList";
import { CardMap } from "@/static/list/cardList";
import { Target } from "./Target";
import { nowPlayer } from "@/hooks/run";

export class Card{
    public label:string;
    public describe:Describe
    public readonly key:string;
    public effects:EffectMap[]
    constructor(
        cardMap:CardMap
    ){
        this.label = cardMap.label;
        this.describe = cardMap.describe;
        this.effects = cardMap.effects;
        this.key = cardMap.key
    }
    //对目标使用卡牌
    useTo(target:Target){
        //依次触发卡牌的效果
        this.effects.forEach(effect=>{
            makeEffect(nowPlayer.value.getSelf(),target,effect)
        })
    }
}