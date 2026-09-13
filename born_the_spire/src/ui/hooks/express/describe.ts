import { toString } from "lodash";
import { newError } from "../global/alert";
import type { Status } from "@/core/objects/system/status/Status";
import { toRaw } from "vue";
import { resolveGlossary } from "./glossaryResolve";
import { isStatus, isChara } from "@/core/utils/typeGuards";
import { getLazyModule } from "@/core/utils/lazyLoader";
import { getCardModifier } from "@/core/objects/system/modifier/CardModifier";
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier";
import { fxHasKind, normalizeFxKeys } from "@/ui/animation/describeFx";

//对象的描述，存储为数据，使用时翻译为对应的字符串
// 字符串恰好为 "<br>" 时是换行分隔符，不是要显示的文字
export type Describe = (
    string
    | number //数字（会被转换为字符串）
|{
    key:string[] //需要访问的对象属性的key，如果获取的对象是数组则会在其中寻找key属性为对应值的对象
}|{
    $:string //术语标记，用于tooltip解释
}|{
    "@":string|number //卡牌实例引用（实例ID或索引）
}|{
    "#":string //卡牌key预览（用于临时效果）
}|{
    organ:string //器官 key 预览（事件选项「将会获得某某器官」）
    evolutionRounds?:number
}|{
    relic:string //遗物 key 预览
}|{
    text:string //这段要演出的正文
    fx:string | string[] // describeFx 注册表里的特效 key。reveal（beat）和 motion（shake）可叠
    wait?:number //上一段 beat 打完后再等几秒再开始；第一段从正文出现时算。不写当作 0
    char?:number //beat 每个字间隔秒数。不写当作 0.08
})[]

export const DEFAULT_BEAT_CHAR = 0.08

/**
 * 描述片段类型
 */
export type DescribeSegment = {
    text: string
    type: 'plain' | 'value' | 'glossary' | 'card' | 'break' | 'organ' | 'relic' | 'fx'
    glossaryKey?: string  // 如果是glossary类型
    cardRef?: string | number  // 如果是card类型（实例ID、key或索引）
    cardRefType?: 'instance' | 'key'  // card引用类型
    organKey?: string
    evolutionRounds?: number
    relicKey?: string
    fxKeys?: string[]
    beatStart?: number
    beatChar?: number
    style?: Record<string, string>
}

function listItemLabel(moduleKey: "organList" | "relicList", key: string, fallback: string): string {
    try {
        const list = getLazyModule<{ key: string, label?: string }[]>(moduleKey)
        return list.find(item => item.key === key)?.label ?? fallback
    } catch {
        return fallback
    }
}

/** 字符串（含事件选项的 /br/）或 Describe 都收成同一套数组。 */
export function normalizeDescribe(value: Describe | string | number | undefined | null): Describe {
    if (value == null || value === "") return []
    if (Array.isArray(value)) return value
    if (typeof value === "number") return [String(value)]
    const parts = String(value).split(/\s*\/br\/\s*/).filter(part => part.length > 0)
    if (parts.length <= 1) return parts.length ? [parts[0]] : []
    const out: Describe = []
    parts.forEach((part, index) => {
        if (index > 0) out.push("<br>")
        out.push(part)
    })
    return out
}

function formatCardLabel(label: string, level: number): string {
    return level > 0 ? `${label}+` : label
}

function countOrganCardForges(organ: any): number {
    if (!organ) return 0
    const level = organ.level ?? 1
    const milestones = organ.upgradeConfig?.milestones ?? organ.upgrade?.milestones ?? []
    return milestones.filter((m: any) =>
        m.level <= level &&
        m.effects?.some((e: any) => e.key === "upgradeOrganCards")
    ).length
}

function organCardKeyAtIndex(organ: any, index: number): string | undefined {
    const cards = organ?.cards
    if (Array.isArray(cards) && cards[index]) return cards[index]
    const playerCards = organ?.cardsByOwner?.player
    if (Array.isArray(playerCards)) return playerCards[index]
    return typeof playerCards === "string" ? playerCards : undefined
}

function organCardKeys(organ: any): string[] {
    if (Array.isArray(organ?.cards)) return organ.cards
    const playerCards = organ?.cardsByOwner?.player
    if (Array.isArray(playerCards)) return playerCards
    return typeof playerCards === "string" ? [playerCards] : []
}

function organIsHeld(organ: any): boolean {
    const owner = organ?.owner
    if (!owner || !isChara(owner)) return false
    try {
        return getOrganModifier(owner).getOrgans().some((item: any) => toRaw(item) === toRaw(organ))
    } catch {
        return false
    }
}

