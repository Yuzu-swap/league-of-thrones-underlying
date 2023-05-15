import { getTextOfJSDocComment } from "typescript";
import { MaxStrategyPoint, StateTransition } from "../Const";
import { Parameter, parameterConfig, StrategyBuyConfig, StrategyBuyConfigFromGDS } from "../DataConfig";
import { IStrategyState, StrategyStatus } from "../State";
import { getTimeStamp, isNumber } from "../Utils";
import { IBoost } from "./boost";
import { City } from "./game";
import { General } from "./general";
import { Map } from "./map";

export enum StrategyType {
    Store = 'store',
    Protect = 'protect',
    Protect1 = 'protect1',
}

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
            let point = recover + this.state.strategyPoint.value
            return isNumber(point) ? point : 0;
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

    offsetStrategyPoint(amount : number, overload: boolean = false){
        if(!isNumber(amount)){
            return false
        }
        let strategyPoint = this.getStrategyPonit()
        const time = getTimeStamp()
        if(strategyPoint + amount >= MaxStrategyPoint){
            let value = MaxStrategyPoint
            if(overload) {
                value =  strategyPoint + amount
            }
            this.state.update(
                {
                    strategyPoint:{
                        lastUpdate: time,
                        value: value,
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
            return isNumber(this.state.buyTimes.value) ? this.state.buyTimes.value : 0
        }
    }

    getBuyStrategyNeed(amount : number){
        let times = this.getBuyStrategyTimes()
        let re = 0
        if(times + amount > this.strategyBuyConfig.getMaxTimes()){
            return re
        }
        else{
            for(let i = times; i < times + amount; i++){
                re += this.strategyBuyConfig.config[i]
            }
            return re
        }
    }

    buyStrategyPoint(amount: number){
        if(!isNumber(amount)){
            return {
                result : false,
                txType: StateTransition.BuyStrategyPoint,
                error: "amount-illegal"
            }
        }
        if(amount <= 0){
            return {
                result : false,
                txType: StateTransition.BuyStrategyPoint,
                error: "amount-illegal"
            }
        }
        let times = this.getBuyStrategyTimes()
        const time = getTimeStamp()
        if(times + amount > this.strategyBuyConfig.getMaxTimes()){
            return {
                result : false,
                txType: StateTransition.BuyStrategyPoint,
                error: "have-reach-to-max-buy-times"
            }
        }
        else{
            let goldNeed = this.getBuyStrategyNeed(amount)
            if(!this.city.useGold(goldNeed)){
                return {
                    result : false,
                    txType: StateTransition.BuyStrategyPoint,
                    error: "gold-is-not-enough"
                }
            }
            this.offsetStrategyPoint(amount)
            this.state.update(
                {
                    buyTimes:{
                        lastUpdate: time,
                        value: times + amount,
                    }
                }
            )
            return {
                result: true,
                txType: StateTransition.BuyStrategyPoint
            }
        }
    }

    getOpenDayCount(){
        let time = getTimeStamp()
        let openTime = this.map.seasonState.season_open == 0 ? this.map.seasonConfig.get(1).season_open : this.map.seasonState.season_open 
        let dayCount = Math.ceil((time - openTime) / (60 * 60 * 24))
        return dayCount >=0 ? dayCount : 1
    }

    buyTroop(){
        let strategyUse = 1
        if(!this.offsetStrategyPoint(-strategyUse)){
            return{
                result: false,
                txType: StateTransition.StrategyBuyTroop,
                error: "strategy-point-error"
            }
        }
        let count = this.getOpenDayCount() * 70
        this.city.useTroop(-count)
        return{
            result: true,
            txType: StateTransition.StrategyBuyTroop
        }
    }

    buySilver(){
        let strategyUse = 1
        if(!this.offsetStrategyPoint(-strategyUse)){
            return{
                result: false,
                txType: StateTransition.StrategyBuySilver,
                error: "strategy-point-error"
            }
        }
        let count = this.getOpenDayCount() * 10000
        this.city.useSilver(-count)
        return{
            result: true,
            txType: StateTransition.StrategyBuySilver
        }
    }

    buyProtect(){
        let strategyUse = this.parameter.order_protect_need
        if(!this.offsetStrategyPoint(-strategyUse)){
            return{
                result: false,
                txType: StateTransition.StrategyBuyProtect,
                error: "strategy-point-error"
            }
        }
        this.setStrategyStatus(StrategyType.Protect, true)
        return{
            result: true,
            txType: StateTransition.StrategyBuyProtect
        }
    }

    buyProtect1(){
        let strategyUse = this.parameter.order_protect_1hour_need
        console.log('buyProtect1.1', strategyUse, StrategyType.Protect1);
        if(!this.offsetStrategyPoint(-strategyUse)){
            return{
                result: false,
                txType: StateTransition.StrategyBuyProtect1,
                error: "strategy-point-error"
            }
        }
        console.log('buyProtect1', strategyUse, StrategyType.Protect1);
        this.setStrategyStatus(StrategyType.Protect1, true)
        return{
            result: true,
            txType: StateTransition.StrategyBuyProtect1
        }
    }

    buyStore(){
        let strategyUse = this.parameter.order_hoard_need
        if(!this.offsetStrategyPoint(-strategyUse)){
            return{
                result: false,
                txType: StateTransition.StrategyBuyStore,
                error: "strategy-point-error"
            }
        }
        this.setStrategyStatus(StrategyType.Store, true)
        return{
            result: true,
            txType: StateTransition.StrategyBuyStore
        }
    }

    buyMorale(){
        let strategyUse = 1
        if(!this.offsetStrategyPoint(-strategyUse)){
            return{
                result: false,
                txType: StateTransition.StrategyBuyMorale,
                error: "strategy-point-error"
            }
        }
        this.general.offsetMorale(3)
        return{
            result: true,
            txType: StateTransition.StrategyBuyMorale
        }
    }

    getStrategyStatus(type : StrategyType){
        const time = getTimeStamp()
        let info : StrategyStatus
        let lastTime : number
        if(type == StrategyType.Protect){
            info = this.state.protect
            lastTime = this.parameter.order_protect_times
        }else if(type == StrategyType.Protect1){
            info = this.state.protect1 || {able:false, beginTime: 0}
            lastTime = this.parameter.order_protect_1hour_times
        }else{
            info = this.state.store
            lastTime = this.parameter.order_hoard_times
        }
        let re : StrategyStatus = {
            able : false,
            beginTime: 0
        }
        if( !info.able){
            return re
        }
        else{
            if(time - info.beginTime > lastTime){
                return re
            }
            else{
                re.able = true
                re.beginTime = info.beginTime
                return re
            }
        }
    }

    setStrategyStatus(type: StrategyType, able: boolean){
        const time = getTimeStamp()
        let item : StrategyStatus = {
            able : able,
            beginTime: 0
        }
        if(able){
            item.beginTime = time
        }
        if(type == StrategyType.Protect ){
            this.state.update(
                {
                    protect : item
                }
            )
        }
        if(type == StrategyType.Protect1 ){
            this.state.update(
                {
                    protect1 : item
                }
            )
        }
        else{
            this.state.update(
                {
                    store: item
                }
            )
        }
    }

    getStrategyStatusRemainTime(type : StrategyType){
        const time = getTimeStamp()
        let info = this.getStrategyStatus(type)
        let lastTime : number
        if(type == StrategyType.Protect){
            lastTime = this.parameter.order_protect_times
        }else if(type == StrategyType.Protect1){
            lastTime = this.parameter.order_protect_1hour_times
        }else{
            lastTime = this.parameter.order_hoard_times
        }
        let remainTime = 0
        if(info.able){
            remainTime = lastTime - (time - info.beginTime)
        }
        if(remainTime < 0){
            throw "strategy status calculate error"
        }
        return remainTime
    }

    updateBoost(){
        this.boost.setStrategyStatus(StrategyType.Protect, this.getStrategyStatus(StrategyType.Protect).able)
        this.boost.setStrategyStatus(StrategyType.Protect1, this.getStrategyStatus(StrategyType.Protect1).able)
        this.boost.setStrategyStatus(StrategyType.Store, this.getStrategyStatus(StrategyType.Store).able)
    }
}