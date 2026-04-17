import { newError } from "@/ui/hooks/global/alert"
import { needsReferenceResolution } from "@/core/utils/ReferenceResolver"
import { getLazyModule } from "@/core/utils/lazyLoader"

/**
 * 效果参数验证系统（可选）
 *
 * 职责：当效果在 effectMap 里声明了 paramsSchema 时，对 params 做严格的类型/必填校验。
 * 不做类型转换、不注入默认值（默认值由效果函数自己处理）。
 *
 * 设计原则：
 *   - 可选：没声明 schema 的效果完全跳过，不发 warning
 *   - 严格：有 schema 就严格查，错了只报错，不擅自转型
 *   - 轻量：只覆盖真正能抓到 mod 作者错误的类型
 *   - 统一：$xxx / random() 引用豁免走 ReferenceResolver.needsResolution
 */

// ==================== 类型定义 ====================

/**
 * 参数类型
 *
 * 基础类型：string / number / boolean / array / object / any
 * 内容 key 类型：检查字符串是否存在于对应注册表
 */
export type ParamType =
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "object"
    | "any"
    | "cardKey"
    | "organKey"
    | "relicKey"
    | "potionKey"
    | "enemyKey"
    | "eventKey"

/**
 * 参数定义
 */
export interface ParamDef {
    type: ParamType | ParamType[]     // 允许的类型（单个或联合）
    required?: boolean                  // 是否必填（默认 true）
    options?: readonly (string | number)[]  // 枚举值（如 ["handPile", "discardPile"]）
    description?: string                // 可选：文档用
}

/**
 * 效果参数 schema
 */
export interface EffectParamsSchema {
    [paramName: string]: ParamDef
}

// ==================== 类型检查 ====================

const contentKeyModules: Record<string, string> = {
    cardKey: "cardList",
    organKey: "organList",
    relicKey: "relicList",
    potionKey: "potionList",
    enemyKey: "enemyList",
    eventKey: "eventList",
}

/**
 * 检查字符串是否存在于指定注册表
 */
function checkContentKey(value: any, moduleKey: string): { valid: boolean; suggestion?: string } {
    if (typeof value !== "string") return { valid: false }

    let list: any[]
    try {
        list = getLazyModule<any[]>(moduleKey)
    } catch {
        // 注册表未加载时放行（例如测试环境或启动早期）
        return { valid: true }
    }

    if (!Array.isArray(list)) return { valid: true }

    const exists = list.some(item => item?.key === value)
    if (exists) return { valid: true }

    // 找相近 key 作为提示
    const suggestion = list
        .map(item => item?.key)
        .filter((k: any) => typeof k === "string")
        .find((k: string) => k.includes(value) || value.includes(k))

    return { valid: false, suggestion }
}

/**
 * 检查单一类型
 * 返回 { valid, suggestion? }，suggestion 仅在内容 key 类型未命中时提供
 */
function checkType(value: any, type: ParamType): { valid: boolean; suggestion?: string } {
    // $xxx / random(...) 引用直接豁免
    if (typeof value === "string" && needsReferenceResolution(value)) {
        return { valid: true }
    }

    switch (type) {
        case "string":
            return { valid: typeof value === "string" }
        case "number":
            return { valid: typeof value === "number" && !isNaN(value) }
        case "boolean":
            return { valid: typeof value === "boolean" }
        case "array":
            return { valid: Array.isArray(value) }
        case "object":
            return { valid: typeof value === "object" && value !== null && !Array.isArray(value) }
        case "any":
            return { valid: true }
        default: {
            const moduleKey = contentKeyModules[type]
            if (moduleKey) {
                return checkContentKey(value, moduleKey)
            }
            return { valid: false }
        }
    }
}

// ==================== 主入口 ====================

/**
 * 验证效果参数
 *
 * @param effectKey 效果 key（用于错误信息）
 * @param params   参数对象
 * @param schema   参数 schema（可选，未提供则跳过）
 * @returns 是否通过；失败时 errors 非空
 */
export function validateEffectParams(
    effectKey: string,
    params: Record<string, any> = {},
    schema?: EffectParamsSchema
): { valid: boolean; errors: string[] } {
    if (!schema) return { valid: true, errors: [] }

    const errors: string[] = []

    // 校验每个声明的参数
    for (const [paramName, paramDef] of Object.entries(schema)) {
        const paramValue = params[paramName]
        const isRequired = paramDef.required !== false

        // 缺失处理
        if (paramValue === undefined || paramValue === null) {
            if (isRequired) {
                errors.push(`效果 "${effectKey}" 缺少必需参数 "${paramName}"`)
            }
            continue
        }

        // 类型检查（支持联合）
        const allowedTypes = Array.isArray(paramDef.type) ? paramDef.type : [paramDef.type]
        let matched = false
        let lastSuggestion: string | undefined

        for (const type of allowedTypes) {
            const result = checkType(paramValue, type)
            if (result.valid) {
                matched = true
                break
            }
            if (result.suggestion) lastSuggestion = result.suggestion
        }

        if (!matched) {
            const expected = allowedTypes.join(" 或 ")
            const actual = Array.isArray(paramValue) ? "array" : typeof paramValue
            let msg = `效果 "${effectKey}" 的参数 "${paramName}" 类型错误：期望 ${expected}，实际 ${actual}，值: ${JSON.stringify(paramValue)}`
            if (lastSuggestion) msg += `（你是否想写 "${lastSuggestion}"？）`
            errors.push(msg)
            continue
        }

        // 枚举值检查
        if (paramDef.options && paramDef.options.length > 0) {
            // $ 引用豁免
            if (typeof paramValue === "string" && needsReferenceResolution(paramValue)) continue

            if (!paramDef.options.includes(paramValue)) {
                errors.push(
                    `效果 "${effectKey}" 的参数 "${paramName}" 值不合法：期望 ${paramDef.options.map(o => JSON.stringify(o)).join(" | ")}，实际 ${JSON.stringify(paramValue)}`
                )
            }
        }
    }

    return { valid: errors.length === 0, errors }
}

/**
 * 验证并在失败时通过 newError 显示错误信息（不抛异常，避免卡死游戏）
 */
export function validateEffectParamsAndReport(
    effectKey: string,
    params: Record<string, any> = {},
    schema?: EffectParamsSchema
): boolean {
    const result = validateEffectParams(effectKey, params, schema)
    if (!result.valid) {
        newError([`效果参数验证失败:`, ...result.errors])
    }
    return result.valid
}
