import { Describe } from "@/ui/hooks/express/describe"

type Entry = {
    label: string        // 显示名称
    describe: Describe   // 描述
}

// 词条显示信息（仅用于UI显示，不包含实现逻辑）
export const entryMap: Record<string, Entry> = {
    // 消耗
    exhaust: {
        label: "消耗",
        describe: ["使用后，将其移入消耗堆，而非弃牌堆"]
    },
    void: {
        label: "虚无",
        describe: ["若回合结束时仍在手牌中，会移入消耗堆而非弃牌堆"]
    },
    inherent: {
        label: "固有",
        describe: ["战斗开始时，必定会抽到此卡片"]
    }
}
