import { OrganMap } from "@/static/list/target/organList";
import { Entity } from "../system/Entity";
import { Chara } from "./Target";
import { newLog } from "@/ui/hooks/global/log";
import { doEvent } from "../system/ActionEvent";
import { Interaction } from "../item/Item";
import { EffectUnit } from "../system/effect/EffectUnit";

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
    //获取指定的交互
    getInteraction(key:string){
        const i = this.interaction.find(i=>i.key == key)
        if(!i){
            return false
        }
        return i
    }   
    //使用
    use(targets:Entity[]){
        //调用对象的use交互
        const interaction = this.interaction.find(item=>item.key == "use");
        if(!interaction){
            newLog([this,"无法被使用"])
            return "cant";
        }
    }
}

//角色获得器官：未完成，应该是通过器官修饰器来管理
export function getOrgan(chara:Chara,source:Entity,organ:Organ){
    newLog([chara,"获得了器官",organ])
    const interaction = organ.getInteraction("get")
    let effectUnits:EffectUnit[] = []
    if(interaction){
        effectUnits = interaction.effects
    }
    //判断目标是否符合需求
    doEvent({
        key:"getOrgan",
        source,
        medium:organ,
        target:chara,
        effectUnits
    })
    chara.appendOrgan(organ)
}
