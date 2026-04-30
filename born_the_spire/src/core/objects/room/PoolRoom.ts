/**
 * 水池房间
 * 提供饮用（消耗物质回复生命）和洗涤（消耗物质升级器官）两种选择
 */

import { Room } from "./Room"
import type { RoomConfig } from "./Room"
import { Choice, ChoiceGroup } from "../system/Choice"
import { nowPlayer } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { showComponent } from "@/core/hooks/componentManager"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { getCurrentValue } from "@/core/objects/system/Current/current"
import { gainMark, hasMark } from "@/core/hooks/mark"

/**
 * 水池房间配置
 */
export interface PoolRoomConfig extends RoomConfig {
    type: "pool"
    drinkRate?: number          // 饮用兑换率：X物质 = 1生命（默认 1）
    cleanseMaterialCost?: number // 洗涤物质消耗（默认根据器官计算）
    cleanseMaxHpCost?: number   // 洗涤额外最大生命消耗（非首次，默认 5）
}

/** 饮用默认兑换率：1物质 = 1生命 */
const DEFAULT_DRINK_RATE = 1
/** 洗涤非首次额外扣除最大生命 */
const DEFAULT_CLEANSE_MAX_HP_COST = 5

/**
 * 水池房间类
 * 提供饮用和洗涤两种选择
 */
export class PoolRoom extends Room {
    public readonly drinkRate: number
    public readonly cleanseMaxHpCost: number
    public readonly choiceGroup: ChoiceGroup
    /** 本水池是否已使用过洗涤（首次免费） */
    private hasCleansed: boolean = false

    constructor(config: PoolRoomConfig) {
        super(config)

        this.drinkRate = config.drinkRate ?? DEFAULT_DRINK_RATE
        this.cleanseMaxHpCost = config.cleanseMaxHpCost ?? DEFAULT_CLEANSE_MAX_HP_COST

        // 创建选项
        const choices = this.createChoices()

        // 创建选项组（单选）
        this.choiceGroup = new ChoiceGroup({
            title: "水池",
            description: "选择一个行为",
            choices,
            minSelect: 1,
            maxSelect: 1,
            onComplete: async () => {
                await this.complete()
            }
        })
    }

    /**
     * 创建选项
     */
    private createChoices(): Choice[] {
        const choices: Choice[] = []

        // 获取玩家当前物质
        const reserveModifier = getReserveModifier(nowPlayer)
        const currentMaterial = reserveModifier.getReserve("material")

        // 计算饮用可回复的生命值
        const healAmount = Math.floor(currentMaterial / this.drinkRate)
        const currentHealth = getCurrentValue(nowPlayer, "health")
        const maxHealth = nowPlayer.status["max-health"]?.value ?? 0
        const missingHealth = maxHealth - currentHealth
        const actualHeal = Math.min(healAmount, missingHealth)

        // 选项1：饮用
        choices.push(new Choice({
            title: "饮用",
            description: currentMaterial > 0
                ? `消耗物质，回复生命（当前物质: ${currentMaterial}，可回复: ${actualHeal}）`
                : "没有物质可以消耗",
            icon: "💧",
            onSelect: async () => {
                await this.onDrink()
            }
        }))

        // 选项2：洗涤
        choices.push(new Choice({
            title: "洗涤",
            description: "消耗物质升级器官（首次免额外代价）",
            icon: "✨",
            onSelect: async () => {
                await this.onCleanse()
            }
        }))

        return choices
    }

    /**
     * 进入水池房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog(["===== 进入水池 ====="])
        newLog(["一个宁静的休息处..."])
    }

    /**
     * 处理水池房间（UI 驱动）
     */
    async process(): Promise<void> {
        // 水池房间的处理由 UI 驱动
    }

    /**
     * 完成水池房间
     */
    async complete(): Promise<void> {
        this.state = "completed"
        newLog(["===== 离开水池 ====="])
    }

    /**
     * 离开水池房间
     */
    async exit(): Promise<void> {
        // 清理状态
    }

    /**
     * 饮用：消耗物质，回复生命
     */
    private async onDrink(): Promise<void> {
        const reserveModifier = getReserveModifier(nowPlayer)
        const currentMaterial = reserveModifier.getReserve("material")

        if (currentMaterial <= 0) {
            newLog(["没有物质可以消耗"])
            return
        }

        // 计算可回复量
        const healAmount = Math.floor(currentMaterial / this.drinkRate)
        const currentHealth = getCurrentValue(nowPlayer, "health")
        const maxHealth = nowPlayer.status["max-health"]?.value ?? 0
        const missingHealth = maxHealth - currentHealth

        if (missingHealth <= 0) {
            newLog(["生命值已满，无需饮用"])
            return
        }

        // 实际回复量 = min(可回复量, 缺失生命)
        const actualHeal = Math.min(healAmount, missingHealth)
        // 实际消耗物质 = 实际回复量 * 兑换率
        const materialCost = actualHeal * this.drinkRate

        // 消耗物质
        reserveModifier.spendReserve("material", materialCost)

        // 回复生命
        await doEvent({
            key: "heal",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "heal",
                params: { value: actualHeal }
            }]
        })

        newLog([`饮用水池，消耗 ${materialCost} 物质，回复 ${actualHeal} 生命`])
    }

    /**
     * 洗涤：消耗物质升级器官
     * 每个水池首次免费（不扣最大生命），之后每次额外扣最大生命
     */
    private async onCleanse(): Promise<void> {
        const organModifier = getOrganModifier(nowPlayer)
        const organs = organModifier.getOrgans()

        if (organs.length === 0) {
            newLog(["你没有可以升级的器官"])
            return
        }

        // 显示器官选择界面
        try {
            const selectedOrgan = await showComponent({
                component: "OrganUpgradeChoice",
                data: {
                    organs: organs,
                    player: nowPlayer
                },
                layout: "modal"
            })

            if (selectedOrgan) {
                // 非首次洗涤，额外扣除最大生命
                if (this.hasCleansed) {
                    const maxHpCost = this.cleanseMaxHpCost
                    newLog([`非首次洗涤，额外消耗 ${maxHpCost} 最大生命`])

                    await doEvent({
                        key: "cleanseCost",
                        source: nowPlayer,
                        medium: nowPlayer,
                        target: nowPlayer,
                        effectUnits: [{
                            key: "addStatusBaseCurrentValue",
                            params: {
                                value: -maxHpCost,
                                statusKey: "max-health",
                                currentKey: "health"
                            }
                        }]
                    })
                }

                // 升级器官（内部会消耗物质或生命值）
                const success = await organModifier.upgradeOrgan(selectedOrgan)

                if (success) {
                    this.hasCleansed = true
                    newLog([`${selectedOrgan.label} 升级成功！`])
                }
            }
        } catch (error) {
            // 用户取消
            newLog(["取消洗涤"])
        }
    }

    /**
     * 获取选项组
     */
    getChoiceGroup(): ChoiceGroup {
        return this.choiceGroup
    }

    // ==================== 染血系统（暂未启用） ====================

    /**
     * 染血行为
     * 目前保留代码，暂不作为水池选项
     * 后续接入时在 createChoices 中添加选项即可
     */
    async onBloodMark(): Promise<void> {
        if (hasMark(nowPlayer, "mark_blood")) {
            newLog(["已经染血，无法再次染血"])
            return
        }

        gainMark(nowPlayer, "mark_blood")
        newLog(["获得了红色印记"])
    }

    getDisplayName(): string {
        return this.name || "水池"
    }

    getIcon(): string {
        return "〜"
    }
}
