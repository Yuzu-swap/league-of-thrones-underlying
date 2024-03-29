import { ComponentType, IComponent, Throne } from ".";
import { Strategy, StrategyType } from "../Logic/strategy";
import { ITransContext, LocalMediator, IStatetWithTransContextCallback, ITransResult } from '../Controler/mediator'
import { StateTransition, CityFacility, ResouceType, StateName, MaxStrategyPoint } from '../Const'
import { BaseMediator, IStateMediator, StateCallback } from '../../Core/mediator'
import { State, IState, IStateIdentity, copyObj } from '../../Core/state'

export interface IStrategyComponent extends IComponent{
    getStrategyPointInfo():{}
    getBuyStrategyPointNeed(amount: number): number
    getRecoverStrategyRemainTime(): number
    getStrategyNeed():{}
    getStrategiesInfo():{}
    buyStrategyPoint( amount: number ,callback: (result: any) => void): void
    buySilver(callback: (result: any) => void): void
    buyTroop(callback: (result: any) => void): void
    buyProtect(callback: (result: any) => void): void
    buyProtect1(callback: (result: any) => void): void
    buyStore(callback: (result: any) => void): void
    buyMorale(callback: (result: any) => void): void
}


export class StrategyComponent implements IStrategyComponent{
    type: ComponentType;
    strategy: Strategy;
    mediator: IStateMediator<StateTransition, ITransContext>
    constructor(mediator: IStateMediator<StateTransition, ITransContext>) {
        this.type = ComponentType.Strategy
        this.mediator = mediator
    }

    setStrategy(strategy: Strategy){
        this.strategy = strategy
        this.mediator.onReceiveState(
            {id: this.strategy.state.id}
            ,
            ()=>{
              this.strategy.updateBoost()
            }
          )
    }

    onStateUpdate(callback: IStatetWithTransContextCallback): void {
        this.mediator.onReceiveState(
            {id: this.strategy.state.id}
            ,
            callback
        )
    }

    getStrategyPointInfo(): {} {
        let re = {}
        re['strategyPoint'] = this.strategy.getStrategyPonit()
        re['maxStrategyPoint'] = MaxStrategyPoint
        re['buyTimes'] = this.strategy.getBuyStrategyTimes()
        re['buyTimesLastUpdate'] = this.strategy.getBuyStrategyTimesLastUpdate()
        re['maxBuyTimes'] = this.strategy.strategyBuyConfig.getMaxTimes()
        return re
    }

    getStrategiesInfo():{} {
        let re = {}
        re['buyTroopCount'] = this.strategy.getOpenDayCount() * 70
        re['buySilverCount'] = this.strategy.getOpenDayCount() * 10000
        re['buyMoraleCount'] = 3
        re['protect1'] = {
            able : this.strategy.getStrategyStatus(StrategyType.Protect1).able,
            remainTime: this.strategy.getStrategyStatusRemainTime(StrategyType.Protect1),
            maxTime: this.strategy.parameter.order_protect_1hour_times
        }
        re['protect'] = {
            able : this.strategy.getStrategyStatus(StrategyType.Protect).able,
            remainTime: this.strategy.getStrategyStatusRemainTime(StrategyType.Protect),
            maxTime: this.strategy.parameter.order_protect_times
        }
        re['store'] = {
            able : this.strategy.getStrategyStatus(StrategyType.Store).able,
            remainTime: this.strategy.getStrategyStatusRemainTime(StrategyType.Store),
            maxTime: this.strategy.parameter.order_hoard_times
        }
        return re 
    }

    getBuyStrategyPointNeed(amount: number): number {
        return this.strategy.getBuyStrategyNeed(amount)
    }

    getRecoverStrategyRemainTime(): number {
        return this.strategy.getRecoverRemainTime()
    }

    getStrategyNeed() {
        return{
            buySilver: 1,
            buyTroop: 1,
            buyMorale: 1,
            protect1: this.strategy.parameter.order_protect_1hour_need,
            protect: this.strategy.parameter.order_protect_need,
            store: this.strategy.parameter.order_hoard_need
        }
    }

    buyStrategyPoint(amount: number, callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.BuyStrategyPoint,{
            from: Throne.instance().username,
            amount: amount
          }, callback)
    }

    buySilver(callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.StrategyBuySilver,{
            from: Throne.instance().username,
        }, callback)
    }

    buyTroop(callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.StrategyBuyTroop,{
            from: Throne.instance().username,
        }, callback)
    }

    buyMorale(callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.StrategyBuyMorale,{
            from: Throne.instance().username,
        }, callback)
    }

    buyProtect(callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.StrategyBuyProtect,{
            from: Throne.instance().username,
        }, callback)
    }

    buyProtect1(callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.StrategyBuyProtect1,{
            from: Throne.instance().username,
        }, callback)
    }

    buyStore(callback: (result: any) => void): void {
        this.mediator.sendTransaction(StateTransition.StrategyBuyStore,{
            from: Throne.instance().username,
        }, callback)
    }
}