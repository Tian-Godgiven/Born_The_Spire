type MoneyMap = {
    label:string,
    key:string
}
export type Money = {
    label:string,
    key:string,
    num:number
}
export const moneyList:MoneyMap[] = [
    {
        label:"金币",
        key:"original_money_00001",
    }
]

//设定指定金钱的值，返回设定后的金钱对象
export function getMoneyByKey(key:string,num:number):Money{
    //从列表中找到指定的对象
    const money = moneyList.find(item=>item.key == key)
    if(!money)throw new Error("没有找到金钱对象")
    return {
        ...money,
        num
    }
}