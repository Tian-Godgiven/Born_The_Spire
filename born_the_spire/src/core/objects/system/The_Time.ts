import { Entity } from "./Entity"

/**
 * 时间实体
 *
 * 用于表示游戏中的时间流逝事件，作为 ActionEvent 的 source
 * 这样状态衰减等时间相关的效果就有了明确的"来源"
 *
 * 例如：
 * - 回合结束时，力量-1：source = TurnEnd_Time
 * - 战斗开始时，获得护甲：source = BattleStart_Time
 */

/**
 * 基础时间实体
 */
class TimeEntity extends Entity {
    constructor(label: string, key: string) {
        super({ label, key })
    }
}

// ==================== 全局时间实体单例 ====================

/**
 * 通用时间实体
 */
export const The_Time = new TimeEntity("时间", "the_time")

/**
 * 回合开始
 */
export const TurnStart_Time = new TimeEntity("回合开始", "turn_start_time")

/**
 * 回合结束
 */
export const TurnEnd_Time = new TimeEntity("回合结束", "turn_end_time")

/**
 * 战斗开始
 */
export const BattleStart_Time = new TimeEntity("战斗开始", "battle_start_time")

/**
 * 战斗结束
 */
export const BattleEnd_Time = new TimeEntity("战斗结束", "battle_end_time")

/**
 * 阶段开始（爬塔用）
 */
export const StageStart_Time = new TimeEntity("阶段开始", "stage_start_time")

/**
 * 根据 timing 字符串获取对应的时间实体
 */
export function getTimeEntityByTiming(timing: string): Entity {
    switch (timing) {
        case "turnStart":
            return TurnStart_Time
        case "turnEnd":
            return TurnEnd_Time
        case "battleStart":
            return BattleStart_Time
        case "battleEnd":
            return BattleEnd_Time
        case "stageStart":
            return StageStart_Time
        default:
            return The_Time
    }
}
