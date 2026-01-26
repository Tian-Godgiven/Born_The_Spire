import { Entity } from "../Entity"
import { Target } from "../../target/Target"
import { State, StateData } from "../State"
import { newLog, LogUnit } from "@/ui/hooks/global/log"
import { doEvent, ActionEvent } from "../ActionEvent"
import { resolveTriggerEventTarget } from "../trigger/Trigger"
import { nanoid } from "nanoid"
import _ from "lodash"

/**
 * StateModifierUnit - 管理单个 state 的副作用
 */
class StateModifierUnit {
    public __id: string = nanoid()
    public state: State
    public triggerRemovers: Array<{ remover: () => void, label: string }> = []

    constructor(state: State) {
        this.state = state
    }

    /**
     * 注册触发器清理函数
     */
    registerTriggerRemover(remover: () => void, label: string) {
        this.triggerRemovers.push({ remover, label })
    }

    /**
     * 清理所有副作用
     */
    cleanup(parentLog?: LogUnit) {
        // 清理触发器
        for (const { remover, label } of this.triggerRemovers) {
            remover()
            if (parentLog) {
                newLog(["移除触发器:", label], parentLog)
            }
        }
        this.triggerRemovers = []
    }
}

/**
 * StateModifier - 状态管理器
 *
 * 管理 Target 身上的所有状态及其副作用
 */
export class StateModifier {
    public owner: Target
    private units: StateModifierUnit[] = []

    constructor(owner: Target) {
        this.owner = owner
    }

    /**
     * 添加状态
     *
     * @param stateData - 状态数据
     * @param stacks - 初始层数（可以是数字或 Stack[]）
     * @param source - 状态来源
     */
    addState(stateData: StateData, stacks: number | Array<{key: string, stack: number}>, source: Entity) {
        // 检查是否已有该状态
        const existingState = this.owner.state.find(s => s.key === stateData.key)

        if (existingState) {
            // 已有该状态，根据 repeate 行为处理
            this.handleRepeatState(existingState, stacks, source)
            return
        }

        // 深拷贝 stateData，避免污染原始数据
        const clonedStateData = _.cloneDeep(stateData)

        // 创建新状态
        const state = new State({
            ...clonedStateData,
            stacks: stacks
        })

        // 添加到 owner 的 state 列表
        this.owner.state.push(state)

        // 创建 unit 管理副作用
        const unit = new StateModifierUnit(state)
        this.units.push(unit)

        newLog([this.owner, "获得了状态", state])

        // 处理 apply 交互（一次性效果）
        const applyInteraction = state.interaction.apply
        if (applyInteraction?.effects) {
            doEvent({
                key: "applyState",
                source,
                medium: state as any,
                target: this.owner,
                effectUnits: applyInteraction.effects
            })
        }

        // 处理 possess 交互（持续效果）
        const possessInteraction = state.interaction.possess
        if (possessInteraction && possessInteraction.triggers) {
            this.setupStateTriggers(state, unit, possessInteraction.triggers)
        }

        // 处理 stackChange（自动生成触发器）
        if (state.stackChange) {
            this.setupStackChangeTriggers(state, unit)
        }

        return state
    }

    /**
     * 处理重复获得状态
     */
    private handleRepeatState(
        state: State,
        stacks: number | Array<{key: string, stack: number}>,
        _source: Entity
    ) {
        const behavior = state.repeate

        if (behavior === "stack") {
            // 叠加层数
            if (typeof stacks === "number") {
                const defaultStack = state.stacks.find(s => s.key === "default")
                if (defaultStack) {
                    defaultStack.stack += stacks
                    newLog([this.owner, "的", state, "层数增加", stacks])
                }
            } else {
                // 处理多个层数
                for (const newStack of stacks) {
                    const existingStack = state.stacks.find(s => s.key === newStack.key)
                    if (existingStack) {
                        existingStack.stack += newStack.stack
                        newLog([this.owner, "的", state, `(${newStack.key})`, "层数增加", newStack.stack])
                    }
                }
            }
        } else if (behavior === "refresh") {
            // 刷新层数
            if (typeof stacks === "number") {
                const defaultStack = state.stacks.find(s => s.key === "default")
                if (defaultStack) {
                    defaultStack.stack = stacks
                    newLog([this.owner, "的", state, "层数刷新为", stacks])
                }
            } else {
                for (const newStack of stacks) {
                    const existingStack = state.stacks.find(s => s.key === newStack.key)
                    if (existingStack) {
                        existingStack.stack = newStack.stack
                        newLog([this.owner, "的", state, `(${newStack.key})`, "层数刷新为", newStack.stack])
                    }
                }
            }
        } else if (behavior === "none") {
            // 不做任何处理
            newLog([this.owner, "已有", state, "，无法重复获得"])
        }
    }

    /**
     * 设置状态的触发器
     */
    private setupStateTriggers(
        state: State,
        unit: StateModifierUnit,
        triggersMap: NonNullable<NonNullable<StateData["interaction"]>["possess"]>["triggers"]
    ) {
        if (!triggersMap) return

        for (const triggerDef of triggersMap) {
            const when = triggerDef.when || "before"
            const how = triggerDef.how
            const key = triggerDef.key
            const level = triggerDef.level || 0

            for (const eventConfig of triggerDef.event) {
                // 深拷贝 eventConfig，避免触发器回调中修改原始数据
                const clonedEventConfig = _.cloneDeep(eventConfig)

                const triggerRemover = this.owner.appendTrigger({
                    when,
                    how,
                    key,
                    level,
                    callback: (event, effect, _triggerLevel) => {
                        // 解析目标
                        const target = resolveTriggerEventTarget(
                            clonedEventConfig.targetType,
                            event,
                            effect,
                            state as any,      // triggerSource: 状态本身（State 作为触发源）
                            this.owner  // triggerOwner: 拥有者
                        )

                        // 执行事件

                        // 创建新事件
                        const newEvent = new ActionEvent(
                            clonedEventConfig.key,
                            state as any,
                            state as any,
                            target,
                            {...clonedEventConfig.info},
                            clonedEventConfig.effect
                        )

                        // 关联到父事件并传递 triggerLevel
                        event.spawnEvent(newEvent)
                        newEvent.happen(() => {}, _triggerLevel)
                    }
                })

                // 收集 remover
                unit.registerTriggerRemover(triggerRemover.remove, `${triggerDef.importantKey || triggerDef.key}`)
            }
        }
    }

