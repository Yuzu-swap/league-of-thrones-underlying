import { copyObj } from "../../Core/state"
import { ResouceType } from "../Const"
import { StateName } from "../Const"
import { StrategyType } from "./strategy"
import { Decimal } from "decimal.js"
export interface IBoost {
    setProduction( stateType: StateName, typ: ResouceType ,value: Decimal ): void
    getProduction( typ: ResouceType ): Decimal
    setTroop( troop: Decimal, needTroop: Decimal): void
    setMapBuff(list : number[]): void
    getMapBuff(): number[]
    getSilverPosProduction(): Decimal
    getProductionStatus(typ: ResouceType): {
        maintain: boolean,
        normalProduction: Decimal
    }
    setStrategyStatus( type: StrategyType, able: boolean ): void
    getStrategyStatus(type: StrategyType) : boolean
}

export class Boost implements IBoost{
    private city :{
        product : {[ key in ResouceType ] : Decimal }
    }
    private general:{
        product : {[ key in ResouceType ] : Decimal }
    }
    private map:{
        buff : number[]
    }

    private strategy:{
        store: boolean
        protect: boolean
    }
    

    private troop: Decimal
    private maintainNeedTroop: Decimal

    constructor(){
        this.city = {
            product:{
                [ResouceType.Silver] : new Decimal(0),
                [ResouceType.Troop] : new Decimal(0)
            }
        }
        this.general = {
            product:{
                [ResouceType.Silver] : new Decimal(0),
                [ResouceType.Troop] : new Decimal(0)
            }
        }
        this.map ={
            buff : []
        }
        this.troop = new Decimal(0)
        this.maintainNeedTroop = new Decimal(-1)
        this.strategy = {
            store : false,
            protect: false
        }
    }
    
    setProduction(stateType: StateName, typ: ResouceType, value: Decimal): void {
        switch(stateType){
            case StateName.City:
                this.city.product[typ] = value
                break
            case StateName.General:
                this.general.product[typ] = value
                break
        }
    }
    getProduction(typ: ResouceType): Decimal {
        let weight = new Decimal(1)
        if(this.maintainNeedTroop > this.troop){
            weight = Decimal.max(this.troop.div(this.maintainNeedTroop), 0.2)
        }
        return this.city.product[typ].add(this.general.product[typ]).mul(weight)
    }

    getSilverPosProduction(): Decimal {
        let weight = new Decimal(1)
        if(this.maintainNeedTroop > this.troop){
            weight = Decimal.max(this.troop.div(this.maintainNeedTroop), 0.2)
        }
        return this.city.product[ResouceType.Silver].add(this.general.product[ResouceType.Silver]).add(this.troop).mul(weight)
    }

    getProductionStatus(typ: ResouceType){
        let re = {
            maintain: true,
            normalProduction: this.city.product[typ].add(this.general.product[typ])
        }
        if(this.maintainNeedTroop > this.troop){
            re.maintain = false
        }
        return re
    }

    setTroop(troop: Decimal, needTroop: Decimal): void {
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
        }
        else{
            this.strategy.store = able
        }
    }

    getStrategyStatus(type: StrategyType) {
        if(type == StrategyType.Protect){
            return this.strategy.protect
        }
        else{
            return this.strategy.store 
        }
    }
}