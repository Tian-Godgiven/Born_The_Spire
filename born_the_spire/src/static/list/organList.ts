import { Organ } from "@/class/Organ"

export const organList:{
    label:string,
    key:string
}[] = [
    {
        label:"心脏",
        key:"original_organ_00001",
    },{
        label:"石芯",
        key:"original_organ_00002",
    },{
        label:"石肤",
        key:"original_organ_00003"
    }
]

//通过key来获取器官对象
export function getOrganByKey(key:string):Organ{
    const data = organList.find(value=>value.key==key)
    if(!data)throw new Error("没有该器官对象")
    const organ = new Organ(data)
    return organ
}