export class Organ{
    public readonly label:string
    public readonly key:string
    constructor({
        label,
        key,
    }:{label:string,key:string}){
        this.label = label;
        this.key = key
    }
}