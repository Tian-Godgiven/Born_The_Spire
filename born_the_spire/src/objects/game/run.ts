import { GameRun } from "@/objects/system/GameRun";
import { Player } from "@/objects/target/player/Player";
import router from "@/router";
import { playerList, PlayerMap } from "@/static/list/target/playerList";
import { reactive, ref } from "vue";
import { addToPlayerTeam } from "./battle";


const defaultGameRun = new GameRun()
//当前的局 
export const nowGameRun = ref<GameRun>(defaultGameRun)
//当前的玩家模板，使用这个模板在每一次战斗时创建新的玩家对象
export let nowPlayerMap:PlayerMap = playerList["default"]

//当前的玩家对象
export const nowPlayer = reactive<Player>(new Player(nowPlayerMap))

//开始一局新游戏
export function startNewRun(){
    //创建本局
    const gameRun = new GameRun()
    nowGameRun.value = gameRun
    //初始化对象
    nowPlayerMap = playerList["default"]
    //跳转到游戏页面
    router.replace("running")
}

//结束一局游戏，返回初始菜单
export function endRun(){
    router.replace("/")
}
