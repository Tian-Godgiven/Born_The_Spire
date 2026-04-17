/**
 * 属性配置类型定义
 */

export type StatusMap = {
    label: string              // 显示的文本
    value: number | string     // 起始值（默认值），可为字符串
    describe?: string          // 属性描述（用于提示）
    category?: "base" | "combat" | "card" | "special"  // 属性分类
    notNegative?: boolean      // 非负（不能小于0）
    unstackable?: boolean      // 不可堆叠
    hidden?: boolean           // 是否隐藏（不在UI中显示）
    calc?: boolean             // 是否参与自动计算（默认true），false时为字符串状态
    display?: boolean          // 是否显示为角标（默认true），false时不显示角标
    displayMap?: Record<string, string>  // 值到显示文本的映射（如 { "even": "偶", "odd": "奇" }）
    max?: number               // 最大值/阈值（用于计数器显示，如 "2/3"）
    maxFrom?: string           // 从另一个 status key 读取 max 值（动态引用）
} | number  // 简写形式：直接写数字表示默认值
