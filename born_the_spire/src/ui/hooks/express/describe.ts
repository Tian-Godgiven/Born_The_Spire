import { toString } from "lodash";
import { newError } from "../global/alert";
import type { Status } from "@/core/objects/system/status/Status";
import { toRaw } from "vue";
import { glossaryMap } from "@/static/list/system/glossaryMap";
import { isStatus } from "@/core/utils/typeGuards";
import { getLazyModule } from "@/core/utils/lazyLoader";
import { getCardModifier } from "@/core/objects/system/modifier/CardModifier";

//对象的描述，存储为数据，使用时翻译为对应的字符串
export type Describe = (
    string //字符串
|{
    key:string[] //需要访问的对象属性的key，如果获取的对象是数组则会在其中寻找key属性为对应值的对象
}|{
    $:string //术语标记，用于tooltip解释
}|{
    "@":string|number //卡牌实例引用（实例ID或索引）
}|{
    "#":string //卡牌key预览（用于临时效果）
})[]

/**
 * 描述片段类型
 */
export type DescribeSegment = {
    text: string
    type: 'plain' | 'value' | 'glossary' | 'card'
    glossaryKey?: string  // 如果是glossary类型
    cardRef?: string | number  // 如果是card类型（实例ID、key或索引）
    cardRefType?: 'instance' | 'key'  // card引用类型
    style?: Record<string, string>
}

//将描述对象翻译为文本
export function getDescribe(describe:Describe|undefined,target?:Object){
    let text = "";
    if(!describe)return text
    describe.forEach(value=>{
        //纯字符串直接添加
        if(typeof value == "string"){
            text += value
        }
        //是一个对象
        else if(value instanceof Object){
            //术语标记
            if("$" in value){
                const glossaryKey = value.$
                const glossary = glossaryMap[glossaryKey]
                if(glossary){
                    text += glossary.label
                }else{
                    text += glossaryKey
                }
            }
            //卡牌实例引用
            else if("@" in value){
                // @ 的值可能是索引（数字）或卡牌实例的 __id（字符串）
                const cardIndexOrId = value["@"]
                let cardLabel = "[卡牌]"

                if (typeof cardIndexOrId === 'number') {
                    // 先尝试 cards 数组，再 fallback 到 cardsByOwner.player
                    let cardKey: string | undefined
                    const targetCards = (target as any)?.cards
                    if (targetCards && Array.isArray(toRaw(targetCards))) {
                        cardKey = targetCards[cardIndexOrId]
                    }
                    if (!cardKey) {
                        const cardsByOwner = (target as any)?.cardsByOwner
                        if (cardsByOwner?.player) {
                            const playerCards = Array.isArray(cardsByOwner.player) ? cardsByOwner.player : [cardsByOwner.player]
                            cardKey = playerCards[cardIndexOrId]
                        }
                    }
                    if (cardKey && typeof cardKey === 'string') {
                        try {
                            const cardList = getLazyModule<any[]>('cardList')
                            const cardConfig = cardList.find((c: any) => c.key === cardKey)
                            if (cardConfig) cardLabel = cardConfig.label
                        } catch {
                            // cardList 尚未加载，保持默认值
                        }
                    }
                } else if (typeof cardIndexOrId === 'string') {
                    // 卡牌实例 ID，从器官的卡牌修饰器中查找
                    try {
                        if (target && 'targetType' in target && (target as any).targetType === 'organ') {
                            const organ = target as any
                            if (organ.owner) {
                                const cardModifier = getCardModifier(organ.owner)
                                const cardsFromOrgan = cardModifier.getCardsFromSource(organ)
                                const cardInstance = cardsFromOrgan.find((c: any) => c.__id === cardIndexOrId)
                                if (cardInstance) {
                                    cardLabel = cardInstance.label || cardInstance.key || "[卡牌]"
                                }
                            }
                        }
                    } catch {
                        // 查找失败，保持默认值
                    }
                }
                text += cardLabel
            }
            //卡牌key预览
            else if("#" in value){
                const cardKey = value["#"]
                let cardLabel = "[卡牌]"

                if (cardKey && typeof cardKey === 'string') {
                    try {
                        const cardList = getLazyModule<any[]>('cardList')
                        const cardConfig = cardList.find((c: any) => c.key === cardKey)
                        if (cardConfig) cardLabel = cardConfig.label
                    } catch {
                        // cardList 尚未加载，保持默认值
                    }
                }
                text += cardLabel
            }
            //这是一个数组，并且会尝试访问target的key属性
            else if("key" in value && target){
                const statusValue = getStatusDescribe(value.key,target)
                //将其添加到text中
                text += statusValue
            }
        }
    })

    return text

}

/**
 * 将描述对象翻译为结构化数据（用于渲染带样式的文本）
 */
