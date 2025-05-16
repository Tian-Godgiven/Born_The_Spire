import { OrganMap } from "@/static/list/organList";
import { Target } from "./Target";
import { Describe } from "@/hooks/express/describe";

export class Organ{
    public readonly label:string
    public readonly key:string
    public describe?:Describe
    public onGet?:(who:Target)=>void
    constructor(map:OrganMap){
        this.describe = map.describe
        this.label = map.label;
        this.key = map.key;
        this.onGet = map.onGet
    }
    get(who:Target){
        if(this.onGet){
            this.onGet(who)
        }
    }
}