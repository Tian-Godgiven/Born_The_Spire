import { Describe } from "@/hooks/express/describe";
import { Entity, EntityMap } from "../system/Entity";
import { EffectUnit } from "../system/effect/EffectUnit";

export type ItemMap = EntityMap & {
    label:string,
    describe?:Describe,
    key:string,
    use:EffectUnit[]
}

export class Item extends Entity{
    public label:string;
    public readonly key:string;
    public onUse:EffectUnit[] = []//使用时效果
    constructor(map:ItemMap){
        super(map)
        this.label = map.label;
        this.describe = map.describe??[""];
        this.key = map.key;
        this.onUse = map.use
    }
}

