import { OrganMap } from "@/static/list/target/organList";
import { Entity } from "../system/Entity";
import { Chara } from "./Target";
import { newLog } from "@/ui/hooks/global/log";
import { Interaction } from "../item/Item";
import { getOrganModifier } from "../system/modifier/OrganModifier";

export class Organ extends Entity{
    public readonly label:string
    public readonly key:string
    public interaction:Interaction[]
    constructor(map:OrganMap){
        super(map)
        this.label = map.label;
        this.key = map.key;
        const interaction:Interaction[] = []
        for(let key in map.interaction){
            interaction.push({key,...map.interaction[key]})
        }
        this.interaction = interaction
    }
    getInteraction(key:string){
        const i = this.interaction.find(i=>i.key == key)
        if(!i){
            return false
        }
        return i
    }
    use(targets:Entity[]){
        const interaction = this.interaction.find(item=>item.key == "use");
        if(!interaction){
            newLog([this,"无法被使用"])
            return "cant";
        }
    }
}

/**
 * 角色获得器官（包装函数）
 */
export function getOrgan(chara: Chara, source: Entity, organ: Organ) {
    const organModifier = getOrganModifier(chara)
    organModifier.acquireOrgan(organ, source)
}

/**
 * 角色失去器官（包装函数）
 */
export function removeOrgan(chara: Chara, organ: Organ, triggerLoseEffect: boolean = false) {
    const organModifier = getOrganModifier(chara)
    organModifier.loseOrgan(organ, triggerLoseEffect)
}
