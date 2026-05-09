/**
 * 本局游戏统计信息
 * 用于失败/通关页面展示
 */

/**
 * 本局统计数据
 */
export interface RunStats {
    floor: number               // 到达的层数
    roomsVisited: number        // 经过的房间数
}

/**
 * 获取当前局的统计信息
 */
export async function getRunStats(): Promise<RunStats> {
    const { nowGameRun } = await import("@/core/objects/game/run")

    return {
        floor: nowGameRun.towerLevel,
        roomsVisited: nowGameRun.roomHistory.length
    }
}
