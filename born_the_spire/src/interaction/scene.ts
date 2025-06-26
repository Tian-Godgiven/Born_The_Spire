import { ref } from "vue"

type SceneName = "battle"|"map"
export const nowScene = ref<SceneName>("battle")
//切换到指定场景
export function changeScene(sceneName:SceneName){
    nowScene.value = sceneName
}