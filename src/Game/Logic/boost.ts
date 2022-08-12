import { copyObj } from "../../Core/state"
import { ResouceType } from "../Const"
import { StateName } from "../Const"
export interface IBoost {
    setProduction( stateType: StateName, typ: ResouceType ,value: number ): void
    getProduction( typ: ResouceType ): number
    setMapBuff(list : number[]): void
    getMapBuff(): number[]
}

export class Boost implements IBoost{
    private city :{
        product : {}
    }
    private general:{
        product : {}
    }
    private map:{
        buff : number[]
    }
    constructor(){
        this.city = {
            product:{
                [ResouceType.Silver] : 0,
                [ResouceType.Troop] : 0
            }
        }
        this.general = {
            product:{
                [ResouceType.Silver] : 0,
                [ResouceType.Troop] : 0
            }
        }
        this.map ={
            buff : []
        }
    }
    
    setProduction(stateType: StateName, typ: ResouceType, value: number): void {
        switch(stateType){
            case StateName.City:
                this.city.product[typ] = value
                break
            case StateName.General:
                this.general.product[typ] = value
                break
        }
    }
    getProduction(typ: ResouceType): number {
        return this.city.product[typ] + this.general.product[typ]
    }

    setMapBuff( list : number[]){
        this.map.buff = list.concat()
    }

    getMapBuff(){
        return this.map.buff.concat()
    }
}