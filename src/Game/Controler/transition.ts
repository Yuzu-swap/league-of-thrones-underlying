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
  BattleArgs,
  AttackBlockArgs
} from '../Const';

import { City, CityConfig } from '../Logic/game';
import { IBlockState, ICityState, IGeneralState, IMapGlobalState } from '../State';
import { BaseStateManager, LoadStateFunc } from './statemanger';
import {
  StateEssential,
  createLogicEsential,
  LogicEssential
} from '../Logic/creator';
import { BattleRecord, BattleRecordInfo } from '../Logic/general';
import mapGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/map_config.json')

const log = globalThis.log || function () {};


export enum TransitionEventType {
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
    let re = {}
    this.eventRecorderFunc = eventRecorderFunc
    switch (sid) {
      case StateTransition.UpgradeFacility:
        re = this.onUpdateFacility(arg as UpgradeFacilityArgs);
        break
      case StateTransition.Recruit:
        re = this.onRecruit(arg as RecruitArgs);
        break
      case StateTransition.AbleGeneral:
        re = this.onAbleGeneral(arg as AbleGeneralArgs);
        break
      case StateTransition.DisableGeneral:
        re = this.onDisableGeneral(arg as DisableGeneralArgs)
        break
      case StateTransition.UpgradeGeneral:
        re = this.onUpgradeGeneral(arg as UpgradeGeneralArgs)
        break
      case StateTransition.UpgradeGeneralSkill:
        re = this.onUpgradeGeneralSkill(arg as UpgradeGeneralSkillArgs)
        break
      case StateTransition.SetDefenseGeneral:
        re = this.onSetDefenseGeneral(arg as SetDefenseGeneralArgs)
        break
      case StateTransition.ReceiveTroop:
        re = this.onReceiveTroop(arg as ReceiveTroopArgs)
        break
      case StateTransition.Battle:
        re = this.onBattle(arg as BattleArgs)
        break
      case StateTransition.AttackBlock:
        re = this.onAttackBlock(arg as AttackBlockArgs)
        break
      case StateTransition.DefenseBlock:
        re = this.onDefenseBlock(arg as AttackBlockArgs)
        break
      case StateTransition.CancelDefenseBlock:
        re = this.onCancelDefenseBlock(arg as AttackBlockArgs)
        break
    }
    const logic: LogicEssential = this.genLogic(arg['from']);
    logic.general.updateDefenseInfo();
    return re
  }

  getBlockStates(): {[key: string]: IBlockState}{
    let re = {}
    for( let id in mapGDS ){
      let stateId = { id : `${StateName.BlockInfo}:${id}`}
      re[id] = this.stateManger.get(stateId) as IBlockState
    }
    return re
  }

  genLogic(id: string): LogicEssential {
    const stateId = { id: `${StateName.City}:${id}` };
    const cityState = this.stateManger.get(stateId);
    const generalState = this.stateManger.get({
      id: `${StateName.General}:${id}`
    });
    const mapGlobalState = this.stateManger.get(
      {
        id: `${StateName.MapGlobalInfo}`
      }
    )
    const states: StateEssential = {
      city: cityState as ICityState,
      general: generalState as IGeneralState,
      mapGlobal: mapGlobalState as IMapGlobalState,
      blocks: this.getBlockStates()
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
          generalLevel: logic1.general.getGeneralLevel( args.generalId ),
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

  onAttackBlock(args: AttackBlockArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    if(!logic.map.checkBetween(1, args.x_id, args.y_id )){
      return{
        result: false,
        error: 'block-is-too-far'
      }
    }
    let re = logic.map.attackBlock(args.x_id, args.y_id, args.generalId, -1)
    if(re['result'] == undefined){
      for(let record of re as []){
        this.recordEvent(TransitionEventType.Battles, record)
      }
      let temp = re as BattleRecord[]
      return{
        result: true,
        record: temp[temp.length - 1]
      }
    }
  }

  onDefenseBlock(args: AttackBlockArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    let re = logic.general.defenseBlock( args.generalId ,args.x_id, args.y_id)
    if(re['result'] == false){
      return re
    }
    let info = logic.general.getDefenseBlockInfo(args.generalId)
    let re1 = logic.map.defenseBlock(args.x_id, args.y_id, info)
    return {
      result: true
    }
  }

  onCancelDefenseBlock(args: AttackBlockArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    const remainTroop = logic.map.cancelDefenseBlock(args.x_id, args.y_id, args.from)
    logic.general.cancelDefenseBlock(args.generalId, remainTroop)
    return {
      result: true
    }
  }

  recordEvent(typ: TransitionEventType,event: any) {
    if (this.eventRecorderFunc){
      this.eventRecorderFunc(typ,event)
    }
  }

}
