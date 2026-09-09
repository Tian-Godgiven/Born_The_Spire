import { type InjectionKey, type Ref } from "vue"

export type PackPlacement = "left" | "right" | "top" | "bottom"

/**
 * 外层 Popover 提供给嵌套浮层：写了 order 的内层会加入外层同一锚点、同一侧的排队。
 */
export interface PopoverPackContext {
    getOriginAnchor: () => HTMLElement | null
    getRequestedPlacement: () => PackPlacement
    actualPlacement: Ref<PackPlacement>
}

export const POPOVER_PACK_KEY: InjectionKey<PopoverPackContext> = Symbol("popoverPack")

export interface PopoverPackMember {
    id: number
    getOrder: () => number
    getGroupAnchor: () => HTMLElement | null
    getGroupPlacement: () => PackPlacement
    getShown: () => boolean
    getPointerInside: () => boolean
    getLayer: () => HTMLElement | null
    layoutSelf: () => void
}

let nextPackId = 1
let layoutDepth = 0
const members = new Set<PopoverPackMember>()

export function createPackId(): number {
    return nextPackId++
}

export function registerPackMember(member: PopoverPackMember): void {
    members.add(member)
}

export function unregisterPackMember(member: PopoverPackMember): void {
    members.delete(member)
}

export function getPackGroup(member: PopoverPackMember): PopoverPackMember[] {
    const anchor = member.getGroupAnchor()
    const placement = member.getGroupPlacement()
    if (!anchor) return member.getShown() ? [member] : []
    return [...members]
        .filter(item =>
            item.getShown()
            && item.getGroupAnchor() === anchor
            && item.getGroupPlacement() === placement
        )
        .sort((a, b) => a.getOrder() - b.getOrder() || a.id - b.id)
}

/**
 * 按 order 从内到外重新贴一遍。必须先摆内侧，外侧才能量到前一块的边。
 */
export function layoutPackGroup(member: PopoverPackMember): void {
    if (layoutDepth > 0) return
    layoutDepth += 1
    try {
        for (const item of getPackGroup(member)) {
            item.layoutSelf()
        }
    } finally {
        layoutDepth -= 1
    }
}

export function packGroupHasPointer(member: PopoverPackMember): boolean {
    return getPackGroup(member).some(item => item.getPointerInside())
}
