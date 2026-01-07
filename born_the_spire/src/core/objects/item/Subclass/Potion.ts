import { PotionMap } from "@/static/list/item/potionList";
import { Item } from "../Item";
import { Entity } from "../../system/Entity";
import { getPotionModifier } from "../../system/modifier/PotionModifier";

export class Potion extends Item{
    public targetType:"player"|"enemy"|"all"
    public canDrop:boolean // 是否可丢弃

    constructor(
        map:PotionMap
    ){
        super(map)
        this.targetType = map.targetType;
        this.canDrop = map.canDrop ?? true; // 默认可丢弃
    }
}

/**
 * 获得药水（包装函数）
 */
export function getPotion(entity: Entity, source: Entity, potion: Potion) {
    const potionModifier = getPotionModifier(entity)
    potionModifier.acquirePotion(potion, source)
}

/**
 * 失去药水（包装函数）
 */
export function removePotion(entity: Entity, potion: Potion, triggerLoseEffect: boolean = false) {
    const potionModifier = getPotionModifier(entity)
    potionModifier.losePotion(potion, triggerLoseEffect)
}

/**
 * 使用药水（包装函数）
 */
export function usePotion(entity: Entity, potion: Potion, useIndex: number = 0, targets: Entity[]) {
    const potionModifier = getPotionModifier(entity)
    return potionModifier.usePotion(potion, useIndex, targets)
}

/**
 * 丢弃药水（包装函数）
 */
export function discardPotion(entity: Entity, potion: Potion) {
    const potionModifier = getPotionModifier(entity)
    return potionModifier.discardPotion(potion)
}
