export interface IState {
  getId(): string;
  update(obj: {}): void;
  stateObj(): {};
}

export interface IStateChangeWatcher {
  onStateChange(modify: {}, state: IState): void;
}

export interface IStateIdentity {
  id: string;
}

export function copyObj(src){
  let dest
  if(Object.assign) {
    dest = Object.assign({},src)
  }else{
    dest = JSON.parse(JSON.stringify(src))
  }
  return dest
}

function setObjectByPath(obj: {}, path: string, val: any) {
  const segIndex = path.indexOf('.');
  if (segIndex == -1) {
    if (typeof(obj) == "object"){
      obj[path] = copyObj(val)
    }else{
      obj[path] = val
    }
  } else {
    const key = path.substr(0, segIndex);
    if (!obj[key]) {
      obj[key] = {};
    }
    setObjectByPath(obj[key], path.substr(segIndex + 1), val);
  }
}
export class State<UnderlyingStateType extends IStateIdentity>
  implements IStateIdentity
{
  _watcher: IStateChangeWatcher;
  id: string;

  static protectedFields = [
    '_watcher',
    'update',
    'getId',
    'unsderlying',
    'stateObj'
  ];

  constructor(
    initVal: Omit<UnderlyingStateType, 'update' | 'getId' | 'stateObj'>,
    watcher?: IStateChangeWatcher
  ) {
    // deep clone ins ES%
    let copyVal = copyObj(initVal)
    for (var key in copyVal) {
      this[key] = copyVal[key];
    }
    this._watcher = watcher;
  }

  update(obj: {}) {
    //protect id
    delete obj['id'];
    delete obj['_watcher'];
    delete obj['update'];
    delete obj['getId'];
    delete obj['unsderlying'];

    for (var key in obj) {
      if (State.protectedFields.indexOf(key) == -1) {
        setObjectByPath(this, key, obj[key]);
      }
    }

    if (this._watcher) {
      this._watcher.onStateChange(obj, this);
    }
  }
  getId(): string {
    return this.id;
  }

  unsderlying(): UnderlyingStateType {
    return this as any as UnderlyingStateType;
  }

  stateObj(): {} {
    let res = {};
    for (var key in this) {
      if (State.protectedFields.indexOf(key) == -1) {
        setObjectByPath(res, key, this[key]);
      }
    }
    return res;
  }
}

export interface IStateManager {
  get(sid: IStateIdentity): IState;
  save(sid: IStateIdentity, state: IState): void;
}
