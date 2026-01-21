import { Room, RoomConfig, BattleRoomType } from "./Room"
import { Battle, startNewBattle, nowBattle } from "../game/battle"
import { Player } from "../target/Player"
import { Enemy } from "../target/Enemy"
import { Chara } from "../target/Target"
import { EnemyMap } from "@/static/list/target/enemyList"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 战斗房间配置
 */
export interface BattleRoomConfig extends RoomConfig {
    type: "battle"
    battleType?: BattleRoomType  // 战斗类型：normal, elite, boss
    enemyConfigs?: EnemyMap[] | string[]    // 敌人配置列表或敌人 key 列表
    customData?: {
        battleType?: BattleRoomType
        enemyConfigs?: string[]  // 敌人 key 列表
    }
}

/**
 * 战斗房间类
 * 包装 Battle 类，管理战斗流程和奖励
 */
export class BattleRoom extends Room {
    public readonly battleType: BattleRoomType
    public readonly enemyConfigs: EnemyMap[]
    private battle: Battle | null = null
    private enemies: Enemy[] = []

    constructor(config: BattleRoomConfig) {
        super(config)

        // 从 config 或 customData 中获取 battleType
        this.battleType = config.battleType
            || config.customData?.battleType
            || "normal"

        // 从 config 或 customData 中获取 enemyConfigs
        const enemyConfigsSource = config.enemyConfigs
            || config.customData?.enemyConfigs
            || []

        // 如果是字符串数组（敌人 key），需要从 enemyList 中查找
        if (enemyConfigsSource.length > 0 && typeof enemyConfigsSource[0] === 'string') {
            this.enemyConfigs = this.loadEnemyConfigsByKeys(enemyConfigsSource as string[])
        } else {
            this.enemyConfigs = enemyConfigsSource as EnemyMap[]
        }
    }

    /**
     * 根据敌人 key 列表加载敌人配置
     */
    private loadEnemyConfigsByKeys(keys: string[]): EnemyMap[] {
        const { enemyList } = require("@/static/list/target/enemyList")
        return keys.map(key => {
            const config = enemyList.find((e: EnemyMap) => e.key === key)
            if (!config) {
                console.warn(`[BattleRoom] 未找到敌人配置: ${key}`)
            }
            return config
        }).filter(Boolean)
    }

    /**
     * 进入战斗房间
     */
    async enter(): Promise<void> {
        newLog([`===== 进入${this.getDisplayName()} =====`])

        // 生成敌人
        this.enemies = this.enemyConfigs.map(config => new Enemy(config))

        newLog([`生成敌人: ${this.enemies.map(e => e.label).join(", ")}`])
    }

    /**
     * 处理战斗内容
     * 启动战斗系统
     */
    async process(): Promise<void> {
        // 获取玩家队伍（从 battle.ts 中导入）
        const { nowPlayerTeam } = await import("../game/battle")

        if (nowPlayerTeam.length === 0) {
            console.error("[BattleRoom] 没有玩家队伍")
            return
        }

        // 启动战斗
        this.battle = await startNewBattle(nowPlayerTeam, this.enemies)

        newLog(["战斗开始！"])
    }

    /**
     * 完成战斗房间
     * 处理战斗奖励
     */
    async complete(): Promise<void> {
        if (!this.battle) {
            console.warn("[BattleRoom] 战斗未开始")
            return
        }

        // 检查战斗结果
        const battleResult = this.battle.checkBattleEnd()

        if (battleResult === "player_win") {
            newLog([`===== ${this.getDisplayName()}胜利 =====`])
            await this.handleVictoryRewards()
        } else if (battleResult === "player_lose") {
            newLog([`===== ${this.getDisplayName()}失败 =====`])
            // TODO: 处理失败逻辑
        }
    }

    /**
     * 离开战斗房间
     */
    async exit(): Promise<void> {
        // 清理战斗状态
        this.battle = null
        this.enemies = []

        newLog([`===== 离开${this.getDisplayName()} =====`])
    }

    /**
     * 处理战斗胜利奖励
     */
    private async handleVictoryRewards(): Promise<void> {
        newLog(["开始结算奖励..."])

        // 根据战斗类型提供不同奖励
        switch (this.battleType) {
            case "normal":
                await this.handleNormalRewards()
                break
            case "elite":
                await this.handleEliteRewards()
                break
            case "boss":
                await this.handleBossRewards()
                break
        }
    }

    /**
     * 普通战斗奖励
     * - 吞噬物质
     * - 同化器官（3选1）
     */
    private async handleNormalRewards(): Promise<void> {
        newLog(["普通战斗奖励："])
        newLog(["- 吞噬物质"])
        newLog(["- 同化器官（3选1）"])

        // TODO: 实现奖励逻辑
        // 1. 计算物质奖励（根据层级）
        // 2. 从敌人器官中随机抽取3个
        // 3. 显示奖励选择UI
    }

    /**
     * 精英战斗奖励
     * - 普通奖励
     * - 遗物奖励
     */
    private async handleEliteRewards(): Promise<void> {
        newLog(["精英战斗奖励："])
        newLog(["- 吞噬物质"])
        newLog(["- 同化器官（3选1）"])
        newLog(["- 遗物奖励"])

        // TODO: 实现奖励逻辑
        await this.handleNormalRewards()
        // + 遗物奖励
    }

    /**
     * Boss战斗奖励
     * - 吞噬物质
     * - Boss器官（指定选择1个）
     * - Boss遗物（3选1）
     */
    private async handleBossRewards(): Promise<void> {
        newLog(["Boss战斗奖励："])
        newLog(["- 吞噬物质"])
        newLog(["- Boss器官（指定选择1个）"])
        newLog(["- Boss遗物（3选1）"])

        // TODO: 实现奖励逻辑
    }

    /**
     * 获取战斗房间显示名称
     */
    getDisplayName(): string {
        if (this.name) {
            return this.name
        }

        const typeNameMap: Record<BattleRoomType, string> = {
            "normal": "普通战斗",
            "elite": "精英战斗",
            "boss": "Boss战斗"
        }

        return typeNameMap[this.battleType] || "战斗"
    }

    /**
     * 获取战斗房间图标
     */
    getIcon(): string {
        const iconMap: Record<BattleRoomType, string> = {
            "normal": "⚔️",
            "elite": "💀",
            "boss": "👑"
        }

        return iconMap[this.battleType] || "⚔️"
    }

    /**
     * 获取当前战斗实例
     */
    getBattle(): Battle | null {
        return this.battle
    }

    /**
     * 获取敌人列表
     */
    getEnemies(): Enemy[] {
        return this.enemies
    }
}
