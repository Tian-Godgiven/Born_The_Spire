import type { Entity } from "../Entity"
import type { Target } from "../../target/Target"
import type { StateData } from "../State"
import type { LogUnit } from "@/ui/hooks/global/log"
import type { TriggerEventConfig } from "@/core/types/object/trigger"
import { newLog } from "@/ui/hooks/global/log"

import { doEvent } from "../ActionEvent"
import { resolveTriggerEventTarget } from "../trigger/Trigger"
import { isEntity } from "@/core/utils/typeGuards"
import { nanoid } from "nanoid"
import _ from "lodash"
import { State } from "../State"
import { modifierManager } from "@/core/managers/ModifierManager"
import { computed, reactive } from "vue"
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
    private units: StateModifierUnit[] = reactive([])  // 响应式，用于触发 UI 更新

    constructor(owner: Target) {
        this.owner = owner
    }

    // 响应式的状态列表（用于 UI 显示）
    public states = computed(() => {
        return this.units.map(u => u.state)
    })

    /**
     * 添加状态
     *
     * @param stateData - 状态数据
     * @param stacks - 初始层数（可以是数字或 Stack[]）
     * @param source - 状态来源
     */
    addState(stateData: StateData, stacks: number | Array<{key: string, stack: number}>, source: Entity) {
        // 检查是否已有该状态
        const existingState = this.getState(stateData.key)

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

        // 创建 unit 管理副作用（同时添加到响应式 units 数组）
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

        // 获取状态的 reaction（用于 action 格式）
        const stateReaction = state.interaction.possess?.reaction

        for (const triggerDef of triggersMap) {
            const when = triggerDef.when || "before"
            const how = triggerDef.how
            const key = triggerDef.key
            const level = triggerDef.level || 0

            // 兼容旧格式：直接定义事件配置
            if ("event" in triggerDef) {
                const eventConfigs = Array.isArray(triggerDef.event) ? triggerDef.event : [triggerDef.event]
                for (const eventConfig of eventConfigs) {
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

                            // 使用 doEvent 创建事件，确保正确触发触发器
                            doEvent({
                                key: clonedEventConfig.key,
                                source: state as any,
                                medium: state as any,
                                target: target as any,  // 类型断言：resolveTriggerEventTarget 返回 Entity | Entity[]，需要转换为 EventParticipant
                                info: {...clonedEventConfig.info},
                                effectUnits: clonedEventConfig.effect || []
                            })
                        }
                    })

                    // 收集 remover
                    const triggerKey = (triggerDef as any).importantKey || triggerDef.key
                    unit.registerTriggerRemover(triggerRemover.remove, triggerKey)
                }
            } else if ("action" in triggerDef) {
                // 新格式：通过 action 查找 reaction
                const action = (triggerDef as any).action
                if (!action) continue

                const reactionEvents = stateReaction?.[action]
                if (!reactionEvents) {
                    console.error(`[setupStateTriggers] 状态 ${state.key} 的 action "${action}" 找不到对应的 reaction`)
                    continue
                }

                const triggerRemover = this.owner.appendTrigger({
                    when,
                    how,
                    key,
                    level,
                    callback: (event, effect, _triggerLevel) => {
                        // 直接处理事件创建，确保 source 是状态本身
                        for (let eventConfig of reactionEvents) {
                            const { key: eventKey, info = {}, targetType, mediumTargetType, effect: effectUnit } = eventConfig as TriggerEventConfig
                            // 如果 targetType 是 triggerEffect 但 triggerEffect 为 null（事件级触发），跳过
                            if (targetType === "triggerEffect" && !effect) continue
                            // 获取目标（默认不允许 null）
                            const eventTarget = resolveTriggerEventTarget(
                                targetType, event, effect,
                                state as any, this.owner
                            )

                            // 确定事件的 medium（使用统一的 resolveTarget 系统）
                            const mediumTarget = mediumTargetType || "owner"
                            const eventMedium = resolveTriggerEventTarget(
                                mediumTarget, event, effect,
                                state as any, this.owner
                            )

                            // 使用 doEvent 创建事件，source 设置为状态本身！
                            const newEvent = doEvent({
                                key: eventKey,
                                source: state as any,  // 关键：source 是状态，这样 $source.stateStack() 才能工作
                                medium: isEntity(eventMedium) ? eventMedium : (state as any),
                                target: eventTarget as any,
                                info: info,
                                effectUnits: effectUnit ?? []
                            })

                            // 保存触发器上下文
                            newEvent.triggerContext = event.triggerContext || {
                                source: state as any,
                                owner: this.owner,
                                triggerEvent: event
                            }
                        }
                    }
                })

                // 收集 remover
                const triggerKey = (triggerDef as any).importantKey || triggerDef.key
                unit.registerTriggerRemover(triggerRemover.remove, triggerKey)
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
                when: "before", // 在 before 阶段执行，确保业务触发器（after）看到衰减后的状态
                how: "take",    // 承受时间事件（监听 turnStart, turnEnd 等）
                key: timing,    // 监听的事件 key
                level: -1,      // 低于默认优先级，允许其他 before 触发器在衰减前读取状态值
                callback: (_event, _effect, _triggerLevel) => {
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

                    // 使用 doEvent 创建自动衰减事件
                    doEvent({
                        key: `${state.key}_stackChange`,
                        source: state as any,
                        medium: state as any,
                        target: this.owner,
                        info: { level: 0 },
                        effectUnits: effectUnits
                    })
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
        const state = this.getState(stateKey)
        if (!state) {
            return false
        }

        const parentLog = newLog([this.owner, "失去了状态", state])

        // 找到对应的 unit
        const unitIndex = this.units.findIndex(u => u.state === state)
        if (unitIndex !== -1) {
            const unit = this.units[unitIndex]
            // 清理副作用
            unit.cleanup(parentLog)
            // 移除 unit（响应式数组，会自动触发 UI 更新）
            this.units.splice(unitIndex, 1)
        }

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
        const state = this.getState(stateKey)
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
        const unit = this.units.find(u => u.state.key === stateKey)
        return unit?.state
    }

    /**
     * 检查是否拥有指定状态
     */
    hasState(stateKey: string): boolean {
        return this.units.some(u => u.state.key === stateKey)
    }

    /**
     * 获取所有状态（用于内部逻辑）
     */
    getAllStates(): State[] {
        return this.units.map(u => u.state)
    }
}

/**
 * 为 Target 初始化状态管理器
 */
export function initStateModifier(target: Target): StateModifier {
    const modifier = new StateModifier(target)

    // 注册到全局 ModifierManager
    import("@/core/managers/ModifierManager").then(({ modifierManager }) => {
        modifierManager.registerStateModifier(target, modifier)
    })

    return modifier
}

/**
 * 获取 Target 的状态管理器
 */
export function getStateModifier(target: Target): StateModifier {
    // 先尝试从 ModifierManager 获取
    let modifier: StateModifier | undefined

    // 同步导入检查（如果已加载）
    try {
        modifier = modifierManager.getStateModifier(target)
    } catch {
        // ModifierManager 未加载，创建新实例
    }

    if (!modifier) {
        modifier = initStateModifier(target)
    }

    return modifier
}
