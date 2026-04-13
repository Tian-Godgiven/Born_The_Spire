import { handleEventEntity, doEvent, ActionEvent } from "@/core/objects/system/ActionEvent";
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import type { EventParticipant } from "@/core/types/event/EventParticipant";
import { newError } from "@/ui/hooks/global/alert";
import { isEntity } from "@/core/utils/typeGuards";
import { Effect } from "@/core/objects/system/effect/Effect";
import { resolveTriggerEventTarget } from "@/core/objects/system/trigger/Trigger";
import { Entity } from "@/core/objects/system/Entity";
import { getCurrentValue, changeCurrentValue } from "@/core/objects/system/Current/current";

/**
 * 添加最大生命并回复生命
 *
 * 这个效果会：
 * 1. 添加 modifier 增加最大生命
 * 2. 回复等量的当前生命
 * 3. 当 modifier 被移除时，扣除等量的当前生命（不会致死）
 *
 * 参数：
 * - value: 增加的最大生命值（同时也是回复的生命值）
 * - canKill: 移除时是否可以致死（默认 false，不会致死）
 */
export const addMaxHealthAndHeal: EffectFunc = (event, effect) => {
    const { target } = event;
    const { value = 0, canKill = false } = effect.params;

    if (!value) {
        newError(["addMaxHealthAndHeal 效果缺少 value 参数"]);
        return;
    }

    const valueNum = Number(value);
    const canKillBool = Boolean(canKill);
    const removers: Array<() => void> = []

    handleEventEntity(target, (entity) => {
        if (!isEntity(entity)) {
            return;
        }

        // 1. 添加 modifier（最大生命+value）
        const status = entity.status["max-health"];

        if (!status) {
            console.warn(`[addMaxHealthAndHeal] 实体 ${entity.label} 没有 max-health 属性，跳过`);
            return;
        }

        const remover = status.addByJSON(event.source, {
            targetLayer: "base",
            modifierType: "additive",
            modifierValue: valueNum,
            clearable: false  // 器官提供的最大生命是永久的
        });

        // 2. 回复当前生命（+value）
        const currentHealth = getCurrentValue(entity, "health");
        changeCurrentValue(entity, "health", currentHealth + valueNum, event);

        // 3. 创建自定义清理函数：移除时 -value 生命
        const customRemover = () => {
            // 先移除 modifier
            remover();

            // 然后扣除生命
            const currentHealth = getCurrentValue(entity, "health");
            let newHealth = currentHealth - valueNum;

            // 如果不允许致死，确保生命至少为 1
            if (!canKillBool && newHealth < 1) {
                newHealth = 1;
            }

            changeCurrentValue(entity, "health", newHealth, event);
        };

        // 收集副作用
        event.collectSideEffect(customRemover);
        removers.push(customRemover)
    });

    // 返回所有 remover
    return removers.length === 1 ? removers[0] : removers
};

/**
 * 添加状态修饰器到目标
 *
 * 参数：
 * - statusKey: 属性键名
 * - modifierValue: 修饰值
 * - targetLayer: 目标层级 ("base" | "current")
 * - modifierType: 修饰类型 ("additive" | "multiplicative" | "final")
 * - applyMode: 应用模式 ("absolute" | "snapshot")
 * - onlyIfElite: 仅对精英生效（可选）
 * - onlyIfBoss: 仅对Boss生效（可选）
 */
export const addStatusModifier: EffectFunc = (event, effect) => {
    const { target } = event;
    const {
        statusKey,
        modifierValue = 0,
        targetLayer = "base",
        modifierType = "additive",
        applyMode = "absolute",
        modifierFunc,
        onlyIfElite,
        onlyIfBoss
    } = effect.params;

    if (!statusKey) {
        newError(["效果缺少目标属性的key"]);
        return;
    }

    handleEventEntity(target, (entity) => {
        if (!isEntity(entity)) return;

        // 条件检查
        if (onlyIfElite && !(entity as any).isElite) return;
        if (onlyIfBoss && !(entity as any).isBoss) return;

        const statusKey = String(effect.params.statusKey);
        const status = entity.status[statusKey];
        if (!status) {
            console.warn(`[addStatusModifier] 实体 ${entity.label} 没有属性 ${statusKey}，跳过修饰器`);
            return;
        }

        // 添加修饰器并获取 remover
        const remover = status.addByJSON(event.source, {
            targetLayer: String(targetLayer) as "base" | "current",
            modifierType: String(modifierType) as "additive" | "multiplicative" | "function",
            applyMode: String(applyMode) as "absolute" | "snapshot",
            modifierValue: Number(modifierValue),
            modifierFunc: modifierFunc as ((value: number) => number) | undefined
        });

        // 收集副作用
        event.collectSideEffect(remover);
    });
};

/**
 * 添加触发器到目标
 *
 * 参数：
 * - when: "before" | "after"
 * - how: "make" | "via" | "take"
 * - key: 事件键名
 * - level: 触发级别（可选，默认0）
 * - triggerEvent: 触发时要执行的事件配置
 *   - key: 事件键名
 *   - targetType: 目标类型
 *   - effect: 效果单元数组
 *   - info: 事件信息（可选）
 */
export const addTriggerToTarget: EffectFunc = (event, effect) => {
    const { target, source } = event;
    const {
        when = "before",
        how,
        key,
        level = 0,
        triggerEvent
    } = effect.params;

    if (!how || !key || !triggerEvent) {
        newError(["addTriggerToTarget 效果缺少必要参数: how, key, triggerEvent"]);
        return;
    }

    // 类型转换
    const whenStr = String(when) as "before" | "after";
    const howStr = String(how) as "make" | "via" | "take";
    const keyStr = String(key);
    const levelNum = Number(level);

    handleEventEntity(target, (entity) => {
        if (!isEntity(entity)) return;

        const remover = entity.appendTrigger({
            when: whenStr,
            how: howStr,
            key: keyStr,
            level: levelNum,
            callback: (triggerEvent: ActionEvent, _triggerEffect: Effect | null, _triggerLevel: number = 0) => {
                // 确定事件目标
                let eventTarget: Entity | Entity[] = entity;
                const triggerEventConfig = effect.params.triggerEvent as Record<string, any>;

                // 使用 resolveTriggerEventTarget 解析目标（source 必须是 Item）
                if (triggerEventConfig.targetType && isEntity(source) && (source as any).itemType) {
                    const resolved = resolveTriggerEventTarget(
                        triggerEventConfig.targetType,
                        triggerEvent,
                        _triggerEffect,
                        source as any,
                        entity
                    );
                    // 确保 resolved 是 Entity 或 Entity[]
                    if (Array.isArray(resolved)) {
                        eventTarget = resolved.filter(e => isEntity(e)) as Entity[];
                    } else if (isEntity(resolved)) {
                        eventTarget = resolved;
                    }
                }

                // 触发事件
                doEvent({
                    key: triggerEventConfig.key,
                    source: source as EventParticipant,
                    medium: source as EventParticipant,
                    target: eventTarget,
                    info: triggerEventConfig.info || {},
                    effectUnits: triggerEventConfig.effect || []
                });
            }
        });

        // 收集副作用
        event.collectSideEffect(remover.remove);
    });
};
