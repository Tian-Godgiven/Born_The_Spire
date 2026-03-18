import {
    loadMetaProgress,
    saveMetaProgress,
    markOrganAscensionMastery,
    markEliteDefeated,
    getInitialOrganBudget,
    type MetaProgressSave
} from "@/core/persistence/metaProgress"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { Player } from "@/core/objects/target/Player"
import { nowGameRun } from "@/core/objects/game/run"

/**
 * 游戏通关时处理器官精通
 *
 * 标记当前持有的所有器官在当前进阶等级精通
 *
 * @param player 玩家
 */
export function processVictoryMastery(player: Player): void {
    // 获取当前进阶等级
    const ascensionLevel = nowGameRun.towerFire

    // 加载元进度数据
    const metaProgress = loadMetaProgress()

    // 获取玩家当前持有的所有器官
    const organModifier = getOrganModifier(player)
    const organs = organModifier.getOrgans()

    let hasChanges = false

    for (const organ of organs) {
        // 跳过损坏的器官
        if (organ.isDisabled) continue

        const organKey = organ.key

        // 标记为当前进阶精通
        const mastered = markOrganAscensionMastery(metaProgress, organKey, ascensionLevel)
        if (mastered) {
            hasChanges = true
        }
    }

    // 保存数据
    if (hasChanges) {
        saveMetaProgress(metaProgress)
        clearMetaProgressCache()
    }
}

/**
 * 处理击败精英敌人
 *
 * 首次击败某个精英敌人时，增加初始器官选择上限
 *
 * @param eliteKey 精英敌人key
 * @returns 是否增加了上限
 */
export function processEliteDefeat(eliteKey: string): boolean {
    const metaProgress = loadMetaProgress()

    const isFirstTime = markEliteDefeated(metaProgress, eliteKey)

    if (isFirstTime) {
        saveMetaProgress(metaProgress)
        clearMetaProgressCache()
        const newBudget = getInitialOrganBudget(metaProgress)
    }

    return isFirstTime
}

/**
 * 获取元进度数据（带缓存）
 */
let cachedMetaProgress: MetaProgressSave | null = null

export function getCachedMetaProgress(): MetaProgressSave {
    if (!cachedMetaProgress) {
        cachedMetaProgress = loadMetaProgress()
    }
    return cachedMetaProgress
}

/**
 * 清除元进度缓存
 */
export function clearMetaProgressCache(): void {
    cachedMetaProgress = null
}
