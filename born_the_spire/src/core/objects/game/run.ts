import { GameRun } from "@/core/objects/system/GameRun";
import { Player } from "@/core/objects/target/Player";
import router from "@/ui/router";
import { playerList } from "@/static/list/target/playerList";
import { reactive, ref } from "vue";
import { addToPlayerTeam } from "./battle";

const defaultPlayer = new Player(playerList["default"])
const defaultGameRun = new GameRun()
//当前的局
export const nowGameRun = ref<GameRun>(defaultGameRun)
//当前的玩家
export const nowPlayer = reactive<Player>(defaultPlayer)

// 调试：暴露到全局
;(window as any).nowPlayerDebug = nowPlayer

//开始一局新游戏
export function startNewRun(){
    console.log('[startNewRun] 开始创建新游戏')
    console.log('[startNewRun] nowPlayer before:', nowPlayer, 'cards length:', nowPlayer.cards?.length)

    //创建本局
    const gameRun = new GameRun()
    nowGameRun.value = gameRun
    //初始化对象
    const map = playerList["default"]
    //创建本局角色
    console.log('[startNewRun] 准备创建新 player')
    const player = new Player(map)
    console.log('[startNewRun] 新 player 创建完成，cards length:', player.cards.length)
    console.log('[startNewRun] 新 player.cards 内容：', player.cards.map(c => c.label))

    console.log('[startNewRun] 准备 Object.assign')
    Object.assign(nowPlayer,player)//应用该对象
    console.log('[startNewRun] Object.assign 完成')
    console.log('[startNewRun] nowPlayer.cards length:', nowPlayer.cards.length)
    console.log('[startNewRun] nowPlayer.cards 内容：', nowPlayer.cards.map(c => c.label))
    console.log('[startNewRun] nowPlayer.cards === player.cards?', nowPlayer.cards === player.cards)

    //添加到队伍中
    addToPlayerTeam(nowPlayer)
    //跳转到游戏页面
    router.replace("running")
}

//结束一局游戏，返回初始菜单
export function endRun(){
    router.replace("/")
}
