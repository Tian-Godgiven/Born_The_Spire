/**
 * 触发器优先级档位
 *
 * 同一个 (when, how, key) 列表内，level 越大越先执行（onTrigger 里按 level 降序排）。
 * 直接写魔法数字容易出现"我写 100 他写 1000"的军备竞赛，用这里的语义档位表代替。
 *
 * 注意 level 只在**同一个 how 的列表内**比较。跨 when / 跨 how 是排不了的，
 * 整体顺序永远是：
 *
 *     before 整批  →  after 整批
 *     同一 when 内：make  →  via  →  take
 *     同一 how 内： level 降序
 *
 * 所以想让某个触发器绝对第一，三层都要占：when:"before" + how:"make" + level:FIRST。
 */
export const TriggerLevel = {
    /**
     * 必须先于同列表里的一切其他触发器
     *
     * 留给**赋值型**的系统效果：这类效果会把当前值直接设成某个数（而不是加减），
     * 谁排在它后面谁就被抹掉，所以它只能站在最前面。
     * 例：回合开始把能量设为 max-energy。
     * 内容数据（卡牌/器官/遗物/Mod）不要用这一档。
     */
    FIRST: Number.MAX_SAFE_INTEGER,

    /** 要抢在普通内容前面，但可以让位给系统级 */
    HIGH: 1000,

    /** 默认档，不写 level 时就是这个 */
    NORMAL: 0,

    /** 希望等大多数内容结算完再跑 */
    LOW: -1000,

    /**
     * 必须后于同列表里的一切其他触发器
     * 留给收尾型的系统效果（清空、结算、快照之类）
     */
    LAST: Number.MIN_SAFE_INTEGER,
} as const

export type TriggerLevelValue = typeof TriggerLevel[keyof typeof TriggerLevel]
