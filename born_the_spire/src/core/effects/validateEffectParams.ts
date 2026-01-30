import { newError } from "@/ui/hooks/global/alert"

/**
 * 效果参数验证系统
 *
 * 用于在运行时验证 EffectUnit 的 params 是否符合预期
 * 提供清晰的错误信息，帮助开发者和mod作者正确使用效果系统
 */

// 参数类型定义
type ParamType = "string" | "number" | "boolean" | "array" | "object" | "any"

// 参数定义
interface ParamDef {
  type: ParamType | ParamType[]  // 允许的类型（可以是多个）
  required?: boolean              // 是否必需（默认true）
  default?: any                   // 默认值（如果提供，则required自动为false）
  description?: string            // 参数说明
  validate?: (value: any) => boolean  // 自定义验证函数
}

// 效果参数schema定义
interface EffectParamsSchema {
  [paramName: string]: ParamDef
}

// 所有效果的参数schema
const effectParamsSchemas: Record<string, EffectParamsSchema> = {
  // ========== 伤害相关 ==========
  damage: {
    value: { type: "number", description: "伤害值" }
  },

  modifyDamageValue: {
    delta: { type: "number", description: "伤害修改量（正数增加，负数减少）" }
  },

  modifyDamageByPercent: {
    percent: { type: "number", description: "伤害修改百分比（1.0 = 100%）" }
  },

  // ========== 治疗相关 ==========
  heal: {
    value: { type: "number", description: "治疗值" }
  },

  // ========== 状态相关 ==========
  applyState: {
    stateKey: { type: "string", description: "状态key" },
    stacks: { type: ["number", "array"], description: "层数（数字或Stack数组）" }
  },

  removeState: {
    stateKey: { type: "string", description: "状态key" },
    triggerRemoveEffect: { type: "boolean", default: false, description: "是否触发移除效果" }
  },

  changeStateStack: {
    stateKey: { type: "string", description: "状态key" },
    stackKey: { type: "string", default: "default", description: "层数key" },
    delta: { type: "number", description: "层数变化量" }
  },

  // ========== 属性相关 ==========
  addStatusBaseValue: {
    statusKey: { type: "string", description: "属性key" },
    value: { type: "number", description: "基础值变化量" }
  },

  addStatusCurrentValue: {
    statusKey: { type: "string", description: "属性key" },
    value: { type: "number", description: "当前值变化量" }
  },

  addStatusBaseCurrentValue: {
    statusKey: { type: "string", description: "属性key（base层）" },
    currentKey: { type: "string", description: "当前值key" },
    value: { type: "number", description: "变化量" }
  },

  // ========== 卡牌相关 ==========
  drawCard: {
    value: { type: "number", description: "抽牌数量" }
  },

  discardCard: {
    pileName: { type: "string", default: "handPile", description: "弃牌来源牌堆" },
    count: { type: "number", default: 1, description: "弃牌数量" }
  },

  discardAllCard: {
    pileName: { type: "string", default: "handPile", description: "弃牌来源牌堆" }
  },

  exhaustCard: {
    pileName: { type: "string", default: "handPile", description: "消耗来源牌堆" },
    count: { type: "number", default: 1, description: "消耗数量" }
  },

  discoverCard: {
    count: { type: "number", default: 3, description: "展示卡牌数量" },
    selectCount: { type: ["number", "array"], default: 1, description: "选择数量（数字或[min,max]）" },
    tags: { type: "array", default: [], description: "筛选标签" },
    allowDuplicate: { type: "boolean", default: false, description: "是否允许重复" }
  },

  chooseRandomCard: {
    count: { type: "number", description: "展示卡牌数量" },
    selectCount: { type: ["number", "array"], default: 1, description: "选择数量" },
    title: { type: "string", default: "选择卡牌", description: "标题" },
    description: { type: "string", required: false, description: "描述" },
    allowDuplicate: { type: "boolean", default: false, description: "是否允许重复" }
  },

  chooseCardUpgrade: {
    count: { type: "number", default: 1, description: "可升级卡牌数量" }
  },

  chooseCardRemove: {
    count: { type: "number", default: 1, description: "可移除卡牌数量" }
  },

  chooseCardDuplicate: {
    count: { type: "number", default: 1, description: "可复制卡牌数量" }
  },

  customCardChoice: {
    cards: { type: "array", description: "卡牌key数组" },
    selectCount: { type: ["number", "array"], default: 1, description: "选择数量" },
    title: { type: "string", default: "选择卡牌", description: "标题" },
    description: { type: "string", required: false, description: "描述" },
    cancelable: { type: "boolean", default: false, description: "是否可取消" }
  },

  // ========== 能量相关 ==========
  gainEnergy: {
    value: { type: "number", description: "获得能量值" }
  },

  payEnergy: {
    value: { type: "number", description: "消耗能量值" }
  },

  // ========== 回合相关 ==========
  turnStart: {},
  turnEnd: {},

  // ========== 生命相关 ==========
  killTarget: {
    info: { type: "object", required: false, description: "死亡信息" }
  },

  reviveTarget: {
    healthPercent: { type: "number", default: 1.0, description: "复活时生命百分比" }
  },

  // ========== 事件相关 ==========
  cancelEvent: {
    targetEvent: { type: "any", required: false, description: "要取消的目标事件（通过 info 传递）" }
  },

  cancelCurrentEvent: {},

  // ========== 器官相关 ==========
  replaceOrgan: {
    oldOrganKey: { type: "string", description: "旧器官key" },
    newOrganKey: { type: "string", description: "新器官key" }
  },

  // ========== 修饰器相关 ==========
  addStatusModifier: {
    statusKey: { type: "string", description: "属性key" },
    targetLayer: { type: "string", default: "current", description: "目标层（base/current）" },
    modifierType: { type: "string", default: "additive", description: "修饰器类型" },
    applyMode: { type: "string", default: "absolute", description: "应用模式" },
    modifierValue: { type: "number", required: false, description: "修饰器值" },
    modifierFunc: { type: "any", required: false, description: "修饰器函数" },
    clearable: { type: "boolean", default: true, description: "是否可清除" }
  },

  addTriggerToTarget: {
    triggerConfig: { type: "object", description: "触发器配置" }
  }
}

