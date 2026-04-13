import type { ActionEvent } from "../ActionEvent";
import type { Effect } from "./Effect";
import { isState, isEffect } from "@/core/utils/typeGuards";
import { getStatusValue } from "../status/Status";
import { getCurrentValue } from "../Current/current";
import { newError } from "@/ui/hooks/global/alert";
import { getContextRandom } from "@/core/hooks/random";
import { resolveReference, resolveReferenceObject } from "@/core/utils/ReferenceResolver";

//效果参数
export type EffectParams = {
    [paramKey:string]:
        |boolean
        |string
        |number
        |Record<string,any>
        |`$eventResult(${string})`
        |`$triggerEffect.params(${string})`
        |`$${string}.${string}(${string})`
        |`random(${string},${string})`
}

/**
 * 解析效果参数
 *
 * 语法：
 * - $eventResult(key): 从事件结果获取
 * - $triggerEffect.params(key): 触发效果参数（延迟解析）
 * - $source.status(health): 从 source 获取属性值
 * - $target.current(energy): 从 target 获取当前值
 * - $source.stateStack(key): 从 source 获取状态层数（key 可选，默认 default）
 * - random(min,max): 生成随机数（不带 $）
 */
export function resolveEffectParams(param: EffectParams[string], event: ActionEvent, effect: Effect) {
    // 构建解析上下文
    const context = {
        source: event.source,
        medium: event.medium,
        target: event.target,
        event,
        triggerEffect: effect,
        lazyResolve: true,  // 效果构造时，$triggerEffect.params() 延迟解析
        battle: (window as any).nowBattle?.value
    }

    // 使用 ReferenceResolver 处理所有解析
    return resolveReference(param, context)
}

export type EffectFunc<R=any> = (
    event:ActionEvent,//引发这个效果的事件对象
    effectObj:Effect,//这个效果的效果对象
)=>R

//执行一个效果函数
export async function doEffectFunc(effect: Effect, override_event?:Partial<ActionEvent>) {
    // 始终使用原始事件对象
    const event = effect.actionEvent;

    // 获取实际使用的属性值（优先使用覆盖值）
    const source = override_event?.source ?? event.source
    const medium = override_event?.medium ?? event.medium
    const target = override_event?.target ?? event.target

    // 如果是模拟模式，检查目标类型
    if (event.simulate) {
        // 检查目标是否为效果对象（修改参数）
        const targets = Array.isArray(target) ? target : [target]
        const isModifyingEffect = targets.some(t => isEffect(t))

        if (isModifyingEffect) {
            // 目标是效果对象，允许执行（修改参数）
            // 继续执行...
        } else {
            // 目标是实体，跳过执行（修改状态）
            return undefined
        }
    }

    // 使用原始事件创建子日志
    event.addChildLog({
        main:[source,"对",target,"造成了效果",effect],
        detail:[
            "媒介:",medium," | ",
            "效果参数",effect.params,
            "效果解释",effect.describe,
        ]
    })

    //效果函数
    const effectFunc = effect.effectFunc;
    //计算效果此时的参数应用值
    countEffectValue(effect);

    // 重新解析延迟参数（如 $triggerEffect.params）
    const context = {
        source: event.source,
        medium: event.medium,
        target: event.target,
        event,
        triggerEffect: effect,
        lazyResolve: false,  // 现在真正解析
        battle: (window as any).nowBattle?.value
    }

    // 重新解析所有可能是延迟引用的参数
    for (const key in effect.params) {
        const param = effect.params[key]
        if (typeof param === "string" && (param.startsWith("$triggerEffect") || param === "$triggerValue")) {
            const resolved = resolveReference(param, context)
            if (resolved !== undefined) {
                effect.params[key] = resolved
            }
        }
    }

    // 如果有覆盖属性，临时修改 actionEvent
    const originalTarget = event.target
    const originalSource = event.source
    const originalMedium = event.medium

    if(override_event?.target) event.target = override_event.target as any
    if(override_event?.source) event.source = override_event.source as any
    if(override_event?.medium) event.medium = override_event.medium as any

    // 执行效果函数
    const res = await effectFunc(event, effect);

    // 恢复原始值
    event.target = originalTarget
    event.source = originalSource
    event.medium = originalMedium

    //打印日志
    event.addChildLog({main:["执行效果",effect],detail:["所属事件:",event,"返回结果:",res]})

    return res
}

//计算实际传递给效果函数的效果的参数的最终计算值
// 注意：现在参数解析在 Effect 构造函数中完成，这个函数已经不再使用
function countEffectValue(_effect: Effect) {
    // 参数解析已经在 Effect 构造函数中完成
    // 这里保留空函数以防有其他地方调用
}