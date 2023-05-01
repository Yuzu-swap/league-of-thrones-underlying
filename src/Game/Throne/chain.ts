import { ComponentType, IComponent, Throne } from ".";
import { Strategy, StrategyType } from "../Logic/strategy";
import { ITransContext, LocalMediator, IStatetWithTransContextCallback, ITransResult } from '../Controler/mediator'
import { StateTransition, CityFacility, ResouceType, StateName, MaxStrategyPoint } from '../Const'
import { BaseMediator, IStateMediator, StateCallback } from '../../Core/mediator'
import { State, IState, IStateIdentity, copyObj } from '../../Core/state'
import { MessageS2C } from "../Controler/Websocket/protocol";

export interface IChainComponent extends IComponent{
    onReceiveChainBlockInfo( callback: (obj: any) =>void )
}


export class ChainComponent implements IChainComponent{
    type: ComponentType;
    mediator: IStateMediator<StateTransition, ITransContext>
    callbackList: (( {} )=>void)[]
    constructor(mediator: IStateMediator<StateTransition, ITransContext>) {
        this.type = ComponentType.Strategy
        this.mediator = mediator
        this.callbackList = []
        this.mediator.setChainBlockCallback(
            (msg)=>this.HandleMsg(msg)
        )
    }

    onStateUpdate(callback: IStatetWithTransContextCallback): void {
        
    }

    onReceiveChainBlockInfo( callback: (obj: any) =>void )
    {
        this.callbackList.push(callback)
    }

    HandleMsg( msg: MessageS2C ):void {
        //tofixed
        // if(msg.Data.txType != undefined){
            for(let i = 0; i < this.callbackList.length ; i++){
                this.callbackList[i](msg)
            }
        // }
    }
    
}