/**
 * 类型中心 - 纯类型定义层
 *
 * 这个文件只包含纯类型定义，不依赖任何具体实现
 * 所有其他层都可以安全地导入这里的类型
 */

/**
 * 事件参与者类型标识
 */
export type ParticipantType = 'entity' | 'state' | 'effect'

/**
 * 实体类型标识
 */
export type EntityType = 'entity' | 'target' | 'item'

/**
 * 物品类型标识
 */
export type ItemType = 'item' | 'card' | 'potion' | 'relic'

/**
 * 目标类型标识
 */
export type TargetType = 'target' | 'player' | 'enemy' | 'organ'

/**
 * 触发时机
 */
export type TriggerWhen = 'before' | 'after'

/**
 * 触发方式
 */
export type TriggerHow = 'make' | 'via' | 'take'

/**
 * 修饰器应用模式
 */
export type ModifierApplyMode = 'absolute' | 'snapshot'

/**
 * 修饰器类型
 */
export type ModifierType = 'additive' | 'multiplicative' | 'final'

/**
 * 基础标识符接口
 */
export interface Identifiable {
    __id: string
}

/**
 * 可标记接口
 */
export interface Labelable {
    label: string
}

/**
 * 事件参与者基础接口
 */
export interface EventParticipantBase extends Identifiable {
    participantType: ParticipantType
}

/**
 * 实体基础接口
 */
export interface EntityBase extends EventParticipantBase, Labelable {
    participantType: 'entity'
}

/**
 * 物品基础接口
 */
export interface ItemBase extends EntityBase {
    itemType: ItemType
    key: string
}

/**
 * 目标基础接口
 */
export interface TargetBase extends EntityBase {
    targetType: TargetType
}
