import { Enemy } from "@/objects/Enemy";
import { Player } from "@/objects/Player";
import { Potion } from "@/objects/Potion";

export type PotionMap = {
    label:string,
    targetType:"player"|"enemy"|"all",
    key:string,
    use:(target:Player|Enemy)=>void;
    disCard?:()=>void
}

const potionList:PotionMap[] = [
    {
        label:"生命药剂",
        targetType:"player",
        key:"original_potion_00001",
        use:(target)=>{
            console.log(target,"恢复了10生命")
        }
    }
]

//获取药水对象
export function getPotionByKey(potionKey:string):Potion{
    //获取数据
    const map = potionList.find(item=>item.key == potionKey)
    if(!map){
        throw new Error(`不存在的药水key${potionKey}`)
    }
    //生成药水对象
    const potion = new Potion(map)
    return potion
}