import { Describe } from "@/ui/hooks/express/describe";
import { Entity, EntityMap } from "../system/Entity";
import { EffectUnit } from "../system/effect/EffectUnit";
import { TargetType } from "@/core/types/TargetType";
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
    label?: string//交互的显示名称（如"饮用"、"投掷"、"激活"）
    target: TargetType//这个交互可以指定的对象
    effects: EffectUnit[]//交互将会造成的即时效果
    triggers?: TriggerMap//交互将会添加的触发器
    modifiers?: ItemModifierDef[]//交互将会添加的修饰器
}

export type ItemMap = EntityMap & {
    label:string,
    describe?:Describe,
    key:string,
    interaction:Record<string, InteractionData | InteractionData[]>
}

// 物品：一系列可以被玩家交互的对象
export class Item extends Entity{
    public readonly itemType: string = 'item'  // 类型标识，子类应该覆盖
    public label:string;
    public readonly key:string;
    public interaction:Interaction[]//交互
    public isDisabled:boolean = false // 物品是否失效（器官损坏、遗物失效等）
    public useInteractions:Interaction[] = [] // 所有的 use 交互

    constructor(map:ItemMap){
        super(map)
        this.label = map.label;
        this.describe = map.describe??[""];
        this.key = map.key;
        const interaction:Interaction[] = []
        for(let key in map.interaction){
            const data = map.interaction[key]

            // 特殊处理 use（可能是数组）
            if(key === 'use') {
                if(Array.isArray(data)) {
                    // use 是数组，创建多个交互
                    data.forEach((d, i) => {
                        const useInteraction = {key: `use_${i}`, ...d}
                        interaction.push(useInteraction)
                        this.useInteractions.push(useInteraction)
                    })
                } else if(data) {
                    // use 是单个对象
                    const useInteraction = {key: 'use', ...data}
                    interaction.push(useInteraction)
                    this.useInteractions.push(useInteraction)
                }
            } else {
                // 其他交互正常处理
                if (data && !Array.isArray(data)) {
                    interaction.push({key, ...data})
                }
            }
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

    /**
     * 获取 use 交互数量
     */
    getUseCount(): number {
        return this.useInteractions.length
    }

    /**
     * 获取指定索引的 use 交互
     */
    getUse(index: number = 0): Interaction | undefined {
        return this.useInteractions[index]
    }

    //使用item
    use(_targets:Entity[]){
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
