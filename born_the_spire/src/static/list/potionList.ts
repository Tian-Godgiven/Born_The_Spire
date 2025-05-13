import { Enemy } from "@/class/Enemy";
import { Player } from "@/class/Player";
import { Potion } from "@/class/Potion";

const potionList:{
    label:string,
    targetType:"player"|"enemy"|"all",
    key:string,
    use:(target:Player|Enemy)=>void;
    disCard?:()=>void
}[] = [
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
    const potionData = potionList.find(item=>item.key == potionKey)
    if(!potionData){
        throw new Error(`不存在的药水key${potionKey}`)
    }
    //生成药水对象
    const { label, key, use, targetType,disCard } = potionData;
    const potion = new Potion(label, key, use, targetType,disCard)
    return potion
}