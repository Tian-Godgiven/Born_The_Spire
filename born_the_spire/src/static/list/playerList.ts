export type PlayerMap = {
    label:string,
    key:string
    money:Record<string,number>,
    status:Record<string,number|boolean>,
    potion:{
        max:number,
        now:string[]
    }
}
export const playerList:Record<string,PlayerMap> = {
    "default":{
        label:"默认角色",
        key:"original_chara_00001",
        money:{
            "original_money_00001":100,
        },
        status:{
            "original_status_00001":50,
            "original_status_00002":3
        },
        potion:{
            max:3,
            now:["original_potion_00001"]
        }
    }
}