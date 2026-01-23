import { handleEventEntity, doEvent } from "@/core/objects/system/ActionEvent";
import { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { newError } from "@/ui/hooks/global/alert";

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
        const status = entity.status[statusKey];
        if (!status) {
            console.warn(`[addStatusModifier] 实体 ${entity.label} 没有属性 ${statusKey}，跳过修饰器`);
            return;
        }

        // 添加修饰器并获取 remover
        const remover = status.addByJSON(event.source, {
            targetLayer,
            modifierType,
            applyMode,
            modifierValue: Number(modifierValue),
            modifierFunc
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

    handleEventEntity(target, (entity) => {
        const remover = entity.appendTrigger({
            when,
            how,
            key,
            level,
            callback: (triggerEvent, triggerEffect, triggerLevel) => {
                // 确定事件目标
                let eventTarget = entity;
                if (triggerEvent.targetType === "eventSource") {
                    eventTarget = triggerEvent.source;
                } else if (triggerEvent.targetType === "eventMedium") {
                    eventTarget = triggerEvent.medium;
                } else if (triggerEvent.targetType === "eventTarget") {
                    eventTarget = Array.isArray(triggerEvent.target)
                        ? triggerEvent.target[0]
                        : triggerEvent.target;
                } else if (triggerEvent.targetType === "triggerSource") {
                    eventTarget = source;
                } else if (triggerEvent.targetType === "triggerOwner") {
                    eventTarget = entity;
                } else if (typeof triggerEvent.targetType === "object") {
                    eventTarget = triggerEvent.targetType;
                }

                // 触发事件
                doEvent({
                    key: effect.params.triggerEvent.key,
                    source,
                    medium: source,
                    target: eventTarget,
                    info: effect.params.triggerEvent.info || {},
                    effectUnits: effect.params.triggerEvent.effect || []
                });
            }
        });

        // 收集副作用
        event.collectSideEffect(remover);
    });
};