    /**
     * 设置 stackChange 自动生成的触发器
     */
    private setupStackChangeTriggers(state: State, unit: StateModifierUnit) {
        if (!state.stackChange) return

        for (const rule of state.stackChange) {
            const stackKey = rule.stackKey ?? "default"
            const delta = rule.delta
            const timing = rule.timing

            // 创建触发器
            const triggerRemover = this.owner.appendTrigger({
                when: "after",  // 在时间事件之后执行
                how: "take",    // 承受时间事件（监听 turnStart, turnEnd 等）
                key: timing,    // 监听的事件 key
                level: 0,
                callback: (event, _effect, triggerLevel) => {
                    // 构建 effect
                    const effectUnits = []

                    if (delta === "all") {
                        // 清空层数（设为0）
                        const stack = state.stacks.find(s => s.key === stackKey)
                        if (stack) {
                            effectUnits.push({
                                key: "changeStateStack",
                                params: {
                                    stateKey: state.key,
                                    stackKey: stackKey,
                                    delta: -stack.stack  // 减去当前层数，归0
                                }
                            })
                        }
                    } else {
                        // 普通的层数变化
                        effectUnits.push({
                            key: "changeStateStack",
                            params: {
                                stateKey: state.key,
                                stackKey: stackKey,
                                delta: delta
                            }
                        })
                    }

                    // 创建自动衰减事件
                    const newEvent = new ActionEvent(
                        `${state.key}_stackChange`,
                        state as any,      // source: 状态自己
                        state as any,      // medium: 状态自己
                        this.owner, // target: 持有者
                        { level: 0 },
                        effectUnits
                    )

                    // 关联到父事件并传递 triggerLevel
                    event.spawnEvent(newEvent)
                    newEvent.happen(() => {}, triggerLevel)
                }
            })

            // 收集 remover
            unit.registerTriggerRemover(triggerRemover.remove, `stackChange:${timing}:${stackKey}`)
        }
    }

    /**
     * 移除状态
     */
    removeState(stateKey: string, triggerRemoveEffect: boolean = false) {
        const stateIndex = this.owner.state.findIndex(s => s.key === stateKey)
        if (stateIndex === -1) {
            return false
        }

        const state = this.owner.state[stateIndex]
        const parentLog = newLog([this.owner, "失去了状态", state])

        // 找到对应的 unit
        const unitIndex = this.units.findIndex(u => u.state === state)
        if (unitIndex !== -1) {
            const unit = this.units[unitIndex]
            // 清理副作用
            unit.cleanup(parentLog)
            // 移除 unit
            this.units.splice(unitIndex, 1)
        }

        // 从 owner 的 state 列表移除
        this.owner.state.splice(stateIndex, 1)

        // 触发 remove 交互（一次性效果）
        if (triggerRemoveEffect) {
            const removeInteraction = state.interaction.remove
            if (removeInteraction?.effects) {
                doEvent({
                    key: "removeState",
                    source: this.owner,
                    medium: state,
                    target: this.owner,
                    effectUnits: removeInteraction.effects
                })
            }
        }

        return true
    }

    /**
     * 修改状态层数
     * 如果层数归0，自动移除状态
     */
    changeStack(stateKey: string, stackKey: string, delta: number) {
        const state = this.owner.state.find(s => s.key === stateKey)
        if (!state) return false

        const stack = state.stacks.find(s => s.key === stackKey)
        if (!stack) return false

        const oldValue = stack.stack
        const newValue = oldValue + delta
        stack.stack = newValue

        newLog([this.owner, "的", state, `(${stackKey})`, "层数", oldValue, "→", newValue])

        // 检查状态是否还应该存在
        if (!state.checkExist(this.owner, state)) {
            // 自动移除
            this.removeState(stateKey, true)
            return false
        }

        return true
    }

    /**
     * 获取指定状态
     */
    getState(stateKey: string): State | undefined {
        return this.owner.state.find(s => s.key === stateKey)
    }

    /**
     * 检查是否拥有指定状态
     */
    hasState(stateKey: string): boolean {
        return this.owner.state.some(s => s.key === stateKey)
    }

    /**
     * 获取所有状态
     */
    getAllStates(): State[] {
        return this.owner.state
    }
}

// 使用 WeakMap 存储 StateModifier 实例
const stateModifierMap = new WeakMap<Target, StateModifier>()

/**
 * 为 Target 初始化状态管理器
 */
export function initStateModifier(target: Target): StateModifier {
    const modifier = new StateModifier(target)
    stateModifierMap.set(target, modifier)
    return modifier
}

/**
 * 获取 Target 的状态管理器
 */
export function getStateModifier(target: Target): StateModifier {
    let modifier = stateModifierMap.get(target)
    if (!modifier) {
        modifier = initStateModifier(target)
    }
    return modifier
}
