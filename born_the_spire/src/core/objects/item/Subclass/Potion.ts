import { PotionMap } from "@/static/list/item/potionList";
import { Item } from "../Item";

export class Potion extends Item{
    public targetType:"player"|"enemy"|"all"
    constructor(
        map:PotionMap
    ){
        super(map)
        this.targetType = map.targetType;
    }
}