import { Describe } from "@/ui/hooks/express/describe"

type Entry = {
    describe:Describe
}

export const entryList:Record<string,Entry> = {
    //消耗
    exhaust:{
        describe:["使用后，将其移入消耗堆，而非弃牌堆"]
    },
    void:{
        describe:["若回合结束时仍在手牌中，会移入消耗堆而非弃牌堆"]
    }
}