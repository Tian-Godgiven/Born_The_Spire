import { Describe } from "@/hooks/express/describe";
import { Entity, EntityMap } from "../system/Entity";
import { EffectUnit } from "../system/effect/EffectUnit";
import { ItemTarget } from "@/static/list/registry/itemTarget";
import { nowBattle } from "../game/battle";
import { newLog } from "@/hooks/global/log";

export type ItemMap = EntityMap & {
    label:string,
    describe?:Describe,
    key:string,
    interaction:Record<string,{target:ItemTarget,effects:EffectUnit[]}>
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
    //选择目标/瞄准
    aim(interaction:Interaction){
        //use的目标类型
        const target = interaction.target
        const faction = target.faction
        if(faction){
            //当前场地情况
            const nowFaction = nowBattle.value?.getTeam(faction)
            if(!nowFaction)return {faction,number:0,result:false}//当前场地上已不具备可选目标
            //场地数量
            if(nowFaction.length < target.number){
                return {faction,number:nowFaction.length,}
            }
        }
        //可以选择任意阵营

    }
    //使用item
    use(targets:Entity[],){
        //调用对象的use交互
        const interaction = this.interaction.find(item=>item.key == "use");
        if(!interaction){
            newLog([this,"无法被使用"])
            return "cant";
        }
        //判断目标是否满足条件
        this.aim(interaction)
    }
}

//交互
export interface Interaction{
    key:string,
    target:ItemTarget,
    effects:EffectUnit[]
}
