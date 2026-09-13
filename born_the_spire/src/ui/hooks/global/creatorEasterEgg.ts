/** 给打开控制台的人看的彩蛋。GitHub 没有留言板，Issue 就是留言处。 */
export const GITHUB_REPO = "https://github.com/Tian-Godgiven/Born_The_Spire"
export const GITHUB_ISSUES = `${GITHUB_REPO}/issues`

export const CREATOR_EGG_LINES = [
    "看见这里的话：蘇生尖塔很期待更多创作者。",
    "做 Mod、改内容、或和我们一起写，都欢迎到 GitHub 开 Issue 留言。",
    GITHUB_ISSUES,
]

export function printBrowserCreatorEgg() {
    console.log("%c蘇生尖塔", "font-size: 20px; font-weight: bold; padding: 8px 0;")
    console.log("%c你打开了控制台。这里欢迎创作者。", "font-size: 13px;")
    for (const line of CREATOR_EGG_LINES) {
        console.log(line)
    }
}
