import { nanoid } from "nanoid";
import { Entity, EntityMap } from "../system/Entity";
import { State } from "../system/State";
import { TriggerMap } from "@/core/types/object/trigger";
import { computed, reactive } from "vue";
import { getStatusRefValue } from "../system/status/Status";
import { getCurrentRefValue } from "../system/Current/current";
import { getOrganModifier } from "../system/modifier/OrganModifier";
import { doEvent } from "../system/ActionEvent";
import { voteMechanismForEntity } from "@/static/registry/mechanismRegistry";

export type TargetMap = EntityMap & {
    label:string,
}
//可被选中和作用的目标
export class Target extends Entity{
    public readonly targetType: string = 'target'  // 类型标识，子类应该覆盖
    public label:string = "";//名称
    public readonly __key:string = nanoid() //唯一键
    public state:State[] = []//状态数组
    constructor(map:TargetMap, beforeCurrentInit?: (this: Entity) => void){
        super(map, beforeCurrentInit)
        //名称
        this.label = map.label
    }
}

export type CharaMap = TargetMap & {
    organ:string[]
    trigger?:TriggerMap
}
//用于角色和敌人
export class Chara extends Target{
    // 从 OrganModifier 动态获取器官列表（用于 UI 显示）
    public organs = computed(() => {
        return getOrganModifier(this).getOrgans()
    })

    constructor(map:CharaMap){
        // 在 super 调用时传入回调，在 Current 初始化之前先初始化器官
        super(map, async function(this: Entity) {
            // 初始化器官（在 Current 初始化之前）
            // 此时 this 指向正在构造的 Chara 实例
            const chara = this as Chara
            if (map.organ) {
                // 动态导入避免循环依赖
                const { getOrgan } = await import("./Organ")
                const { getLazyModule } = await import("@/core/utils/lazyLoader")
                const { Organ } = await import("./Organ")
                const organList = getLazyModule<any[]>('organList')

                for(let key of map.organ){
                    const organData = organList.find((o: any) => o.key === key)
                    if (!organData) {
                        console.error(`[Chara] 未找到器官: ${key}`)
                        continue
                    }
                    const organ = new Organ(organData)
                    getOrgan(chara, chara, organ)
                }
            }
        })

        // 启用护甲机制（默认启用）
        voteMechanismForEntity(this, "armor", "enable", "default", 0)

        // 添加默认的死亡触发器
        // 监听 healthReachMin 事件，触发 dead 事件
        // 使用 onlyKey 机制，允许被子类或配置覆盖
        this.trigger.appendTrigger({
            when: "after",
            how: "take",
            key: "healthReachMin",
            importantKey: "death_behavior",
            onlyKey: "default_death_on_health_zero",
            callback: (event) => {
                // 默认行为：生命归0时触发死亡事件
                doEvent({
                    key: "dead",
                    source: event.source,
                    medium: event.medium,
                    target: this,
                    info: { reason: "生命值归0" },
                    effectUnits: [{
                        key: "kill",  // 使用 effectMap 中注册的 key
                        params: {}
                    }]
                })
            }
        })
    }

    // 添加器官的方法
    protected async initOrgans(organKeys: string[]) {
        if (organKeys) {
            // 动态导入避免循环依赖
            const { getOrgan } = await import("./Organ")
            const { getLazyModule } = await import("@/core/utils/lazyLoader")
            const { Organ } = await import("./Organ")
            const organList = getLazyModule<any[]>('organList')

            for(let key of organKeys){
                const organData = organList.find((o: any) => o.key === key)
                if (!organData) {
                    console.error(`[Chara] 未找到器官: ${key}`)
                    continue
                }
                const organ = new Organ(organData)
                getOrgan(this, this, organ)
            }
        }
    }

    //获取对象的器官列表
    getOrganList(){
        return this.organs.value
    }
    //获取目标的生命值/最大生命对象
    getHealth(){
        //找到其属性
        return reactive({
            max:getStatusRefValue(this,"max-health"),
            now:getCurrentRefValue(this,"health",0)
        })
    }
    getEnergy(){
        //找到其属性
        return reactive({
            max: getStatusRefValue(this,"max-energy"),
            now: getCurrentRefValue(this,"energy",0)
        })
    }
}