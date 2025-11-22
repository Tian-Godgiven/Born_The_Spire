import { EnemyMap } from "@/static/list/target/enemyList";
import { Chara } from "./Target";

export class Enemy extends Chara{
    constructor(
        map:EnemyMap
    ){
        //默认有生命值
        if(map.current){
            if(!map.current.find(i=>{
                return i === "health" || (typeof i === 'object' && i.key === "health");
            })){
                map.current.push("health")
            }
        }
        else{
            map.current = ["health"]
        }
        super(map)
    }
}