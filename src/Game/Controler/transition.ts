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
  RecruitArgs,
  AbleGeneralArgs,
  DisableGeneralArgs,
  UpgradeGeneralArgs,
  UpgradeGeneralSkillArgs,
  SetDefenseGeneralArgs,
  ResouceType,
  ReceiveTroopArgs,
  BattleArgs
} from '../Const';

import { City, CityConfig } from '../Logic/game';
import { ICityState, IGeneralState } from '../State';
import { BaseStateManager, LoadStateFunc } from './statemanger';
import {
  StateEssential,
  createLogicEsential,
  LogicEssential
} from '../Logic/creator';
import { BattleRecordInfo } from '../Logic/general';

const log = globalThis.log || function () {};


enum TransitionEventType {
  Battles = "battles",
}

export type EventRecorderFunc = (typ: TransitionEventType,event: any) => void;

export interface BattleTransRecord{
  attackInfo: BattleRecordInfo
  defenseInfo: BattleRecordInfo
  result: boolean
}



export class TransitionHandler {
  stateManger: IStateManager;
  dataConfigs: CityConfig;
  eventRecorderFunc: EventRecorderFunc

  constructor(
    stateWatcher: IStateChangeWatcher,
    loadLoadStateFunc?: LoadStateFunc,
  ) {
    //init state
    this.stateManger = new BaseStateManager({}, loadLoadStateFunc);
  }

  onTransition(sid: StateTransition, arg: {},eventRecorderFunc?:EventRecorderFunc): {} {
    this.eventRecorderFunc = eventRecorderFunc
    switch (sid) {
      case StateTransition.UpgradeFacility:
        return this.onUpdateFacility(arg as UpgradeFacilityArgs);
      case StateTransition.Recruit:
        return this.onRecruit(arg as RecruitArgs);
      case StateTransition.AbleGeneral:
        return this.onAbleGeneral(arg as AbleGeneralArgs);
      case StateTransition.DisableGeneral:
        return this.onDisableGeneral(arg as DisableGeneralArgs)
      case StateTransition.UpgradeGeneral:
        return this.onUpgradeGeneral(arg as UpgradeGeneralArgs)
      case StateTransition.UpgradeGeneralSkill:
        return this.onUpgradeGeneralSkill(arg as UpgradeGeneralSkillArgs)
      case StateTransition.SetDefenseGeneral:
        return this.onSetDefenseGeneral(arg as SetDefenseGeneralArgs)
      case StateTransition.ReceiveTroop:
        return this.onReceiveTroop(arg as ReceiveTroopArgs)
      case StateTransition.Battle:
        return this.onBattle(arg as BattleArgs)
    }
  }

  genLogic(id: string): LogicEssential {
    const stateId = { id: `${StateName.City}:${id}` };
    const cityState = this.stateManger.get(stateId);
    const generalState = this.stateManger.get({
      id: `${StateName.General}:${id}`
    });
    const states: StateEssential = {
      city: cityState as ICityState,
      general: generalState as IGeneralState
    };
    return createLogicEsential(states);
  }

  onUpdateFacility(args: UpgradeFacilityArgs): {} {
    const logic: LogicEssential = this.genLogic(args.from);
    const city = logic.city;
    log('onUpdateFacility args ', args, ' cityState ', city.state);

    //Do Logic  here
    //Valdiate resource requirement first
    return city.upgradeFacility(args.typ, args.index);
  }

  onRecruit(args: RecruitArgs): {} {
    const logic: LogicEssential = this.genLogic(args.from);
    const city = logic.city;

    return city.recruit(args.amount);
  }

  onAbleGeneral(args: AbleGeneralArgs): {} {
    const logic: LogicEssential = this.genLogic(args.from);
    const general = logic.general;
    return general.ableGeneral(args.id)
  }

  onDisableGeneral(args: DisableGeneralArgs): {}{
    const logic: LogicEssential = this.genLogic(args.from);
    const general = logic.general;
    return general.disableGeneral(args.id)
  }

  onUpgradeGeneral(args: UpgradeGeneralArgs):{}{
    const logic: LogicEssential = this.genLogic(args.from);
    const general = logic.general;
    return general.upgradeGeneral(args.id)
  }

  onUpgradeGeneralSkill(args: UpgradeGeneralSkillArgs):{}{
    const logic: LogicEssential = this.genLogic(args.from);
    const general = logic.general;
    return general.upgradeGeneralSkill(args.generalId, args.skillIndex)
  }

  onSetDefenseGeneral(args: SetDefenseGeneralArgs):{}{
    const logic: LogicEssential = this.genLogic(args.from);
    const general = logic.general;
    return general.setDefenseGeneral(args.generalId)
  }

  onReceiveTroop(args: ReceiveTroopArgs):{}{
    const logic: LogicEssential = this.genLogic(args.from);
    const city = logic.city;
    city.updateResource(ResouceType.Troop)
    return {result: true}
  }

  onBattle(args: BattleArgs):{}{
    const logic1: LogicEssential = this.genLogic(args.from)
    const logic2: LogicEssential = this.genLogic(args.name)
    let defenseInfo = logic2.general.getDefenseInfo()
    let re = logic1.general.battle(args.generalId, defenseInfo)
    if(re.result == true){
      
      (re as any).silverGet = logic2.city.robSilver((re as any).silverGet as number)
      let btr: BattleTransRecord  = {
        attackInfo :{
          username: logic1.city.state.getId(),
          generalId: args.generalId,
          generalLevel: 1,
          troopReduce: re['attackTroopReduce'],
          silverGet: re['silverGet']
        },
        defenseInfo:{
          username: logic2.city.state.getId(),
          generalId: defenseInfo.generalId,
          generalLevel: defenseInfo.generalLevel,
          troopReduce: re['defenseTroopReduce'],
          silverGet: -re['silverGet']
        },
        result: re['win']
      }
      this.recordEvent(TransitionEventType.Battles, btr)
    }
    logic1.city.useSilver( - (re as any).silverGet as number)
    return re
  }

  recordEvent(typ: TransitionEventType,event: any) {
    if (this.eventRecorderFunc){
      this.eventRecorderFunc(typ,event)
    }
  }

}
