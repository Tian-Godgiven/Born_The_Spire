import { Describe } from "@/ui/hooks/express/describe"
import { Target } from "../target/Target"
import { Entity } from "./Entity"
import { stateList } from "@/static/list/target/stateList"
import { newError } from "@/ui/hooks/global/alert"
import { ActionEvent } from "./ActionEvent"
import { EffectUnit } from "./effect/EffectUnit"
import { TriggerMap } from "@/core/types/object/trigger"
import { EventParticipant } from "@/core/types/event/EventParticipant"
import { nanoid } from "nanoid"

// ==================== 类型定义 ====================

/**
 * 状态层数对象
 */
export type Stack = {
    key: string                      // 层数标识（如 "default", "duration", "power"）
    stack: number                    // 当前层数值
    label?: string                   // 显示名称
    describe?: Describe              // 描述
    showType?: "number" | "bool"     // 显示类型（默认 number）
}

/**
 * 层数变化规则
 */
export type StackChangeRule = {
    timing: "turnStart" | "turnEnd" | "battleStart" | "battleEnd"  // 触发时机
    stackKey?: string                // 要修改的层数key，默认 "default"
    delta: number | "all"            // 变化量（可正可负），"all" 表示清空（设为0）
    condition?: string               // 可选条件表达式（如 "turn % 2 === 1"）
}

/**
 * 状态交互数据
 */
export type StateInteractionData = {
    // 持有状态期间的效果（通过触发器）
    possess?: {
        triggers?: TriggerMap
    }

    // 获得状态时的一次性效果
    apply?: {
        effects?: EffectUnit[]
    }

    // 失去状态时的一次性效果
    remove?: {
        effects?: EffectUnit[]
    }
}

/**
 * 状态数据定义（用于 stateList）
 */
export type StateData = {
    label: string
    key: string
    describe: Describe
    showType?: "number" | "bool"      // 状态显示类型
    repeate?: "stack" | "refresh" | "none"  // 重复获得时的行为
    stacks?: Stack[] | number         // 层数对象（可简写为数字）
    checkExist?: (getter: Target, state: State) => boolean  // 检查状态是否还存在
    stackChange?: StackChangeRule[]   // 层数自动变化规则
    interaction?: StateInteractionData  // 状态交互
}

/**
 * 状态Map（构造时使用）
 */
export type StateMap = StateData & {
    stacks: Stack[] | number
}

// ==================== State 类 ====================

/**
 * 状态对象
 *
 * 状态是添加在 Target 上的临时效果，具有层数和持续时间
 * 通过 interaction 定义状态的行为
 */
export class State implements EventParticipant {
    public __id: string = nanoid()
    public label: string
    public key: string
    public participantType: 'state' = 'state'
    public describe: Describe
    public showType: "number" | "bool" = "number"
    public stacks: Stack[]  // 层数对象数组
    public repeate: "stack" | "refresh" | "none" = "stack"
    public checkExist: (getter: Target, state: State) => boolean
    public stackChange?: StackChangeRule[]  // 层数自动变化规则
    public interaction: StateInteractionData

    // 触发器清理函数（在失去状态时调用）
    public cleanTrigger: (() => void)[] = []

    constructor(map: StateMap) {
        this.label = map.label
        this.key = map.key
        this.describe = map.describe
        this.showType = map.showType ?? "number"
        this.repeate = map.repeate ?? "stack"
        this.checkExist = map.checkExist ?? defaultCheckExist
        this.stackChange = map.stackChange
        this.interaction = map.interaction ?? {}

        // 处理 stacks（支持简写）
        if (typeof map.stacks === "number") {
            this.stacks = [{ key: "default", stack: map.stacks }]
        } else {
            this.stacks = map.stacks
        }
    }

    /**
     * 获取该状态（为目标添加触发器）
     * 现在通过 StateModifier 调用
     */
    getState(target: Target) {
        // 处理 possess 交互的触发器
        // 这部分逻辑移到 StateModifier 中处理
    }

    /**
     * 失去该状态（移除触发器）
     */
    lostState() {
        // 移除所有触发器
        for (let cleaner of this.cleanTrigger) {
            cleaner()
        }
        this.cleanTrigger = []
    }
}

// ==================== 工具函数 ====================

/**
 * 默认的存在性检查：default 层数 > 0
 */
const defaultCheckExist = (getter: Target, state: State): boolean => {
    const stack = getStateStack(getter, state.key, "default")
    if (stack && stack > 0) {
        return true
    }
    return false
}

/**
 * 创建自定义状态对象
 */
export function createState(map: StateMap): State {
    return new State(map)
}

/**
 * 根据 key 从 stateList 创建状态对象
 */
export function createStateByKey(key: string, stacks: Stack[] | number): State | undefined {
    const stateData = stateList.find(state => state.key === key)
    if (stateData) {
        return new State({
            ...stateData,
            stacks
        })
    }
    newError(["没有在状态数据表中找到指定的状态", key, stateList])
    return undefined
}

/**
 * 获取目标指定状态的指定层数值
 */
export function getStateStack(target: Target, stateKey: string, stackKey: string = "default"): number | false {
    const state = target.state.find(state => state.key === stateKey)
    if (state) {
        const stack = state.stacks.find(stack => stack.key === stackKey)
        if (stack) {
            return stack.stack
        }
    }
    return false
}

/**
 * 修改目标指定状态的指定层数值
 */
export function changeStateStack(
    newValue: number,
    target: Target,
    stateKey: string,
    stackKey: string = "default"
): boolean {
    const state = target.state.find(state => state.key === stateKey)
    if (state) {
        const stack = state.stacks.find(stack => stack.key === stackKey)
        if (stack) {
            stack.stack = newValue
        }

        // 判断新层数下该状态是否还可以存在
        if (state.checkExist(target, state)) {
            return true
        } else {
            // 状态层数归0，失去该状态
            // 这部分逻辑应由 StateModifier 处理
            return false
        }
    }

    return false
}
