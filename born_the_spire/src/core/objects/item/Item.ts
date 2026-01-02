import { Describe } from "@/ui/hooks/express/describe";
import { Entity, EntityMap } from "../system/Entity";
import { EffectUnit } from "../system/effect/EffectUnit";
import { TargetType } from "@/static/list/registry/chooseTargetType";
import { newLog } from "@/ui/hooks/global/log";
import { TriggerMap } from "@/core/types/object/trigger";
import { ModifierOptions } from "../system/status/type";

// 物品修饰器
export type ItemModifierDef = {
    statusKey: string
    label?: string
} & Partial<ModifierOptions>

// 物品交互
export type InteractionData = {
    target: TargetType//这个交互可以指定的对象
    effects: EffectUnit[]//交互将会造成的即时效果
    triggers?: TriggerMap//交互将会添加的触发器
    modifiers?: ItemModifierDef[]//交互将会添加的修饰器
}

export type ItemMap = EntityMap & {
    label:string,
    describe?:Describe,
    key:string,
    interaction:Record<string, InteractionData>
}

// 物品：一系列可以被玩家交互的对象
export class Item extends Entity{
    public label:string;
    public readonly key:string;
    public interaction:Interaction[]//交互
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

export interface Interaction extends InteractionData {
    key:string
}
