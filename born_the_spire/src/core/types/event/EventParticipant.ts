/**
 * 事件参与者接口
 *
 * 所有可以参与事件的对象都必须实现此接口
 * 包括：Entity（实体）、State（状态）、Effect（效果）等
 */
export interface EventParticipant {
    /** 唯一标识符 */
    __id: string

    /** 显示名称 */
    label: string

    /** 参与者类型 */
    participantType: ParticipantType
}

/**
 * 参与者类型枚举
 */
export type ParticipantType =
    | 'entity'      // 实体（Entity及其子类：Player, Enemy, Organ, Card, Potion, Relic）
    | 'state'       // 状态（State）
    | 'effect'      // 效果（Effect）
