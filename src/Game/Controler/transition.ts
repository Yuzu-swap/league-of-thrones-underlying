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
  AttackBlockArgs,
  SetUnionIdArgs,
  StateTransitionArgs,
  SetSeasonEndArgs
} from '../Const';

import { City, CityConfig } from '../Logic/game';
import { IBlockState, ICityState, IGeneralState, IMapGlobalState } from '../State';
import { BaseStateManager, LoadStateFunc } from './statemanger';
import {
  StateEssential,
  createLogicEsential,
  LogicEssential,
  GlobalLogicEssential,
  GlobalStateEssential,
  createGlobalEsential
} from '../Logic/creator';
import { BattleRecordInfo } from '../Logic/general';
import mapGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/map_config.json')
import { getTimeStamp, parseStateId } from '../Utils';

const log = globalThis.log || function () {};


export enum TransitionEventType {
  Battles = "battles",
  TimeStamp = "timeStamp"
}

export type EventRecorderFunc = (typ: TransitionEventType,event: any) => void;

export interface BattleTransRecord{
  attackInfo: BattleRecordInfo
  defenseInfo: BattleRecordInfo
  blockInfo: {
    x_id: number
    y_id: number
  }
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
      case StateTransition.SetUnionId:
        re = this.onSetUnionId(arg as SetUnionIdArgs)
        break
      case StateTransition.SetUnionWin:
        re = this.onSetUnionWin(arg as SetUnionIdArgs)
        return re
      case StateTransition.SetSeasonEnd:
        re = this.onSetSeasonEnd(arg as SetSeasonEndArgs)
        return re
    }
    const logic: LogicEssential = this.genLogic(arg['from']);
    logic.general.updateDefenseInfo();
    return re
  }

  getBlockStates(x_id : number , y_id : number): IBlockState[]{
    let re = []
    const xOffset = [ 2, 1, -1, -2, -1, 1]
    const yOffset = [ 0, 1, 1, 0, -1, -1]
    let center = this.stateManger.get( {id : `${StateName.BlockInfo}:${x_id}^${y_id}`})
    if(!center){
      return re
    }
    re.push(center)
    for( let i = 0; i < 6; i++ ){
      let newX = x_id + xOffset[i]
      let newY = y_id + yOffset[i]
      let stateId = { id : `${StateName.BlockInfo}:${newX}^${newY}`}
      let newState =  this.stateManger.get(stateId) as IBlockState
      if(newState){
        re.push(newState)
      }
    }
    return re
  }

  genLogic(id: string, x_id: number = 0, y_id: number = 0): LogicEssential {
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
      blocks: this.getBlockStates(x_id, y_id)
    };
    return createLogicEsential(states);
  }

  genGlobalLogic(x_id: number = 0, y_id:number = 0): GlobalLogicEssential{
    const mapGlobalState = this.stateManger.get(
      {
        id: `${StateName.MapGlobalInfo}`
      }
    )
    const gStates : GlobalStateEssential = {
      mapGlobal: mapGlobalState as IMapGlobalState,
      blocks: this.getBlockStates(x_id, y_id)
    };
    return createGlobalEsential(gStates)
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
    const logic2: LogicEssential = this.genLogic(args.name.replace("defenderinfo:", ""))
    if(logic1.city.state.id == logic2.city.state.id){
      return{
        result: false,
        error: 'cant-battle-self'
      }
    }
    let defenseInfo = logic2.general.getDefenseInfo()
    let re = logic1.general.battle(args.generalId, defenseInfo)
    if(re.result == true){
      (re as any).silverGet = logic2.city.robSilver((re as any).silverGet as number)
      let btr: BattleTransRecord  = {
        attackInfo :{
          username: parseStateId(logic1.city.state.getId()).username,
          generalId: args.generalId,
          generalLevel: logic1.general.getGeneralLevel( args.generalId ),
          troopReduce: re['attackTroopReduce'],
          silverGet: re['silverGet'],
          gloryGet: re['attackGloryGet']
        },
        defenseInfo:{
          username: parseStateId(logic2.city.state.getId()).username,
          generalId: defenseInfo.generalId,
          generalLevel: defenseInfo.generalLevel,
          troopReduce: re['defenseTroopReduce'],
          silverGet: -re['silverGet'],
          gloryGet: re['defenseGloryGet']
        },
        blockInfo:{
          x_id: -1,
          y_id: -1
        },
        result: re['win']
      }
      logic1.general.addGlory(btr.attackInfo.gloryGet)
      logic2.general.addGlory(btr.defenseInfo.gloryGet)
      this.recordEvent(TransitionEventType.Battles, btr)
    }
    logic1.city.useSilver( - (re as any).silverGet as number)
    return re
  }

  onAttackBlock(args: AttackBlockArgs){
    const logic : LogicEssential = this.genLogic(args.from, args.x_id, args.y_id)
    if(!logic.map.checkBetween(1, args.x_id, args.y_id )){
      return{
        result: false,
        error: 'block-is-too-far'
      }
    }
    let re = logic.map.attackBlocksAround(args.x_id, args.y_id, args.generalId)
    if(re['result'] == undefined){
      for(let record of re as BattleTransRecord[]){
        logic.general.addGlory(record.attackInfo.gloryGet)
        if(record.defenseInfo.username != ''){
          let tempLogic: LogicEssential = this.genLogic(record.defenseInfo.username)
          if(tempLogic){
            tempLogic.general.addGlory(record.defenseInfo.gloryGet)
          }
        }
        this.recordEvent(TransitionEventType.Battles, record)
      }
      let temp = re as BattleTransRecord[]
      return{
        result: true,
        record: temp[temp.length - 1]
      }
    }
    else{
      return re
    }
  }

  onDefenseBlock(args: AttackBlockArgs){
    const logic : LogicEssential = this.genLogic(args.from, args.x_id, args.y_id)
    if(logic.general.state.unionId != logic.map.getBelongInfo(args.x_id, args.y_id)){
      return {
        result: false,
        error: 'unionId-error'
      }
    }
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
    const logic : LogicEssential = this.genLogic(args.from, args.x_id, args.y_id)
    const remainTroop = logic.map.cancelDefenseBlock(args.x_id, args.y_id, args.from)
    logic.general.cancelDefenseBlock(args.generalId, remainTroop)
    return {
      result: true
    }
  }

  onSetUnionId(args: SetUnionIdArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    logic.general.state.update(
      {
        'unionId' : args.unionId
      }
    )
    return {
      result: true,
      username: args.from,
      unionId: args.unionId
    }
  }

  onCheckSeasonFinish(args : StateTransitionArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    let time = getTimeStamp()
    const config = logic.map.seasonConfig.get(1)
    if(time > config.season_end){
      return {
        result: false,
        error: 'season-end'
      }
    }
  }

  onSetUnionWin(args : SetUnionIdArgs){
    const logic : LogicEssential = this.genLogic(args.from, 11, 11)
    let re = logic.map.setUnionWin(args.unionId)
    return re
  }

  onSetSeasonEnd(args: SetSeasonEndArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    logic.map.setSeasonEnd(args.end)
    return {
      result: true
    }
  }

  checkUnionWin(){
    const logic : GlobalLogicEssential = this.genGlobalLogic(11, 11)
    let re = logic.map.checkUnionWin()
    re['unionHaveSet'] = logic.map.gState.unionWinId != 0
    return re
  }

  getSeasonStatus(){
    const logic : GlobalLogicEssential = this.genGlobalLogic()
    let re = logic.map.getSeasonStatus()
    re['endHaveSet'] = logic.map.gState.seasonEnd
    return re
  }

  recordEvent(typ: TransitionEventType,event: any) {
    if (this.eventRecorderFunc){
      this.eventRecorderFunc(typ,event)
    }
  }
}
