const log = globalThis.log || function(){}

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

export function copyObj(aObject) {
  // Prevent undefined objects
  // if (!aObject) return aObject;

  let bObject = Array.isArray(aObject) ? [] : {};

  let value;
  for (const key in aObject) {

    // Prevent self-references to parent object
    // if (Object.is(aObject[key], aObject)) continue;
    
    value = aObject[key];

    bObject[key] = (typeof value === "object") ? copyObj(value) : value;
  }

  return bObject;
}

function setObjectByPath(obj: {}, path: string, val: any) {
  const segIndex = path.indexOf('.');
  if (segIndex == -1) {
    if (typeof(val) == "object"){
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

    log("onStateChange ", obj)

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
