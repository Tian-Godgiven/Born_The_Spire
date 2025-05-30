import { CardMap } from "@/static/list/item/cardList";
import { Target } from "@/objects/target/Target";
import { Item } from "./Item";
import { doBehavior } from "@/static/list/system/behaviorList";
import { costEnergy, Player } from "../target/Player";
import { getStatusValue } from "../system/Status";

export class Card extends Item{
    constructor(map:CardMap){
        super(map)
    }
    //对目标使用卡牌
    useCard(ownner:Player,target:Target){
        const cost = getStatusValue(this,"cost")
        if(costEnergy(this,this,ownner,cost)){
            doBehavior("useCard",ownner,this,target)
        }
    }
}