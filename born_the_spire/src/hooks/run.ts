import { GameRun } from "@/class/GameRun";
import { Player } from "@/class/Player";
import router from "@/router";
import { playerList } from "@/static/list/playerList";
import { ref } from "vue";
import { addToPlayerTeam } from "./battle";

const defaultPlayer = new Player([],[],[])
const defaultGameRun = new GameRun()
//当前的局 
export const nowGameRun = ref<GameRun>(defaultGameRun)
//当前的玩家
export const nowPlayer = ref<Player>(defaultPlayer)

//开始一局新游戏
export function startNewRun(){
    //创建本局
    const gameRun = new GameRun()
    nowGameRun.value = gameRun
    //创建本局角色
    const player = new Player([],[],[])
    //初始化对象
    const map = playerList["default"]
    player.initPlayer(map)
    nowPlayer.value = player//应用该对象
    //添加到队伍中
    addToPlayerTeam(player)
    //跳转到游戏页面
    router.replace("running")
}

//结束一局游戏，返回初始菜单
export function endRun(){
    router.replace("/")
}