/**
 * 尝试将值转换为目标类型
 * 如果转换失败或结果不合理（如 NaN），返回原值
 */
function tryConvertType(value: any, targetType: ParamType): any {
  // 如果已经是目标类型，直接返回
  if (checkType(value, targetType)) {
    return value
  }

  // 如果是以 $ 开头的字符串，这是动态值占位符，会在运行时解析，跳过验证
  if (typeof value === "string" && value.startsWith("$")) {
    return value
  }

  switch (targetType) {
    case "number":
      // 如果是对象类型，尝试提取数值
      if (typeof value === "object" && value !== null) {
        // 可能是 { fromStatus: "xxx" } 这种动态值，不转换
        if ("fromStatus" in value || "fromState" in value) {
          return value
        }
        // 尝试提取 value 字段
        if ("value" in value) {
          const num = Number(value.value)
          return isNaN(num) ? value : num
        }
      }

      // 尝试转换为数字
      const num = Number(value)
      // 如果转换结果是 NaN，返回原值（让后续验证报错）
      return isNaN(num) ? value : num

    case "string":
      // 尝试转换为字符串
      if (value === null || value === undefined) {
        return value
      }
      return String(value)

    case "boolean":
      // 尝试转换为布尔值
      if (typeof value === "string") {
        if (value.toLowerCase() === "true") return true
        if (value.toLowerCase() === "false") return false
      }
      if (typeof value === "number") {
        return value !== 0
      }
      return value

    default:
      // 其他类型不尝试转换
      return value
  }
}

/**
 * 检查值的类型
 */
function checkType(value: any, type: ParamType): boolean {
  // 如果是以 $ 开头的字符串，这是动态值占位符，会在运行时解析，视为有效
  if (typeof value === "string" && value.startsWith("$")) {
    return true
  }

  switch (type) {
    case "string":
      return typeof value === "string"
    case "number":
      return typeof value === "number" && !isNaN(value)
    case "boolean":
      return typeof value === "boolean"
    case "array":
      return Array.isArray(value)
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value)
    case "any":
      return true
    default:
      return false
  }
}

/**
 * 验证单个参数
 */
