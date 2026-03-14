/**
 * 工厂函数中心
 *
 * 提供创建各种对象的工厂函数
 * 用于替代直接 new 操作，解耦对象创建
 */

import type { IEntity, IItem, ITarget, IActionEvent } from '../interfaces'

/**
 * Entity 工厂函数（占位符）
 *
 * 后续阶段会实现具体逻辑
 */
export function createEntity(map: any): IEntity {
    throw new Error('EntityFactory not implemented yet - use original Entity class for now')
}

/**
 * Item 工厂函数（占位符）
 */
export function createItem(map: any): IItem {
    throw new Error('ItemFactory not implemented yet - use original Item class for now')
}

/**
 * Target 工厂函数（占位符）
 */
export function createTarget(map: any): ITarget {
    throw new Error('TargetFactory not implemented yet - use original Target class for now')
}

/**
 * ActionEvent 工厂函数（占位符）
 */
export function createActionEvent(
    key: string,
    source: IEntity,
    medium: IEntity,
    target: IEntity | IEntity[],
    info: Record<string, any>,
    effectUnits: any[]
): IActionEvent {
    throw new Error('ActionEventFactory not implemented yet - use original ActionEvent class for now')
}
