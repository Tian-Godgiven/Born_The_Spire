import { Entity } from "./Entity"

/**
 * 时间实体
 *
 * 用于表示游戏中的时间流逝事件，作为 ActionEvent 的 source
 * 这样状态衰减等时间相关的效果就有了明确的"来源"
 *
 * 例如：
 * - 回合结束时，力量-1：source = The_Time, key = "turnEnd"
 * - 战斗开始时，获得护甲：source = The_Time, key = "battleStart"
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
 * 唯一的时间实体
 */
export const The_Time = new TimeEntity("时间", "the_time")
