import { IStateIdentity, IState } from "./state"

type StateCallback = (state: IState) => void

export interface IStateMediator<TransactionIDType> {
	queryState(sid: IStateIdentity): void
	onReceiveState(sid: IStateIdentity, callback: StateCallback): void
	sendTransaction(tid: TransactionIDType, args: {}): void
}


export class BaseMediator<TransactionIDType> implements IStateMediator<TransactionIDType>{
	listeners: { [key: string]: StateCallback[] }
	constructor() {
		this.listeners = {}
	}

	onReceiveState(sid: IStateIdentity, callback: StateCallback): void {
		if (!this.listeners[sid.id]) {
			this.listeners[sid.id] = []
		}
		this.listeners[sid.id].push(callback)
	}
	queryState(sid: IStateIdentity): void {
		throw "not emplement"
	}

	sendTransaction(tid: TransactionIDType, args: {}): void {
		throw "not emplement"
	}

	notifyState(sid: IStateIdentity, state: IState): void {
		const listeners: StateCallback[] = this.listeners[sid.id]
		for (var index in listeners) {
			listeners[index](state)
		}
	}
}
