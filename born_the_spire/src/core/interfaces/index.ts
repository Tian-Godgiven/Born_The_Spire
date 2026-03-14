/**
 * 接口中心 - 抽象接口层
 *
 * 这个文件定义所有核心类的接口
 * 只依赖 types 层，不依赖具体实现
 */

import type {
    EntityBase,
    ItemBase,
    TargetBase,
    TriggerWhen,
    TriggerHow
} from '../types'

/**
 * Status 接口
 */
export interface IStatus {
    readonly key: string
    readonly owner: IEntity
    readonly baseValue: number
    readonly value: number

    addModifier(modifier: IStatusModifier): () => void
    removeModifier(modifier: IStatusModifier): void
    recalculate(): void
}

/**
 * Current 接口
 */
export interface ICurrent {
    readonly key: string
    readonly owner: IEntity
    value: number
    maxValue?: number
}

/**
 * Trigger 接口
 */
export interface ITrigger {
    readonly owner: IEntity

    appendTrigger(triggerObj: ITriggerObj): { remove: () => void }
    onTrigger(when: TriggerWhen, how: TriggerHow, key: string, context: ITriggerContext, triggerLevel: number): void
}

/**
 * Entity 接口
 */
export interface IEntity extends EntityBase {
    status: Record<string, IStatus>
    current: Record<string, ICurrent>
    trigger: ITrigger
    describe: any[]

    appendTrigger(triggerObj: ITriggerObj): { remove: () => void }
    makeEvent(when: TriggerWhen, triggerKey: string, event: IActionEvent, effect: IEffect | null, triggerLevel: number): void
    viaEvent(when: TriggerWhen, triggerKey: string, event: IActionEvent, effect: IEffect | null, triggerLevel: number): void
    takeEvent(when: TriggerWhen, triggerKey: string, event: IActionEvent, effect: IEffect | null, triggerLevel: number): void
}

/**
 * Item 接口
 */
export interface IItem extends IEntity, ItemBase {
    interaction: IInteraction[]
    isDisabled: boolean
    useInteractions: IInteraction[]

    getInteraction(key: string): IInteraction | false
    getUseCount(): number
}

/**
 * Target 接口
 */
export interface ITarget extends IEntity, TargetBase {
    faction: string
}

/**
 * ActionEvent 接口
 */
export interface IActionEvent<
    S extends IEntity = IEntity,
    M extends IEntity = IEntity,
    T extends IEntity = IEntity
> {
    readonly key: string
    readonly uuId: string
    readonly source: S
    readonly medium: M
    readonly target: T | T[]
    triggerLevel: number | null
    info: Record<string, any>
    effects: IEffect[]
    simulate: boolean

    trigger(when: TriggerWhen, triggerLevel: number): void
    announce(): void
    execute(): Promise<void>
    spawnEvent(event: IActionEvent, triggerLevel?: number): void
}

/**
 * Effect 接口
 */
export interface IEffect {
    readonly key: string
    readonly event: IActionEvent
    readonly params: Record<string, any>
    participantType: 'effect'

    execute(): Promise<void>
}

/**
 * Modifier 接口
 */
export interface IModifier {
    readonly id: string
    readonly source: IEntity

    apply(): void
    remove(): void
}

/**
 * StatusModifier 接口
 */
export interface IStatusModifier extends IModifier {
    readonly statusKey: string
    readonly value: number
    readonly type: 'additive' | 'multiplicative' | 'final'
}

/**
 * Interaction 接口
 */
export interface IInteraction {
    key: string
    label?: string
    target: any
    effects: any[]
    triggers?: any
    modifiers?: any[]
}

/**
 * TriggerObj 接口
 */
export interface ITriggerObj {
    when: TriggerWhen
    how: TriggerHow
    key: string
    callback: (event: IActionEvent, effect: IEffect | null, triggerLevel: number) => void | Promise<void>
    level?: number
    importantKey?: string
    onlyKey?: string
}

/**
 * TriggerContext 接口
 */
export interface ITriggerContext {
    actionEvent: IActionEvent
    effect: IEffect | null
}
