import { CurrentMap } from "@/core/types/CurrentMapData"
import { healthMap } from "./health"
import { energyMap } from "./energy"
import { isAliveMap } from "./isAlive"

//当前值map
const currentMap:Record<string,CurrentMap<any>> = {
    health:healthMap,
    energy:energyMap,
    isAlive:isAliveMap,
}

export function getMetaFromCurrentMap(key:string){
    const tmp = currentMap[key]
    return tmp ?? false
}