function configProvideCount(organ: any, preferPlayerCards?: boolean): number {
    const playerCards = organ?.cardsByOwner?.player
    const playerCount = Array.isArray(playerCards) ? playerCards.length : (typeof playerCards === "string" ? 1 : 0)
    if (preferPlayerCards && playerCount > 0) return playerCount
    if (Array.isArray(organ?.cards) && organ.cards.length > 0) return organ.cards.length
    const enemyCards = organ?.cardsByOwner?.enemy
    const enemyCount = Array.isArray(enemyCards) ? enemyCards.length : (typeof enemyCards === "string" ? 1 : 0)
    return playerCount || enemyCount
}

/** 已装备按当前挂载，未装备按 cards / cardsByOwner。 */
function provideCardCount(organ: any, preferPlayerCards?: boolean): number {
    if (organIsHeld(organ)) {
        return getCardModifier(organ.owner).getCardsFromSource(organ).length
    }
    return configProvideCount(organ, preferPlayerCards)
}

/** 「提供N张xx卡牌」——有 cards 就自动生成，不要写进器官 describe。 */
export function provideCardsDescribe(organ: any, options?: { preferPlayerCards?: boolean }): Describe {
    const count = provideCardCount(organ, options?.preferPlayerCards)
    if (count <= 0) return []
    const parts: Describe = [`提供${count}张`]
    for (let i = 0; i < count; i++) {
        if (i > 0) parts.push(i === count - 1 ? "和" : "、")
        parts.push({ "@": i })
    }
    parts.push("卡牌")
    return parts
}

function isDescribeEmpty(describe?: Describe): boolean {
    if (!describe || describe.length === 0) return true
    return describe.length === 1 && (describe[0] === "" || describe[0] == null)
}

/**
 * hover / 列表用的效果正文。
 * 写了 effect 就用 effect；没写则沿用 describe（旧数据把效果写在 describe 里）。
 */
export function getEffectDescribe(entity: { effect?: Describe, describe?: Describe } | null | undefined): Describe {
    if (!entity) return []
    if (!isDescribeEmpty(entity.effect)) return entity.effect as Describe
    return Array.isArray(entity.describe) ? entity.describe : []
}

/**
 * 详情里效果下面的可选风味。只有同时写了 effect 和 describe 时才有。
 */
export function getFlavorDescribe(entity: { effect?: Describe, describe?: Describe } | null | undefined): Describe {
    if (!entity) return []
    if (isDescribeEmpty(entity.effect)) return []
    if (isDescribeEmpty(entity.describe)) return []
    return entity.describe as Describe
}

/** 器官正文：提供卡牌一句 + 效果（effect，没有则用 describe）。 */
export function composeOrganDescribe(organ: any, options?: { preferPlayerCards?: boolean }): Describe {
    if (!organ) return []
    const provide = provideCardsDescribe(organ, options)
    const rest = getEffectDescribe(organ)
    if (provide.length === 0) return rest
    if (rest.length === 0) return provide
    return [...provide, "<br>", ...rest]
}

/** 里程碑只锻牌时可以不写 describe，展示为「锻造提供的xx卡牌」。 */
export function forgeProvideDescribe(organ: any, cardKey?: string): Describe {
    const cards = organCardKeys(organ)
    if (cards.length === 0) return ["锻造提供的卡牌"]
    const idxs = cardKey
        ? [Math.max(0, cards.indexOf(cardKey))]
        : cards.map((_, i) => i)
    const parts: Describe = ["锻造提供的"]
    idxs.forEach((idx, i) => {
        if (i > 0) parts.push(i === idxs.length - 1 ? "和" : "、")
        parts.push({ "@": idx })
    })
    parts.push("卡牌")
    return parts
}

export function resolveOrganMilestoneDescribe(
    organ: any,
    milestone: { describe?: Describe, effects?: Array<{ key: string, params?: Record<string, any> }> }
): Describe {
    const forge = milestone.effects?.find(e => e.key === "upgradeOrganCards")
    const extra = milestone.describe
    if (forge) {
        const line = forgeProvideDescribe(organ, forge.params?.cardKey as string | undefined)
        if (extra && extra.length > 0) return [...line, "<br>", ...extra]
        return line
    }
    return extra && extra.length > 0 ? extra : ["效果"]
}

/** 描述里 {@:索引} 的显示名。不要从 cardSegment 取，见常见错误排查手册 L1。 */
function organCardLabelByIndex(target: any, index: number): string {
    if (!target) return "[卡牌]"
    try {
        if (target.owner) {
            const cards = getCardModifier(target.owner).getCardsFromSource(target)
            const instance = cards[index]
            if (instance) return instance.displayName || instance.key || "[卡牌]"
        }
        const cardKey = organCardKeyAtIndex(target, index)
        if (!cardKey) return "[卡牌]"
        const cardList = getLazyModule<any[]>('cardList')
        const cardConfig = cardList.find((c: any) => c.key === cardKey)
        if (!cardConfig) return "[卡牌]"
        return formatCardLabel(cardConfig.label, countOrganCardForges(target) > 0 ? 1 : 0)
    } catch {
        return "[卡牌]"
    }
}

