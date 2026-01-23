import { Effect } from "./Effect"
import { EffectParams } from "./EffectFunc"
import { ActionEvent } from "../ActionEvent"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { newError } from "@/ui/hooks/global/alert"
import _ from "lodash"


// 效果单元类型，这是效果对象存储在JSON中的格式
export interface EffectUnit{
    key:string,//效果关键字
    params:EffectParams,//效果需要使用的参数
    describe?:string[]//解释型描述，并不会直接显示
    resultStoreAs?:string//该效果的返回值会存放在事件的_results的指定key下面
}

//通过effectUnit创建effect对象
export function createEffectByUnit(event:ActionEvent,unit:EffectUnit):Effect{
    /**
     * 架构说明：为什么使用懒加载 effectMap？
     *
     * 问题：如果在顶部静态导入 effectMap，会形成循环依赖：
     * Entity → Trigger → ActionEvent → EffectUnit → effectMap → (各种 effect 函数) → Organ → Entity
     *
     * 解决方案：使用统一的懒加载机制
     * - 核心系统类（Entity、ActionEvent、EffectUnit）在模块加载时建立依赖
     * - 数据配置文件（effectMap、organList 等）通过 lazyLoader 在运行时按需加载
     * - 所有数据层都使用相同的懒加载机制，保持架构一致性
     */
    const effectMap = getLazyModule<any[]>('effectMap')
    const data = effectMap.find((tmp: any) => tmp.key == unit.key)
    if(!data){
        newError(["错误:没有找到目标效果", unit.key])
        throw new Error()
    }

    //构建effect对象
    const {key,params,describe,resultStoreAs} = unit

    // 使用 JSON 深拷贝
    let clonedParams: EffectParams
    try {
        clonedParams = JSON.parse(JSON.stringify(params))
    } catch (e) {
        // 如果有循环引用，退回到浅拷贝
        clonedParams = {...params}
    }

    const effectObj = new Effect({
        label:data.label,
        key,
        effectFunc:data.effect,
        params: clonedParams,  // 深拷贝 params，避免污染原始数据
        describe,
        triggerEvent:event,
        resultStoreAs
    })
    return effectObj
}