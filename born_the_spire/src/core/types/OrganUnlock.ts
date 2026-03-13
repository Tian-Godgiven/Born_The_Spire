/**
 * 器官精通/解锁数据
 *
 * 持久化存储的结构
 */
export interface OrganUnlockData {
    // 已解锁的器官key列表
    unlockedOrgans: string[]

    // 每个器官的精通信息
    // key: 器官key
    // value: 该器官在哪些进阶等级下被精通（通关时仍然持有）
    organMastery: Record<string, {
        ascensionLevels: number[]  // 精通的进阶等级列表
    }>

    // 初始器官选择上限
    // 击败新的精英敌人时增加
    organBudgetMax: number

    // 已击败的精英敌人key列表（用于判断是否增加上限）
    defeatedElites: string[]
}

/**
 * 器官稀有度对应的费用
 */
export const OrganRarityCost: Record<string, number> = {
    "common": 1,      // 普通
    "uncommon": 2,    // 稀有
    "rare": 3,        // 传说
    "unique": 4       // 独特
}

/**
 * 默认的器官解锁数据
 */
export function getDefaultOrganUnlockData(): OrganUnlockData {
    return {
        unlockedOrgans: [],
        organMastery: {},
        organBudgetMax: 5,  // 初始上限为5
        defeatedElites: []
    }
}

/**
 * 持久化存储的key
 */
export const ORGAN_UNLOCK_STORAGE_KEY = "born_the_spire_organ_unlock"

/**
 * 保存器官解锁数据到本地存储
 */
export function saveOrganUnlockData(data: OrganUnlockData): void {
    try {
        localStorage.setItem(ORGAN_UNLOCK_STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
        console.error("[saveOrganUnlockData] 保存失败:", e)
    }
}

/**
 * 从本地存储加载器官解锁数据
 */
export function loadOrganUnlockData(): OrganUnlockData {
    try {
        const saved = localStorage.getItem(ORGAN_UNLOCK_STORAGE_KEY)
        if (saved) {
            return { ...getDefaultOrganUnlockData(), ...JSON.parse(saved) }
        }
    } catch (e) {
        console.error("[loadOrganUnlockData] 加载失败:", e)
    }
    return getDefaultOrganUnlockData()
}

/**
 * 解锁器官
 */
export function unlockOrgan(data: OrganUnlockData, organKey: string): OrganUnlockData {
    if (!data.unlockedOrgans.includes(organKey)) {
        data.unlockedOrgans.push(organKey)
    }
    return data
}

/**
 * 标记器官在当前进阶精通
 */
export function markOrganMastery(
    data: OrganUnlockData,
    organKey: string,
    ascensionLevel: number
): OrganUnlockData {
    if (!data.organMastery[organKey]) {
        data.organMastery[organKey] = { ascensionLevels: [] }
    }
    if (!data.organMastery[organKey].ascensionLevels.includes(ascensionLevel)) {
        data.organMastery[organKey].ascensionLevels.push(ascensionLevel)
    }
    return data
}

/**
 * 检查器官是否已解锁
 */
export function isOrganUnlocked(data: OrganUnlockData, organKey: string): boolean {
    return data.unlockedOrgans.includes(organKey)
}

/**
 * 检查器官是否在当前进阶精通
 */
export function isOrganMasteredAtLevel(
    data: OrganUnlockData,
    organKey: string,
    ascensionLevel: number
): boolean {
    return data.organMastery[organKey]?.ascensionLevels.includes(ascensionLevel) ?? false
}

/**
 * 添加击败的精英敌人（如果未记录过，增加上限）
 */
export function addDefeatedElite(
    data: OrganUnlockData,
    eliteKey: string,
    maxBudget: number = 10
): { data: OrganUnlockData; increased: boolean } {
    if (data.defeatedElites.includes(eliteKey)) {
        return { data, increased: false }
    }

    data.defeatedElites.push(eliteKey)

    // 增加上限，但不超最大值
    const oldBudget = data.organBudgetMax
    data.organBudgetMax = Math.min(data.organBudgetMax + 1, maxBudget)
    const increased = data.organBudgetMax > oldBudget

    return { data, increased }
}

/**
 * 计算已选器官的总费用
 */
export function calculateSelectedOrgansCost(
    organKeys: string[],
    getOrganRarity: (key: string) => string
): number {
    return organKeys.reduce((total, key) => {
        const rarity = getOrganRarity(key)
        return total + (OrganRarityCost[rarity] || 1)
    }, 0)
}
