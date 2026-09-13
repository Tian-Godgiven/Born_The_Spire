export const GAME_VERSION = "0.1.0"
export const QQ_GROUP = "782816134"

export const CREATOR_EGG_LINES = [
    "哦你打开了控制台！",
    "是你遇到了一个bug吗？还是说你在开发新东西？无论怎么样我都希望你知道我们有个QQ群！ 欢迎加入一起来讨论后续的更新/bug修复/mod开发！",
    `这是我们的群号：${QQ_GROUP}`,
]

export function printBrowserCreatorEgg() {
    for (const line of CREATOR_EGG_LINES) {
        console.log(line)
    }
}
