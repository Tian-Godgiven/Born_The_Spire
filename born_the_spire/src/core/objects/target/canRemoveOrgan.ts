/**
 * 器官能否被舍弃。真相源是 status `cannot-remove` > 0，
 * 词条 `organ_cannot_remove` 只是挂这个 status 的语法糖。
 * 不要按 key / starter 标签特判。
 */
export const CANNOT_REMOVE_STATUS = "cannot-remove"

export function canRemoveOrgan(organ: { status?: Record<string, { value?: unknown }> }): boolean {
    return !(Number(organ.status?.[CANNOT_REMOVE_STATUS]?.value) > 0)
}