function validateParam(
  paramName: string,
  paramValue: any,
  paramDef: ParamDef,
  effectKey: string
): { valid: boolean; value?: any; error?: string } {
  // 检查必需参数
  const isRequired = paramDef.required !== undefined ? paramDef.required : (paramDef.default === undefined)

  if (paramValue === undefined || paramValue === null) {
    if (isRequired) {
      return {
        valid: false,
        error: `效果 "${effectKey}" 缺少必需参数 "${paramName}"`
      }
    }
    return { valid: true, value: paramValue }  // 可选参数，未提供，使用默认值
  }

  // 尝试类型转换
  const allowedTypes = Array.isArray(paramDef.type) ? paramDef.type : [paramDef.type]
  let convertedValue = paramValue
  let typeMatch = allowedTypes.some(type => checkType(paramValue, type))

  // 如果类型不匹配，尝试转换
  if (!typeMatch) {
    for (const type of allowedTypes) {
      convertedValue = tryConvertType(paramValue, type)
      if (checkType(convertedValue, type)) {
        typeMatch = true
        break
      }
    }
  }

  if (!typeMatch) {
    const expectedTypes = allowedTypes.join(" 或 ")
    const actualType = Array.isArray(paramValue) ? "array" : typeof paramValue
    const valueInfo = convertedValue !== paramValue
      ? `原值: ${JSON.stringify(paramValue)}, 转换后: ${JSON.stringify(convertedValue)}`
      : `值: ${JSON.stringify(paramValue)}`
    return {
      valid: false,
      error: `效果 "${effectKey}" 的参数 "${paramName}" 类型错误：期望 ${expectedTypes}，实际 ${actualType}，且无法转换（${valueInfo}）`
    }
  }

  // 自定义验证
  if (paramDef.validate && !paramDef.validate(convertedValue)) {
    return {
      valid: false,
      error: `效果 "${effectKey}" 的参数 "${paramName}" 验证失败`
    }
  }

  return { valid: true, value: convertedValue }
}

/**
 * 验证效果参数
 *
 * @param effectKey 效果key
 * @param params 参数对象
 * @returns 验证结果和规范化后的参数
 */
export function validateEffectParams(
  effectKey: string,
  params: Record<string, any> = {}
): { valid: boolean; params: Record<string, any>; errors: string[] } {
  const schema = effectParamsSchemas[effectKey]

  // 如果没有定义schema，跳过验证（允许未定义的效果）
  if (!schema) {
    console.warn(`[validateEffectParams] 效果 "${effectKey}" 没有定义参数schema，跳过验证`)
    return { valid: true, params, errors: [] }
  }

  const errors: string[] = []
  const normalizedParams: Record<string, any> = {}

  // 验证每个定义的参数
  for (const [paramName, paramDef] of Object.entries(schema)) {
    const paramValue = params[paramName]
    const result = validateParam(paramName, paramValue, paramDef, effectKey)

    if (!result.valid) {
      errors.push(result.error!)
    } else {
      // 使用转换后的值、提供的值或默认值
      normalizedParams[paramName] = result.value !== undefined && result.value !== null
        ? result.value
        : paramDef.default
    }
  }

  // 检查是否有未定义的参数（警告，不报错）
  for (const paramName of Object.keys(params)) {
    if (!(paramName in schema)) {
      console.warn(`[validateEffectParams] 效果 "${effectKey}" 收到未定义的参数 "${paramName}"`)
    }
  }

  return {
    valid: errors.length === 0,
    params: normalizedParams,
    errors
  }
}

/**
 * 验证效果参数（抛出错误版本）
 *
 * 如果验证失败，会通过 newError 显示错误信息
 *
 * @param effectKey 效果key
 * @param params 参数对象
 * @returns 规范化后的参数
 */
export function validateEffectParamsOrThrow(
  effectKey: string,
  params: Record<string, any> = {}
): Record<string, any> {
  const result = validateEffectParams(effectKey, params)

  if (!result.valid) {
    const errorMessage = [
      `效果参数验证失败：`,
      ...result.errors
    ]
    newError(errorMessage)
    throw new Error(result.errors.join("\n"))
  }

  return result.params
}

/**
 * 获取效果的参数schema（用于文档生成）
 */
export function getEffectParamsSchema(effectKey: string): EffectParamsSchema | undefined {
  return effectParamsSchemas[effectKey]
}

/**
 * 获取所有效果的参数schema（用于文档生成）
 */
export function getAllEffectParamsSchemas(): Record<string, EffectParamsSchema> {
  return { ...effectParamsSchemas }
}
