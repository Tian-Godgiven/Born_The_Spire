/**
 * 属性配置类型定义
 */

export type StatusMap = {
    label: string              // 显示的文本
    value: number              // 起始值（默认值）
    describe?: string          // 属性描述（用于提示）
    category?: "base" | "combat" | "card" | "special"  // 属性分类
    notNegative?: boolean      // 非负（不能小于0）
    unstackable?: boolean      // 不可堆叠
    hidden?: boolean           // 是否隐藏（不在UI中显示）
} | number  // 简写形式：直接写数字表示默认值
