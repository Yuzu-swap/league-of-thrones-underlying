import { copyObj } from "../../Core/state"
import { ResouceType } from "../Const"
import { StateName } from "../Const"
import { StrategyType } from "./strategy"
export interface IBoost {
    setProduction( stateType: StateName, typ: ResouceType ,value: number ): void
    getProduction( typ: ResouceType ): number
    setTroop( troop: number, needTroop: number): void
    setMapBuff(list : number[]): void
    getMapBuff(): number[]
    getSilverPosProduction(): number
    getProductionStatus(typ: ResouceType): {
        maintain: boolean,
        normalProduction: number
    }
    setStrategyStatus( type: StrategyType, able: boolean ): void
    getStrategyStatus(type: StrategyType) : boolean
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

    private strategy:{
        store: boolean
        protect: boolean
        protect1: boolean
    }
    

    private troop: number
    private maintainNeedTroop: number

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
        this.troop = 0
        this.maintainNeedTroop = -1
        this.strategy = {
            store : false,
            protect: false,
            protect1: false
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
        let weight = 1
        if(this.maintainNeedTroop > this.troop){
            weight = Math.max(this.troop / this.maintainNeedTroop, 0.8)
        }
        return (this.city.product[typ] + this.general.product[typ]) * weight
    }

    getSilverPosProduction(){
        let weight = 1
        if(this.maintainNeedTroop > this.troop){
            weight = Math.max(this.troop / this.maintainNeedTroop, 0.8)
        }
        return ( this.city.product[ResouceType.Silver] + this.general.product[ResouceType.Silver] + this.troop ) * weight
    }

    getProductionStatus(typ: ResouceType){
        let re = {
            maintain: true,
            normalProduction: this.city.product[typ] + this.general.product[typ]
        }
        if(this.maintainNeedTroop > this.troop){
            re.maintain = false
        }
        return re
    }

    setTroop(troop: number, needTroop: number): void {
        this.troop = troop
        this.maintainNeedTroop = needTroop
    }

    setMapBuff( list : number[]){
        this.map.buff = list.concat()
    }

    getMapBuff(){
        return this.map.buff.concat()
    }

    setStrategyStatus( type: StrategyType, able: boolean ){
        if(type == StrategyType.Protect){
            this.strategy.protect = able
        }else if(type == StrategyType.Protect1){
            this.strategy.protect1 = able
        }else{
            this.strategy.store = able
        }
    }

    getStrategyStatus(type: StrategyType) {
        if(type == StrategyType.Protect){
            return this.strategy.protect
        }else if(type == StrategyType.Protect1){
            return this.strategy.protect1
        }else{
            return this.strategy.store 
        }
    }
}