import { nanoid } from "nanoid"

//修饰器
export class Modifier{
    public uuId:string
    public source:any
    public ifDisabled:boolean = false
    constructor(source:any){
        this.uuId = nanoid()
        this.source = source
    }
    disable(){
        this.ifDisabled = true
    }
    able(){
        this.ifDisabled = false
    }
}



