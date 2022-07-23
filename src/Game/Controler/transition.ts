import {
  IStateIdentity,
  IState,
  IStateManager,
  IStateChangeWatcher,
  State
} from '../../Core/state';


import {
  CityFacility,
  StateTransition,
  UpgradeFacilityArgs,
  StateName,
  TestWallet
} from '../Const';

import { City, CityConfig, FacilityLimit } from '../Logic/game';
import { ICityState, IGeneralState } from '../State';
import { BaseStateManager, LoadStateFunc } from './statemanger';
import { StateEssential, createLogicEsential, LogicEssential } from '../Logic/creator';

const log = globalThis.log || function(){}



export class TransitionHandler {
  stateManger: IStateManager;
  dataConfigs: CityConfig;

  constructor(
    stateWatcher: IStateChangeWatcher,
    loadLoadStateFunc?: LoadStateFunc
  ) {
    //init state
    const cityStateId = `${StateName.City}:${TestWallet}`;
    this.stateManger = new BaseStateManager({}, loadLoadStateFunc);
  }

  onTransition(sid: StateTransition, arg: {}) : {}{
    switch (sid) {
      case StateTransition.UpgradeFacility:
        return this.onUpdateFacility(arg as UpgradeFacilityArgs);
    }
  }

  genLogic( id: string) : LogicEssential{
    const stateId = { id: `${StateName.City}:${id}` };
    const cityState = this.stateManger.get(stateId);
    const generalState = this.stateManger.get({id : `${StateName.General}:${id}`})
    const states : StateEssential  = {
      city : cityState as ICityState ,
      general: generalState as IGeneralState
    }
    return createLogicEsential(states)
  }

  onUpdateFacility(args: UpgradeFacilityArgs) : {}{
    
    const logic : LogicEssential = this.genLogic(args.from)
    const city = logic.city;
    log("onUpdateFacility args ",args, " cityState ",city.state)

    //Do Logic  here
    //Valdiate resource requirement first
    return city.upgradeFacility(args.typ, args.index)
  }
}