export function getDescribeStructured(describe:Describe|undefined,target?:Object): DescribeSegment[]{
    const segments: DescribeSegment[] = []
    if(!describe) return segments

    describe.forEach(value=>{
        //纯字符串
        if(typeof value == "string"){
            segments.push({
                text: value,
                type: 'plain'
            })
        }
        //是一个对象
        else if(value instanceof Object){
            //术语标记
            if("$" in value){
                const glossaryKey = value.$
                const glossary = glossaryMap[glossaryKey]
                if(glossary){
                    segments.push({
                        text: glossary.label,
                        type: 'glossary',
                        glossaryKey: glossaryKey,
                        style: glossary.style
                    })
                }else{
                    // 未找到术语定义，当作普通文本
                    segments.push({
                        text: glossaryKey,
                        type: 'plain'
                    })
                }
            }
            //卡牌实例引用
            else if("@" in value){
                const cardIndex = value["@"]
                let cardLabel = "[卡牌]"

                // 先尝试 cards 数组，再 fallback 到 cardsByOwner.player
                let cardKey: string | undefined
                const targetCards = (target as any)?.cards
                if (targetCards && Array.isArray(targetCards)) {
                    cardKey = targetCards[cardIndex]
                }
                if (!cardKey) {
                    const cardsByOwner = (target as any)?.cardsByOwner
                    if (cardsByOwner?.player) {
                        const playerCards = Array.isArray(cardsByOwner.player) ? cardsByOwner.player : [cardsByOwner.player]
                        cardKey = playerCards[cardIndex]
                    }
                }
                if (cardKey && typeof cardKey === 'string') {
                    try {
                        const cardList = getLazyModule<any[]>('cardList')
                        const cardConfig = cardList.find((c: any) => c.key === cardKey)
                        if (cardConfig) {
                            cardLabel = cardConfig.label
                        }
                    } catch {
                        // cardList 尚未加载
                    }
                }

                const segment = {
                    text: cardLabel,
                    type: 'card' as const,
                    cardRef: cardIndex,
                    cardRefType: 'instance' as const
                }
                segments.push(segment)
            }
            //卡牌key预览
            else if("#" in value){
                const cardKey = value["#"]
                let cardLabel = "[卡牌]"

                // 使用懒加载获取 cardList
                const cardList = getLazyModule<any[]>('cardList')
                const cardConfig = cardList.find((c: any) => c.key === cardKey)
                if (cardConfig) {
                    cardLabel = cardConfig.label
                }

                segments.push({
                    text: cardLabel,
                    type: 'card',
                    cardRef: cardKey,
                    cardRefType: 'key'
                })
            }
            //访问对象属性
            else if("key" in value && target){
                const statusValue = getStatusDescribe(value.key,target)
                segments.push({
                    text: statusValue,
                    type: 'value'
                })
            }
        }
    })

    return segments
}

/**
 * 从描述中提取所有术语标记
 */
export function extractGlossaries(describe:Describe|undefined): string[]{
    const glossaries: string[] = []
    if(!describe) return glossaries

    describe.forEach(value=>{
        if(typeof value === "object" && "$" in value){
            glossaries.push(value.$)
        }
    })

    return glossaries
}

//处理对象的，关于属性的描述文本：提取对应的属性值字符串，提取失败的话会报错
function getStatusDescribe(keys:string[],target:Record<string,any>){
    let item = target
    //最后找到的属性字符串
    let result:string = ""
    for(let key of keys){
        //如果Item是数组,则会在item中寻找key与目标相同的对象，并设为item
        if(Array.isArray(item)){
            const tmp = item.find(tmp=>tmp?.key == key)
            if(tmp){
                item = tmp
            }
        }
        //否则认为item是普通的对象，尝试访问其的key属性值，并将其设为item
        else{
            //成功访问到了其中的key属性值
            if(item.hasOwnProperty(key)){
                const value = item[key]
                if(typeof value == "object"){
                    //消除代理
                    const rawValue = toRaw(value)
                    // 使用 typeGuard 检查是否为 Status 对象
                    if(isStatus(rawValue)){
                        result = toString(rawValue.value)
                        break;
                    }
                    else{
                        item = rawValue
                    }

                }
                else{
                    result = toString(value)
                }
            }
            //没能在其中找到key属性值，这属于是路径有误，进行报错
            else{
                newError(["没有在target中找到需要的属性",
                    "总目标：",target,
                    "尝试寻找的key路径",keys,
                    "按路径最后找到的对象\
                        （即在这个对象里没有找到需要的属性）及属性key",
                    item,key])
            }
            
        }
    }
    //遍历完了，但尝试访问的属性值可能是带有value的对象，此时result应该为空
    if(result == "" && "value" in item){
        //此时我们认为这个item.value是我们需要返回的值(参见Status对象)
        result = item.value
    }
    return result
}