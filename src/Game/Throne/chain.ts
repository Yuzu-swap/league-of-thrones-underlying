import { ComponentType, IComponent, Throne } from ".";
import { Strategy, StrategyType } from "../Logic/strategy";
import { ITransContext, LocalMediator, IStatetWithTransContextCallback, ITransResult } from '../Controler/mediator'
import { StateTransition, CityFacility, ResouceType, StateName, MaxStrategyPoint } from '../Const'
import { BaseMediator, IStateMediator, StateCallback } from '../../Core/mediator'
import { State, IState, IStateIdentity, copyObj } from '../../Core/state'

export interface IChainComponent extends IComponent{
    
}


export class ChainComponent implements IChainComponent{
    type: ComponentType;
    mediator: IStateMediator<StateTransition, ITransContext>
    constructor(mediator: IStateMediator<StateTransition, ITransContext>) {
        this.type = ComponentType.Strategy
        this.mediator = mediator
    }

    onStateUpdate(callback: IStatetWithTransContextCallback): void {
        this.mediator.onReceiveState(
            {id: this.strategy.state.id}
            ,
            callback
        )
    }

    
}