import { ActionEvent } from "../ActionEvent";
import { Effect } from "./Effect";
import { isState } from "@/core/utils/typeGuards";
import { getStatusValue } from "../status/Status";
import { getCurrentValue } from "../Current/current";
import { newError } from "@/ui/hooks/global/alert";
import { getContextRandom } from "@/core/hooks/random";

//效果参数
export type EffectParams = {
    [paramKey:string]:
        |boolean
        |string
        |number
        |Record<string,any>
        |`$r.${string}` //表示从event._result中取string的值作为该paramKey的值
        |`$${string}.${string}.${string}` //表示从事件参与者获取值，如 $source.stack.default
        |`$random[${string}]` //表示随机值，如 $random[1,9] 或 $random[1.5,3.5]
}

/**
 * 解析效果参数
 *
 * 支持的语法：
 * - $r.xxx: 从事件结果获取
 * - $source.stack.xxx: 从 source 状态获取层数
 * - $medium.stack.xxx: 从 medium 状态获取层数
 * - $target.stack.xxx: 从 target 状态获取层数
 * - $source.status.xxx: 从 source 获取属性值
 * - $target.current.xxx: 从 target 获取当前值
 * - $random[min,max]: 生成随机数（整数或浮点数）
 */
export function resolveEffectParams(param: EffectParams[string], event: ActionEvent, _effect: Effect) {
    if (typeof param !== "string" || !param.startsWith("$")) {
        return param
    }

    // 旧语法：$r.xxx（从事件结果获取）
    if (param.startsWith("$r.")) {
        const key = param.substring(3)
        return event.getEventResult(key)
    }

    // 随机值语法：$random[min,max]
    if (param.startsWith("$random[") && param.endsWith("]")) {
        const rangeStr = param.substring(8, param.length - 1) // 提取 "min,max"
        const parts = rangeStr.split(",")

        if (parts.length !== 2) {
            newError([`随机值解析失败：格式错误 "${param}"，应为 $random[min,max]`])
            return undefined
        }

        const min = Number(parts[0].trim())
        const max = Number(parts[1].trim())

        if (isNaN(min) || isNaN(max)) {
            newError([`随机值解析失败：无效的数值 "${param}"`])
            return undefined
        }

        if (min > max) {
            newError([`随机值解析失败：最小值不能大于最大值 "${param}"`])
            return undefined
        }

        // 判断是整数还是浮点数（如果 min 和 max 都是整数，则生成整数随机值）
        const isInteger = Number.isInteger(min) && Number.isInteger(max)

        // 使用确定性随机数生成器
        const rng = getContextRandom("effectParam")

        if (isInteger) {
            // 生成整数随机值 [min, max]
            return rng.nextInt(min, max)
        } else {
            // 生成浮点数随机值 [min, max)
            return min + rng.next() * (max - min)
        }
    }

    // 新语法：$participant.type.key
    const parts = param.substring(1).split(".")
    if (parts.length !== 3) {
        newError([`参数解析失败：无法解析 "${param}"，格式应为 $participant.type.key`])
        return undefined
    }

    const [participantStr, typeStr, key] = parts

    // 获取参与者对象
    let participant: any
    if (participantStr === "source") {
        participant = event.source
    } else if (participantStr === "medium") {
        participant = event.medium
    } else if (participantStr === "target") {
        participant = event.target
    } else {
        newError([`参数解析失败：未知的参与者 "${participantStr}"，可选值为 source/medium/target`])
        return undefined
    }

    // 根据类型获取值
    if (typeStr === "stack") {
        // 获取状态层数
        if (isState(participant)) {
            const stack = participant.stacks.find(s => s.key === key)
            if (!stack) {
                newError([`参数解析失败：状态`, participant, `中找不到层数 "${key}"`])
                return undefined
            }
            return stack.stack
        } else {
            newError([`参数解析失败：${participantStr} (`, participant, `) 不是 State 对象，无法获取 stack`])
            return undefined
        }
    } else if (typeStr === "status") {
        // 获取属性值
        return getStatusValue(participant, key)
    } else if (typeStr === "current") {
        // 获取当前值
        return getCurrentValue(participant, key, 0)
    } else {
        newError([`参数解析失败：未知的类型 "${typeStr}"，可选值为 stack/status/current`])
        return undefined
    }
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
        const isModifyingEffect = targets.some(t =>
            t instanceof Effect ||
            (t as any).participantType === 'effect'
        )

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