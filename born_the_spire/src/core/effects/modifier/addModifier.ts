import { handleEventEntity, doEvent, ActionEvent } from "@/core/objects/system/ActionEvent";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { newError } from "@/ui/hooks/global/alert";
import { isEntity } from "@/core/utils/typeGuards";
import { Effect } from "@/core/objects/system/effect/Effect";

/**
 * 添加状态修饰器到目标
 *
 * 参数：
 * - statusKey: 属性键名
 * - modifierValue: 修饰值
 * - targetLayer: 目标层级 ("base" | "current")
 * - modifierType: 修饰类型 ("additive" | "multiplicative" | "final")
 * - applyMode: 应用模式 ("absolute" | "snapshot")
 */
export const addStatusModifier: EffectFunc = (event, effect) => {
    const { target } = event;
    const {
        statusKey,
        modifierValue = 0,
        targetLayer = "base",
        modifierType = "additive",
        applyMode = "absolute",
        modifierFunc
    } = effect.params;

    if (!statusKey) {
        newError(["效果缺少目标属性的key"]);
        return;
    }

    handleEventEntity(target, (entity) => {
        if (!isEntity(entity)) return;

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
                let eventTarget = entity;
                const triggerEventConfig = effect.params.triggerEvent as Record<string, any>;

                // 使用 resolveTriggerEventTarget 解析目标
                if (triggerEventConfig.targetType) {
                    const { resolveTriggerEventTarget } = require("@/core/objects/system/trigger/Trigger");
                    eventTarget = resolveTriggerEventTarget(
                        triggerEventConfig.targetType,
                        triggerEvent,
                        _triggerEffect,
                        source,
                        entity
                    );
                }

                // 触发事件
                doEvent({
                    key: triggerEventConfig.key,
                    source,
                    medium: source,
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
