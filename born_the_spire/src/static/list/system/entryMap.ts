import { Describe } from "@/ui/hooks/express/describe"
import { Entity } from "@/core/objects/system/Entity"
import { Card } from "@/core/objects/item/Subclass/Card"
import { Player } from "@/core/objects/target/Player"

type Entry = {
    label: string        // 显示名称
    describe: Describe   // 描述
}

export const entryMap:Record<string,Entry> = {
    //消耗
    exhaust:{
        label: "消耗",
        describe:["使用后，将其移入消耗堆，而非弃牌堆"]
    },
    void:{
        label: "虚无",
        describe:["若回合结束时仍在手牌中，会移入消耗堆而非弃牌堆"]
    }
}

// 词条定义（包含实现逻辑）
type EntryDefinition = {
    describe: Describe
    conflictsWith?: string[]  // 冲突的词条
    onApply: (owner: Entity, parentOwner?: Entity) => Array<() => void>  // 返回移除函数数组
}

export const entryList: Record<string, EntryDefinition> = {
    // 消耗词条
    exhaust: {
        describe: ["使用后，将其移入消耗堆，而非弃牌堆"],
        conflictsWith: ["void"],  // 与其他"使用后去向"词条互斥
        onApply: (owner, parentOwner) => {
            // owner 应该是 Card，parentOwner 应该是 Player
            if (!(owner instanceof Card)) {
                return []
            }
            if (!(parentOwner instanceof Player)) {
                return []
            }

            const card = owner

            // 保存原方法
            const originalMethod = card.getAfterUseEffect.bind(card)

            // 覆盖方法：使用后移入消耗堆
            card.getAfterUseEffect = (fromPile) => ({
                key: "pay_exhaust",
                describe: ["将卡牌移入消耗堆"],
                params: {
                    sourcePile: fromPile,
                    card
                }
            })

            // 返回恢复函数
            return [() => {
                card.getAfterUseEffect = originalMethod
            }]
        }
    }
}