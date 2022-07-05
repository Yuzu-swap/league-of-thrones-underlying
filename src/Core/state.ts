export interface IState {
	getId(): string
	update(obj: {}): void
}


export interface IStateChangeWatcher {
	onStateChange(modify: {}, state: IState): void
}

export interface IStateIdentity {
	id: string
}



function setObjectByPath(obj: {}, path: string, val: any) {
	const segIndex = path.indexOf(".")
	if (segIndex == -1) {
		obj[path] = val
	} else {
		const key = path.substr(0, segIndex)
		if (!obj[key]) {
			obj[key] = {}
		}
		setObjectByPath(obj[key], path.substr(segIndex + 1), val)
	}
}
export class State<UnderlyingStateType extends IStateIdentity> implements IStateIdentity {
	_watcher: IStateChangeWatcher
	id: string
	constructor(initVal: Omit<UnderlyingStateType, 'update' | 'getId'>, watcher?: IStateChangeWatcher) {
		for (var key in initVal) {
			this[key] = initVal[key]
		}
		this._watcher = watcher
	}


	update(obj: {}) {
		//protect id
		delete obj['id']
		for (var key in obj) {
			setObjectByPath(this, key, obj[key])
		}
		if (this._watcher) {
			this._watcher.onStateChange(obj, this)
		}
	}
	getId(): string {
		return this.id
	}

	unsderlying(): UnderlyingStateType {
		return this as any as UnderlyingStateType
	}
}


export interface IStateManager {
	load(sid: IStateIdentity): IState
	save(sid: IStateIdentity, state: IState): void
}
