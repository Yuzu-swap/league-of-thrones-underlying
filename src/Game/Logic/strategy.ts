import { MaxStrategyPoint } from "../Const";
import { Parameter, parameterConfig, StrategyBuyConfig, StrategyBuyConfigFromGDS } from "../DataConfig";
import { IStrategyState } from "../State";
import { getTimeStamp } from "../Utils";
import { IBoost } from "./boost";
import { City } from "./game";
import { General } from "./general";
import { Map } from "./map";

export class Strategy{
    state: IStrategyState
    boost: IBoost
    parameter: Parameter
    strategyBuyConfig: StrategyBuyConfig
    city: City
    map: Map
    general: General
    constructor( state: IStrategyState ){
        this.state = state
        this.parameter = parameterConfig
        this.strategyBuyConfig = StrategyBuyConfigFromGDS
    }

    setBoost( boost : IBoost){
        this.boost = boost
    }

    setLogic(city : City, map: Map, general: General){
        this.city = city
        this.map = map
        this.general = general
    }

    getStrategyPonit(){
        const time = getTimeStamp()
        let recover = Math.floor((time - this.state.strategyPoint.lastUpdate) / this.parameter.order_recovery_need_times)
        if(this.state.strategyPoint.value + recover > MaxStrategyPoint){
            return MaxStrategyPoint
        }
        else{
            return recover + this.state.strategyPoint.value
        }
    }

    getRecoverRemainTime(){
        const time = getTimeStamp()
        let strategyPoint = this.getStrategyPonit()
        if(strategyPoint == MaxStrategyPoint){
            return 0
        }
        else{
            let recoverTime = time - this.state.strategyPoint.lastUpdate
            let recoverCost = Math.floor((time - this.state.strategyPoint.lastUpdate) / this.parameter.order_recovery_need_times) * this.parameter.order_recovery_need_times
            return  this.parameter.order_recovery_need_times - (recoverTime - recoverCost)
        }
    }

    offsetStrategyPoint(amount : number){
        let strategyPoint = this.getStrategyPonit()
        const time = getTimeStamp()
        if(strategyPoint + amount >= MaxStrategyPoint){
            this.state.update(
                {
                    strategyPoint:{
                        lastUpdate: time,
                        value: MaxStrategyPoint,
                    }
                }
            )
            return true
        }
        else if( strategyPoint == MaxStrategyPoint){
            this.state.update(
                {
                    strategyPoint:{
                        lastUpdate: time,
                        value: strategyPoint + amount,
                    }
                }
            )
            return true
        }
        else if( strategyPoint + amount < 0 ){
            return false
        }
        else {
            let updateTime = time - ( this.parameter.order_recovery_need_times - this.getRecoverRemainTime())
            this.state.update(
                {
                    strategyPoint:{
                        lastUpdate: updateTime,
                        value: strategyPoint + amount,
                    }
                }
            )
            return true
        }
    }

    getBuyStrategyTimes(){
        const aDaySeconds =  60 * 60 * 24
        const time = getTimeStamp()
        let nowDay = Math.floor(time / aDaySeconds)
        let lastDay = Math.floor(this.state.buyTimes.lastUpdate / aDaySeconds)
        if(nowDay != lastDay){
            return 0
        }
        else{
            return this.state.buyTimes.value
        }
    }

    getBuyStrategyNeed(amount : number){
        let times = this.getBuyStrategyTimes()
        let re = 0
        if(times >= this.strategyBuyConfig.getMaxTimes()){
            return re
        }
        else{
            return this.strategyBuyConfig.config[times + 1] * amount
        }
    }

    buyStrategyPoint(amount: number){
        let times = this.getBuyStrategyTimes()
        const time = getTimeStamp()
        if(times >= this.strategyBuyConfig.getMaxTimes()){
            return {
                result : false,
                error: "have-reach-to-max-buy-times"
            }
        }
        else{
            let goldNeed = this.getBuyStrategyNeed(amount)
            if(!this.city.useGold(goldNeed)){
                return {
                    result : false,
                    error: "gold-is-not-enough"
                }
            }
            this.offsetStrategyPoint(amount)
            this.state.update(
                {
                    buyTimes:{
                        lastUpdate: time,
                        value: times + 1,
                    }
                }
            )
            return {
                result: true
            }
        }
    }

    getOpenDayCount(){
        let time = getTimeStamp()
        let openTime = this.map.seasonState.season_open == 0 ? this.map.seasonConfig.get(1).season_open : this.map.seasonState.season_open 
        let dayCount = Math.floor((time - openTime) / (60 * 60 * 24))
        return dayCount >=0 ? dayCount : 1
    }

    buyTroop(){
        let strategyUse = 1
        if(!this.offsetStrategyPoint(-strategyUse)){
            return{
                result: false,
                error: "strategy-point-error"
            }
        }
        let count = Math.pow(this.getOpenDayCount(), 2) * 1000
        this.city.useTroop(-count)
        return{
            result: true
        }
    }

    buySilver(){
        let strategyUse = 1
        if(!this.offsetStrategyPoint(-strategyUse)){
            return{
                result: false,
                error: "strategy-point-error"
            }
        }
        let count = Math.pow(this.getOpenDayCount(), 2) * 1000
        this.city.useSilver(-count)
        return{
            result: true
        }
    }

    buyMorale(){
        let strategyUse = 1
        if(!this.offsetStrategyPoint(-strategyUse)){
            return{
                result: false,
                error: "strategy-point-error"
            }
        }
        this.general.offsetMorale(2)
        return{
            result: true
        }
    }
}