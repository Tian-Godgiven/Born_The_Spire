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
import { canContinueOrganUpgrade } from "@/static/list/target/organQuality"
import type { Organ } from "@/core/objects/target/Organ"

/**
 * 水池房间配置
 */
export interface PoolRoomConfig extends RoomConfig {
    type: "pool"
    drinkRate?: number          // 饮用兑换率：X物质 = 1生命（默认 1）
}

/** 饮用默认兑换率：1物质 = 1生命 */
const DEFAULT_DRINK_RATE = 1

/**
 * 水池房间类
 * 提供饮用和洗涤两种选择
 */
export class PoolRoom extends Room {
    public readonly drinkRate: number
    public readonly choiceGroup: ChoiceGroup

    constructor(config: PoolRoomConfig) {
        super(config)

        this.drinkRate = config.drinkRate ?? DEFAULT_DRINK_RATE

        // 创建选项
        const choices = this.createChoices()

        // 行动菜单而非选择题：所有选项都是 repeatable，玩家想做几个做几个，
        // 房间只由「离开」按钮结束，所以这里不需要 onComplete
        // title 交给 PoolRoom.vue 的房间标题渲染，这里再给一个会重复显示
        this.choiceGroup = new ChoiceGroup({
            description: "选择一个行为",
            choices,
            minSelect: 0,
            maxSelect: 1
        })
    }

    /**
     * 创建选项
     */
    private createChoices(): Choice[] {
        const choices: Choice[] = []

        // 选项1：饮用
        // 描述用函数：行动可反复执行，物质和生命每次都在变，写死会显示上一次的旧值
        choices.push(new Choice({
            title: "饮用",
            description: () => {
                const preview = this.previewDrink()
                if (preview.reason === "noMaterial") return "没有物质可以消耗"
                if (preview.reason === "fullHealth") return "生命值已满"
                return `消耗物质，回复生命（当前物质: ${preview.material}，可回复: ${preview.heal}）`
            },
            icon: "💧",
            repeatable: true,
            ifAble: () => this.previewDrink().heal > 0,
            onSelect: async () => {
                await this.onDrink()
            }
        }))

        // 选项2：洗涤
        choices.push(new Choice({
            title: "洗涤",
            description: () => this.getUpgradableOrgans().length === 0
                ? "没有可以升级的器官"
                : "消耗物质升级器官",
            icon: "✨",
            repeatable: true,
            ifAble: () => this.getUpgradableOrgans().length > 0,
            onSelect: async () => {
                await this.onCleanse()
            }
        }))

        return choices
    }

    private previewDrink(): { material: number, heal: number, reason?: "noMaterial" | "fullHealth" } {
        const material = getReserveModifier(nowPlayer).getReserve("material")
        const currentHealth = getCurrentValue(nowPlayer, "health")
        const maxHealth = (nowPlayer.status["max-health"]?.value ?? 0) as number
        const missing = maxHealth - currentHealth
        if (material <= 0) return { material, heal: 0, reason: "noMaterial" }
        if (missing <= 0) return { material, heal: 0, reason: "fullHealth" }
        return { material, heal: Math.min(Math.floor(material / this.drinkRate), missing) }
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
        // 注意：不要在这里设置 state = "completed"
        // 让 GameRun.completeCurrentRoom() 来设置，否则它的防重复检查会提前 return，
        // 导致 completeCurrentNode() 不执行、下一层节点解锁不了
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
        const maxHealth = (nowPlayer.status["max-health"]?.value ?? 0) as number
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

        // 回复生命（restHeal：休息治疗，饥饿的怪物≥3陪睡等"仅休息触发"的效果监听此事件）
        await doEvent({
            key: "restHeal",
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

    private getUpgradableOrgans(): Organ[] {
        return getOrganModifier(nowPlayer).getOrgans().filter(canContinueOrganUpgrade)
    }

    /**
     * 洗涤：消耗物质升级器官
     * 打开列表时为每个器官锁死一次费用；超过最后一档或没有里程碑的不出现
     */
    private async onCleanse(): Promise<void> {
        const organs = this.getUpgradableOrgans()

        if (organs.length === 0) {
            newLog(["没有可以升级的器官"])
            return
        }

        try {
            const selected = await showComponent({
                component: "OrganUpgradeChoice",
                data: {
                    organs: organs,
                    player: nowPlayer
                },
                layout: "modal"
            }) as { organ: Organ, cost: number } | null

            if (selected?.organ) {
                const organModifier = getOrganModifier(nowPlayer)
                const success = await organModifier.upgradeOrgan(selected.organ, {
                    lockedCost: selected.cost
                })

                if (success) {
                    newLog([`${selected.organ.label} 升级成功！`])
                }
            }
        } catch (error) {
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
