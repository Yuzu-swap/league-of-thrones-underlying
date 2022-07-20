import { IStateIdentity, IState } from "./state"


export interface IContextState<ContextType> extends IState{
	context: ContextType
}

export type StateCallback<ContextType> = (state: IContextState<ContextType>) => void

export interface IStateMediator<TransactionIDType,ContextType> {
	queryState(sid: IStateIdentity,args: {},callback:(state:IState)=>void ): void
	sendTransaction(tid: TransactionIDType, args: {}, callback:(res:any)=>void): ContextType
	onReceiveState(sid: IStateIdentity, callback: StateCallback<ContextType>): void
}


export class BaseMediator<TransactionIDType,ContextType> implements IStateMediator<TransactionIDType,ContextType>{
	listeners: { [key: string]: StateCallback<ContextType>[] }
	constructor() {
		this.listeners = {}
	}

	onReceiveState(sid: IStateIdentity, callback: StateCallback<ContextType>): void {
		if (!this.listeners[sid.id]) {
			this.listeners[sid.id] = []
		}
		this.listeners[sid.id].push(callback)
	}
	queryState(sid: IStateIdentity,args: {},callback:(state:IState)=>void): void{
		throw "not emplement"
	}

	sendTransaction(tid: TransactionIDType, args: {},callback:(res:any)=>void): ContextType {
		throw "not emplement"
	}

	protected notifyState(sid: IStateIdentity, state: IContextState<ContextType>): void {
		const listeners: StateCallback<ContextType>[] = this.listeners[sid.id]
		for (var index in listeners) {
			listeners[index](state)
		}
	}
}
