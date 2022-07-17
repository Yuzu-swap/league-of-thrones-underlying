import { StateName, StateTransition, TestWallet } from '../Const';
import { BaseMediator } from '../../Core/mediator';
import {
  IStateIdentity,
  IState,
  IStateChangeWatcher,
  State
} from '../../Core/state';
import { TransitionHandler, TransitionId } from './transition';
import { ICityState, GetInitState, IGeneralState } from '../State';
import { GenerateMemoryLoadStateFunction } from './statemanger';

const cityStateId = `${StateName.City}:${TestWallet}`;
const generalStateId = `${StateName.General}:${TestWallet}`;

function getInitState(wather: IStateChangeWatcher): {
  [key: string]: IState;
} {
  const InitState = GetInitState()
  return {
    [cityStateId]: new State<ICityState>(
      {
        id: cityStateId,
        ...InitState[StateName.City]
      },
      wather
    ).unsderlying(),
    [generalStateId]: new State<IGeneralState>(
      {
        id: generalStateId,
        ...InitState[StateName.General]
      },
      wather
    ).unsderlying()
  };
}

export class LocalMediator
  extends BaseMediator<StateTransition>
  implements IStateChangeWatcher
{
  transitionHandler: TransitionHandler;
  constructor() {
    super();
    this.transitionHandler = new TransitionHandler(
      this,
      GenerateMemoryLoadStateFunction(getInitState(this))
    );
  }
  onStateChange(modify: {}, state: IState): void {
    state && this.notifyState({ id: state.getId() }, state);
  }

  queryState(sid: IStateIdentity): void {
    const state = this.transitionHandler.stateManger.get(sid);
    state && this.notifyState(sid, state);
  }

  sendTransaction(tid: StateTransition, args: {}): TransitionId {
    return this.transitionHandler.onTransition(tid, args);
  }
}
