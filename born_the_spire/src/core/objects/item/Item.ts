import { Describe } from "@/ui/hooks/express/describe";
import { Entity, EntityMap } from "../system/Entity";
import { EffectUnit } from "../system/effect/EffectUnit";
import { TargetType } from "@/static/list/registry/chooseTargetType";
import { newLog } from "@/ui/hooks/global/log";

export type ItemMap = EntityMap & {
    label:string,
    describe?:Describe,
    key:string,
    interaction:Record<string,{target:TargetType,effects:EffectUnit[]}>
}

export class Item extends Entity{
    public label:string;
    public readonly key:string;
    public interaction:Interaction[]
    constructor(map:ItemMap){
        super(map)
        this.label = map.label;
        this.describe = map.describe??[""];
        this.key = map.key;
        const interaction:Interaction[] = []
        for(let key in map.interaction){
            interaction.push({key,...map.interaction[key]})
        }
        this.interaction = interaction
    }
    //获取指定的交互
    getInteraction(key:string){
        const i = this.interaction.find(i=>i.key == key)
        if(!i){
            return false
        }
        return i
    }   
    //使用item
    use(targets:Entity[]){
        //调用对象的use交互
        const interaction = this.interaction.find(item=>item.key == "use");
        if(!interaction){
            newLog([this,"无法被使用"])
            return "cant";
        }
        return interaction
    }
}

//交互
export interface Interaction{
    key:string,
    target:TargetType,
    effects:EffectUnit[]
}
