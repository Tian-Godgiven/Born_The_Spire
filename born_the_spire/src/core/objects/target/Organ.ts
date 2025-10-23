import { OrganMap } from "@/static/list/target/organList";
import { Entity } from "../system/Entity";

export class Organ extends Entity{
    public readonly label:string
    public readonly key:string
    constructor(map:OrganMap){
        super(map)
        this.label = map.label;
        this.key = map.key;
    }
}