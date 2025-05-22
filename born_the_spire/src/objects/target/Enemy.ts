import { EnemyMap } from "@/static/list/target/enemyList";
import { Chara } from "./Target";

export class Enemy extends Chara{
    constructor(
        map:EnemyMap
    ){
        super(map)
    }
}