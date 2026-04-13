import { handleEventEntity } from "@/core/objects/system/ActionEvent";
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { changeStatusValue } from "@/core/objects/system/status/Status";
import { newError } from "@/ui/hooks/global/alert";
import { isEntity } from "@/core/utils/typeGuards";

//增加属性基础值
export const addStatusBase:EffectFunc = (event,effect)=>{
    //获取目标
    const {source,medium,target} = event;
    //获取修改的目标属性和修改值
    let {value=0,statusKey} = effect.params
    //任一缺少都不继续
    if(!statusKey){
        newError(["效果缺少目标属性的key"])
    }
    statusKey = String(statusKey)
    value = Number(value)
    handleEventEntity(target,(e)=>{
        if (!isEntity(e)) return;
        const remover = changeStatusValue(e,statusKey,{source,medium},{
            "target":"base",
            "type":"additive",
            "value":value
        })
        // 收集副作用
        event.collectSideEffect(remover)
    })

}

//直接设置属性基础值
export const setBaseStatus: EffectFunc = (event, effect) => {
    const { target } = event
    const { statusKey, value } = effect.params

    if (!statusKey || value === undefined) {
        newError(["效果缺少必要参数: statusKey, value"])
        return
    }

    handleEventEntity(target, (e) => {
        if (!isEntity(e)) return
        const status = e.status[String(statusKey)]
        if (!status) {
            console.warn(`实体 ${e.label} 没有属性 ${statusKey}`)
            return
        }
        // 直接设置原始基础值，清除所有现有修饰器
        status.setOriginalBaseValue(Number(value))
    })
}

//递减属性值（直接设置为 value - 1）
export const decrementStatus: EffectFunc = (event, effect) => {
    const { target } = event
    const { statusKey, amount = 1 } = effect.params

    if (!statusKey) {
        newError(["效果缺少目标属性的key"])
        return
    }

    handleEventEntity(target, (e) => {
        if (!isEntity(e)) return
        const status = e.status[String(statusKey)]
        if (!status) {
            console.warn(`实体 ${e.label} 没有属性 ${statusKey}`)
            return
        }
        // 直接设置为当前值减去 amount
        const baseValueNum = typeof status.baseValue === 'string' ? Number(status.baseValue) : status.baseValue
        const newValue = baseValueNum - Number(amount)
        status.setOriginalBaseValue(newValue)
    })
}

/**
 * 乘法修改属性基础值
 * 支持条件参数：onlyIfElite, onlyIfBoss
 */
export const multiplyStatusBase: EffectFunc = (event, effect) => {
    const { target } = event
    const { statusKey, multiplier = 1, onlyIfElite, onlyIfBoss } = effect.params

    if (!statusKey) {
        newError(["效果缺少目标属性的key"])
        return
    }

    handleEventEntity(target, (e) => {
        if (!isEntity(e)) return

        // 条件检查
        if (onlyIfElite && !(e as any).isElite) return
        if (onlyIfBoss && !(e as any).isBoss) return

        const status = e.status[String(statusKey)]
        if (!status) {
            console.warn(`实体 ${e.label} 没有属性 ${statusKey}`)
            return
        }

        const currentBase = typeof status.baseValue === 'string' ? Number(status.baseValue) : status.baseValue
        const newBase = Math.floor(currentBase * Number(multiplier))
        status.setOriginalBaseValue(newBase)
    })
}

/**
 * 重置冷却：将 cooldownKey 重置为 maxKey 的值
 * 默认 cooldownKey="cooldown", maxKey="maxCooldown"
 */
export const resetCooldown: EffectFunc = (event, effect) => {
    const { target } = event
    const { cooldownKey = "cooldown", maxKey = "maxCooldown" } = effect.params || {}

    handleEventEntity(target, (e) => {
        if (!isEntity(e)) return
        const maxStatus = e.status[String(maxKey)]
        const cooldownStatus = e.status[String(cooldownKey)]
        if (!maxStatus || !cooldownStatus) {
            console.warn(`[resetCooldown] 实体 ${e.label} 缺少 ${cooldownKey} 或 ${maxKey} 属性`)
            return
        }
        cooldownStatus.setOriginalBaseValue(maxStatus.value)
    })
}

/**
 * 设置当前值为最大值
 * 支持条件参数：onlyIfElite, onlyIfBoss
 */
export const setCurrentToMax: EffectFunc = (event, effect) => {
    const { target } = event
    const { currentKey, statusKey, onlyIfElite, onlyIfBoss } = effect.params

    if (!currentKey || !statusKey) {
        newError(["效果缺少必要参数: currentKey, statusKey"])
        return
    }

    handleEventEntity(target, (e) => {
        if (!isEntity(e)) return

        // 条件检查
        if (onlyIfElite && !(e as any).isElite) return
        if (onlyIfBoss && !(e as any).isBoss) return

        const maxValue = e.status[String(statusKey)]?.value
        if (maxValue !== undefined && e.current[String(currentKey)]) {
            e.current[String(currentKey)].value = Number(maxValue)
        }
    })
}