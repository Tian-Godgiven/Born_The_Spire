import { CardMap } from "@/static/list/item/cardList";
import { Target } from "@/core/objects/target/Target";
import { Item } from "@/core/objects/item/Item";
import { doEvent, ActionEvent } from "@/core/objects/system/ActionEvent";
import { beginTransaction, endTransaction } from "@/core/objects/game/transaction";
import { CardPiles, Player } from "@/core/objects/target/Player";
import { Entity } from "@/core/objects/system/Entity";
import { EffectUnit } from "@/core/objects/system/effect/EffectUnit";
import { newError } from "@/ui/hooks/global/alert";
import { getStatusValue } from "@/core/objects/system/status/Status";
import { getCardModifier } from "@/core/objects/system/modifier/CardModifier";
import { getEntryModifier } from "@/core/objects/system/modifier/EntryModifier";

/**
 * 卡牌对象
 *
 * 卡牌的使用后处理（弃牌/消耗等）通过 getAfterUseEffect 方法决定。
 * 词条可以通过覆盖此方法来改变卡牌使用后的去向：
 * - 默认：移入弃牌堆
 * - exhaust 词条：移入消耗堆
 * - void 词条：回合结束时的特殊处理
 */
export class Card extends Item{
    public source?: Entity  // 卡牌来源（可能是器官、遗物或其他来源）
    public owner?: Entity   // 卡牌持有者（通常是 Player）
    public tags?: string[]  // 卡牌标签（用于分类和筛选）

    constructor(map:CardMap){
        super(map)
        this.tags = map.tags
    }

    /**
     * 检查卡牌是否有某个词条
     * @param entryKey 词条 key
     * @returns 是否有该词条
     */
    hasEntry(entryKey: string): boolean {
        const entryModifier = getEntryModifier(this)
        return entryModifier.hasEntry(entryKey)
    }

    /**
     * 设置卡牌持有者并应用词条
     * @param owner 持有者（通常是 Player）
     * @param entries 要应用的词条列表（从 CardMap 中获取）
     */
    setOwner(owner: Entity, entries?: string[]) {
        this.owner = owner

        // 应用卡牌词条
        if (entries && entries.length > 0) {
            const entryModifier = getEntryModifier(this)
            for (const entryKey of entries) {
                const result = entryModifier.addEntry(entryKey)
                if (result !== true) {
                    console.warn(`[Card.setOwner] 词条应用失败: ${entryKey}`, result)
                }
            }
        }
    }

    /**
     * 获取卡牌使用后的处理效果
     * 此方法可被词条覆盖以改变卡牌使用后的去向
     * @param fromPile 卡牌所在的牌堆（通常是手牌）
     * @returns 使用后的处理效果
     */
    getAfterUseEffect(fromPile:Card[]): EffectUnit {
        // 默认：弃牌
        return {
            key:"pay_discard",
            describe:["将卡牌移入弃牌堆"],
            params:{sourcePile:fromPile,card:this}
        }
    }
}

//对目标使用卡牌
export async function useCard(card:Card,fromPile:Card[],source:Player,targets:Target[]){
    // 检查卡牌来源是否有效（如果有来源）
    if(card.source) {
        const cardModifier = getCardModifier(source)
        const canPlay = cardModifier.canPlayCard(card)
        if(canPlay !== true) {
            // 来源无效，无法打出
            newError(["无法使用该卡牌:", canPlay])
            return
        }
    }

    const cardCost = getStatusValue(card,"cost")
    //支付能量
    const costEffect:EffectUnit = {
        key:"pay_costEnergy",
        describe:[`支付${cardCost}点能量`],
        params:{cost:cardCost},
        resultStoreAs:"costEnergyResult"
    }
    //卡牌效果
    const cardUse = card.getInteraction("use")
    if(!cardUse){
        newError(["该卡牌没有使用效果，无法使用该卡牌"])//未完成：不完善，应该是取消选择
        return
    }
    const cardEffects = cardUse.effects

    // 创建事务并等待支付能量的结果
    const tx = beginTransaction()
    const payEvent = new ActionEvent(
        "payEnergy",
        source,
        card,
        source,  // 支付能量的目标是玩家自己
        {},
        [costEffect]
    )
    tx.add(payEvent)
    await endTransaction()

    // 检查支付结果
    const paySuccess = payEvent.getEventResult("costEnergyResult")
    if (!paySuccess) {
        // 支付失败，不执行后续操作
        return
    }

    // 支付成功，触发 useCard 事件（用于触发器）
    doEvent({
        key: "useCard",
        source,
        medium: card,
        target: targets,
        effectUnits: []  // 没有直接效果，只用于触发器
    })

    // 执行卡牌效果
    doEvent({
        key: "cardEffect",
        source,
        medium: card,
        target: targets,
        effectUnits: cardEffects
    })

    // 使用后处理（弃牌/消耗等）
    const afterUseEffect = card.getAfterUseEffect(fromPile)
    doEvent({
        key: "afterUseCard",
        source,
        medium: card,
        target: card,
        effectUnits: [afterUseEffect]
    })
}

//从抽牌堆中抽取n张卡牌,这是一个事件
export async function drawCardFromDrawPile(player:Player,number:number,medium:Entity){
    doEvent({
        key:"drawFromDrawPile",
        source:player,
        medium,
        target:player,
        effectUnits:[{
            key:"drawFromDrawPile",
            describe:[`从抽牌堆抽取${number}张卡牌`],
            params:{value:number},
        }]
    })
}

//抽取指定卡牌到手牌中
export async function drawCard(sourcePileName:keyof CardPiles,card:Card,player:Player,medium:Entity){
    doEvent({
        key:"drawCard",
        source:player,
        medium,
        target:card,
        effectUnits:[{
            key:"drawCard",
            params:{sourcePileName,card},
        }]
    })
}

//丢弃卡牌，使得一张卡牌进入玩家的弃牌堆
export async function discardCard(sourcePileName:keyof CardPiles,card:Card,player:Player,medium:Entity){
    doEvent({
        key:"discard",
        source:player,medium,
        target:card,
        effectUnits:[{
            key:"discard",
            params:{sourcePileName,card},
        }]
    })
}
//丢弃玩家指定的牌堆中的所有牌
export async function discardAllPile(player:Player,pileName:keyof CardPiles,medium:Entity){
    const pile = player.cardPiles[pileName]
    //创建一个事件，效果是丢弃所有卡牌
    doEvent({
        key:"discardAllPile",
        source:player,medium,
        target:pile,
        effectUnits:[{
            key:"discardAll",
            describe:["丢弃所有卡牌"],
            params:{pileName},
        }]
    })
}
