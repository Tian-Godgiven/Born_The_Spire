import { Describe } from "@/ui/hooks/express/describe"

/**
 * 储备类型定义（静态数据）
 */
export type ReserveData = {
    label: string        // 显示名称
    key: string          // 唯一标识
    describe?: Describe  // 描述
}

/**
 * 储备列表
 * 定义所有可用的储备类型（金币、血液、灵魂等）
 */
export const reserveList: ReserveData[] = [
    {
        label: "金币",
        key: "gold",
        describe: ["通用货币，用于购买物品和服务"]
    },
    {
        label: "灵魂",
        key: "soul",
        describe: ["神秘的灵魂能量"]
    }
]

/**
 * 根据 key 获取储备的静态数据
 */
export function getReserveDataByKey(key: string): ReserveData | undefined {
    return reserveList.find(item => item.key === key)
}

/**
 * 根据 key 获取储备的显示名称
 */
export function getReserveLabelByKey(key: string): string {
    const data = getReserveDataByKey(key)
    return data?.label ?? key
}
