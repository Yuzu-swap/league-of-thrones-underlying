import { ComponentType, IComponent, Throne } from ".";
import { Strategy } from "../Logic/strategy";
import { ITransContext, LocalMediator, IStatetWithTransContextCallback, ITransResult } from '../Controler/mediator'
import { StateTransition, CityFacility, ResouceType, StateName, MaxStrategyPoint } from '../Const'
import { BaseMediator, IStateMediator, StateCallback } from '../../Core/mediator'
import { State, IState, IStateIdentity, copyObj } from '../../Core/state'

export interface IStrategyComponent extends IComponent{
    getStrategyPointInfo():{}
    getBuyStrategyPointNeed(amount: number): number
    getRecoverStrategyRemainTime(): number
    getStrategyNeed():{}
    buyStrategyPoint( amount: number ,callback: (result: any) => void): void
    buySilver(callback: (result: any) => void): void
    buyTroop(callback: (result: any) => void): void
    buyMorale(callback: (result: any) => void): void
}

export class StrategyComponent implements IStrategyComponent{
    type: ComponentType;
    strategy: Strategy;
    mediator: IStateMediator<StateTransition, ITransContext>
    constructor(mediator: IStateMediator<StateTransition, ITransContext>) {
        this.type = ComponentType.General
        this.mediator = mediator
    }

    setStrategy(strategy: Strategy){
        this.strategy = strategy
    }

    onStateUpdate(callback: IStatetWithTransContextCallback): void {
        this.mediator.onReceiveState(
            {id : StateName.Strategy}
            ,
            callback
        )
    }

    getStrategyPointInfo(): {} {
        let re = {}
        re['strategyPoint'] = this.strategy.getStrategyPonit()
        re['maxStrategyPoint'] = MaxStrategyPoint
        re['buyTimes'] = this.strategy.getBuyStrategyTimes()
        re['maxBuyTimes'] = this.strategy.strategyBuyConfig.getMaxTimes()
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
            protect: 12,
            store: 2
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
}