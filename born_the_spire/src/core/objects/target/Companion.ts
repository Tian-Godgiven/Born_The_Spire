import { Enemy } from "./Enemy"
import type { EnemyMap } from "./Enemy"

export type CompanionMap = EnemyMap & {
    controllerId?: string
    targetWeight?: number
    autoAct?: boolean
    showIntent?: boolean
}

/**
 * 战斗内临时友军。复用 Enemy 的自动行动能力，但属于玩家阵营，
 * 不会进入玩家卡组、局外资源或存档。
 */
export class Companion extends Enemy {
    public readonly targetType = 'companion' as const
    public readonly battleSide = 'player' as const
    public controllerId?: string
    public targetWeight: number
    public readonly autoAct: boolean
    public readonly showIntent: boolean

    constructor(map: CompanionMap) {
        super(map)
        this.controllerId = map.controllerId
        this.targetWeight = Math.max(0, Number(map.targetWeight ?? 1))
        this.autoAct = map.autoAct ?? false
        this.showIntent = map.showIntent ?? false
    }
}
