//报错：拼成一句可读的话，对象只报身份，不把整坨实体 table 出来

function formatErrorPart(value: unknown): string {
    if (value === null) return "无(null)"
    if (value === undefined) return "undefined"
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value)
    }
    if (Array.isArray(value)) {
        return value.map(formatErrorPart).join(",")
    }
    if (typeof value !== "object") return String(value)

    const obj = value as { label?: unknown, key?: unknown, constructor?: { name?: string } }
    const type = obj.constructor?.name && obj.constructor.name !== "Object"
        ? obj.constructor.name
        : ""
    const name = obj.label ?? obj.key
    if (name != null && String(name).trim() !== "") {
        return type ? `${name}(${type})` : String(name)
    }
    if (type) return type
    return "<无法识别对象>"
}

export function newError(info: (string | object | undefined)[]): never {
    const message = info.map(formatErrorPart).join("")
    console.error(message)
    throw new Error(message)
}