//将描述对象翻译为文本
export function getDescribe(describe:Describe|undefined,target?:Object){
    let text = "";
    if(!describe)return text
    describe.forEach(value=>{
        //纯字符串或数字直接添加
        if(typeof value == "string"){
            text += value === "<br>" ? "\n" : value
        }
        else if(typeof value == "number"){
            text += String(value)
        }
        //是一个对象
        else if(value instanceof Object){
            //术语标记
            if("$" in value){
                const glossaryKey = value.$
                const glossary = resolveGlossary(glossaryKey)
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
                    cardLabel = organCardLabelByIndex(target, cardIndexOrId)
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
                                    cardLabel = cardInstance.displayName || cardInstance.key || "[卡牌]"
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
            else if("organ" in value){
                const organKey = value.organ
                if (organKey) {
                    text += `【${listItemLabel("organList", organKey, "器官")}】`
                }
            }
            else if("relic" in value){
                const relicKey = value.relic
                if (relicKey) {
                    text += `【${listItemLabel("relicList", relicKey, "遗物")}】`
                }
            }
            else if("text" in value && "fx" in value){
                if (value.text) text += value.text
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
    let beatCursor = 0

    describe.forEach(value=>{
        //纯字符串或数字
        if(typeof value == "string"){
            if (value === "<br>") {
                segments.push({ text: "", type: 'break' })
            } else {
                segments.push({
                    text: value,
                    type: 'plain'
                })
            }
        }
        else if(typeof value == "number"){
            segments.push({
                text: String(value),
                type: 'plain'
            })
        }
        //是一个对象
        else if(value instanceof Object){
            //术语标记
            if("$" in value){
                const glossaryKey = value.$
                const glossary = resolveGlossary(glossaryKey)
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
                const cardIndexOrId = value["@"]
                let cardLabel = "[卡牌]"

                if (typeof cardIndexOrId === 'number') {
                    cardLabel = organCardLabelByIndex(target, cardIndexOrId)
                    segments.push({
                        text: cardLabel,
                        type: 'card' as const,
                        cardRef: cardIndexOrId,
                        cardRefType: 'instance' as const
                    })
                } else if (typeof cardIndexOrId === 'string') {
                    // 字符串 ID：实例化后的卡牌引用，从器官的卡牌修饰器中查找
                    try {
                        if (target && 'targetType' in (target as any) && (target as any).targetType === 'organ') {
                            const organ = target as any
                            if (organ.owner) {
                                const cardModifier = getCardModifier(organ.owner)
                                const cardsFromOrgan = cardModifier.getCardsFromSource(organ)
                                const cardInstance = cardsFromOrgan.find((c: any) => c.__id === cardIndexOrId)
                                if (cardInstance) {
                                    cardLabel = cardInstance.displayName || cardInstance.key || "[卡牌]"
                                }
                            }
                        }
                    } catch { /* 查找失败 */ }
                    segments.push({
                        text: cardLabel,
                        type: 'card' as const,
                        cardRef: cardIndexOrId,
                        cardRefType: 'instance' as const
                    })
                }
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
            else if("organ" in value){
                const organKey = value.organ
                if (organKey) {
                    segments.push({
                        text: `【${listItemLabel("organList", organKey, "器官")}】`,
                        type: 'organ',
                        organKey,
                        evolutionRounds: value.evolutionRounds
                    })
                }
            }
            else if("relic" in value){
                const relicKey = value.relic
                if (relicKey) {
                    segments.push({
                        text: `【${listItemLabel("relicList", relicKey, "遗物")}】`,
                        type: 'relic',
                        relicKey
                    })
                }
            }
            else if("text" in value && "fx" in value){
                if (value.text) {
                    const fxKeys = normalizeFxKeys(value.fx)
                    const hasReveal = fxHasKind(fxKeys, "reveal")
                    const segment: DescribeSegment = {
                        text: value.text,
                        type: 'fx',
                        fxKeys
                    }
                    if (hasReveal) {
                        const wait = typeof value.wait === "number" ? value.wait : 0
                        const char = typeof value.char === "number" && value.char > 0 ? value.char : DEFAULT_BEAT_CHAR
                        const start = beatCursor + wait
                        segment.beatStart = start
                        segment.beatChar = char
                        beatCursor = start + Array.from(value.text).length * char
                    }
                    segments.push(segment)
                }
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