import { Describe } from "@/hooks/express/describe";
import { EffectUnit } from "@/static/list/system/effectMap";
import { Entity, EntityMap } from "../system/Entity";

export type ItemMap = EntityMap & {
    label:string,
    describe?:Describe,
    key:string,
    behavior?:Record<string,EffectUnit[]>
}

export class Item extends Entity{
    public label:string;
    public readonly key:string;
    constructor(map:ItemMap){
        super(map)
        this.label = map.label;
        this.describe = map.describe??[""];
        this.key = map.key
    }
}

