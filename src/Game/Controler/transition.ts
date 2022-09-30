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
  SetSeasonEndArgs,
  StartSeasonArgs,
  SetSeasonRewardConfigArgs,
  SetIconIdArgs,
  RechargeArgs
} from '../Const';

import { City, CityConfig } from '../Logic/game';
import { IBlockState, ICityState, IGeneralState, IMapGlobalState, IRewardGlobalState, ISeasonConfigState } from '../State';
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
import { addToSortList, getTimeStamp, parseStateId } from '../Utils';
import { innerCancelBlockDefense } from '../Logic/map';

const log = globalThis.log || function () {};


export enum TransitionEventType {
  Battles = "battles",
  TimeStamp = "timeStamp"
}

export type EventRecorderFunc = (typ: TransitionEventType,event: any) => void;

export enum BattleRecordType{
  Block = "block",
  City = "city"
}

export interface BattleTransRecord{
  attackInfo: BattleRecordInfo
  defenseInfo: BattleRecordInfo
  recordType: BattleRecordType,
  blockInfo: {
    x_id: number
    y_id: number
  }
  timestamp: number
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
      case StateTransition.SetIconId:
        re = this.onSetIconId(arg as SetIconIdArgs)
        break
      case StateTransition.SetUnionWin:
        re = this.onSetUnionWin(arg as SetUnionIdArgs)
        return re
      case StateTransition.SetSeasonEnd:
        re = this.onSetSeasonEnd(arg as SetSeasonEndArgs)
        return re
      case StateTransition.StartSeason:
        re = this.onStartSeason(arg as StartSeasonArgs)
        return re
      case StateTransition.Recharge:
        re = this.onRecharge(arg as RechargeArgs)
        return re
    }
    const logic: LogicEssential = this.genLogic(arg['from']);
    logic.general.updateDefenseInfo();
    return re
  }

  getBlockStates(x_id : number , y_id : number): IBlockState[]{
    let re = []
    const xOffset = [ 0, 1, 1, 0, -1, -1]
    const yOffset = [ 2, 1, -1, -2, -1, 1]
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
    const seasonState = this.stateManger.get(
      {
        id: `${StateName.SeasonConfig}`
      }
    )
    const rewardGlobalState = this.stateManger.get(
      {
        id: `${StateName.RewardGloablState}`
      }
    )
    const states: StateEssential = {
      city: cityState as ICityState,
      general: generalState as IGeneralState,
      mapGlobal: mapGlobalState as IMapGlobalState,
      seasonState: seasonState as ISeasonConfigState,
      rewardGlobalState: rewardGlobalState as IRewardGlobalState,
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
    const seasonState = this.stateManger.get(
      {
        id: `${StateName.SeasonConfig}`
      }
    )
    const rewardGlobalState = this.stateManger.get(
      {
        id: `${StateName.RewardGloablState}`
      }
    )
    const gStates : GlobalStateEssential = {
      mapGlobal: mapGlobalState as IMapGlobalState,
      seasonState : seasonState as ISeasonConfigState,
      rewardGlobalState: rewardGlobalState as IRewardGlobalState,
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
    let re = city.upgradeFacility(args.typ, args.index);
    if(re.result && args.typ == CityFacility.Fortress && city.state.facilities[CityFacility.Fortress][0] == 7){
      this.updateRewardState(
        logic.map.rewardGlobalState, 
        parseStateId(logic.city.state.getId()).username, 
        0,
        logic.general.state.glory,
        logic.general.state.unionId
      )
    }
    return re
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
          generalType: logic1.general.getGeneralQualification( args.generalId ).general_type,
          troopReduce: re['attackTroopReduce'],
          silverGet: re['silverGet'],
          gloryGet: re['attackGloryGet']
        },
        defenseInfo:{
          username: parseStateId(logic2.city.state.getId()).username,
          generalId: defenseInfo.generalId,
          generalLevel: defenseInfo.generalLevel,
          generalType: defenseInfo.generalType,
          troopReduce: re['defenseTroopReduce'],
          silverGet: -re['silverGet'],
          gloryGet: re['defenseGloryGet']
        },
        recordType: BattleRecordType.City,
        blockInfo:{
          x_id: 0,
          y_id: 0
        },
        timestamp: getTimeStamp(),
        result: re['win']
      }
      let oldGlory1 = logic1.general.state.glory
      let oldGlory2 = logic2.general.state.glory
      logic1.general.addGlory(btr.attackInfo.gloryGet)
      logic2.general.addGlory(btr.defenseInfo.gloryGet)
      if(logic1.city.state.facilities[CityFacility.Fortress][0] >= 7){
        this.updateRewardState(
          logic1.map.rewardGlobalState, 
          parseStateId(logic1.city.state.getId()).username, 
          oldGlory1,
          logic1.general.state.glory,
          logic1.general.state.unionId
        )
      }
      if(logic2.city.state.facilities[CityFacility.Fortress][0] >= 7){
        this.updateRewardState(
          logic2.map.rewardGlobalState, 
          parseStateId(logic2.city.state.getId()).username, 
          oldGlory2,
          logic2.general.state.glory,
          logic2.general.state.unionId
        )
      }
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
    const blockGds = logic.map.mapConfig.get(args.x_id, args.y_id)
    if(blockGds.type == 3){
      return {
        result: false,
        error: 'cant-attack-init-block'
      }
    }
    let re = logic.map.attackBlocksAround(args.x_id, args.y_id, args.generalId)
    if(re['result'] == undefined){
      for(let cancelDefense of re['cancelList'] as innerCancelBlockDefense[]){
        if(cancelDefense.username != ''){
          let tempLogic: LogicEssential = this.genLogic(cancelDefense.username)
          tempLogic.general.cancelDefenseBlock(cancelDefense.generalId, 0)
        }
      }
      let oldGlory = logic.general.state.glory
      for(let record of re['records'] as BattleTransRecord[]){
        logic.general.addGlory(record.attackInfo.gloryGet)
        if(record.defenseInfo.username != ''){
          let tempLogic: LogicEssential = this.genLogic(record.defenseInfo.username)
          if(tempLogic){
            let oldTempGlory = tempLogic.general.state.glory
            tempLogic.general.addGlory(record.defenseInfo.gloryGet)
            if(tempLogic.city.state.facilities[CityFacility.Fortress][0] >= 7){
              this.updateRewardState(
                tempLogic.map.rewardGlobalState, 
                parseStateId(tempLogic.city.state.getId()).username, 
                oldTempGlory,
                tempLogic.general.state.glory,
                tempLogic.general.state.unionId
              )
            }
          }
        }
        this.recordEvent(TransitionEventType.Battles, record)
      }
      let temp = re['records'] as BattleTransRecord[]
      let transRe = {}
      if(temp.length != 0){
        transRe = {
          result: true,
          record: temp[temp.length - 1],
          durabilityReduce: re['durabilityReduce']
        }
      }
      else{
        logic.general.addGlory(re['durabilityReduce'] + logic.general.config.parameter.battle_victory_get_glory)
        transRe = {
          result: true,
          durabilityReduce: re['durabilityReduce']
        }
      }
      if(logic.city.state.facilities[CityFacility.Fortress][0] >= 7){
        this.updateRewardState(
          logic.map.rewardGlobalState, 
          parseStateId(logic.city.state.getId()).username, 
          oldGlory,
          logic.general.state.glory,
          logic.general.state.unionId
        )
      }
      return transRe
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
    const remainTroop = logic.map.cancelDefenseBlock(args.x_id, args.y_id, args.from, args.generalId)
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
    const logic : LogicEssential = this.genLogic(args.from, 0, 0)
    let re = logic.map.setUnionWin(args.unionId)
    return re
  }

  onSetSeasonEnd(args: SetSeasonEndArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    logic.map.setSeasonEnd()
    return {
      result: true
    }
  }

  checkUnionWin(){
    const logic : GlobalLogicEssential = this.genGlobalLogic( 0, 0)
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

  onStartSeason(args: StartSeasonArgs){
    const gLogic: GlobalLogicEssential = this.genGlobalLogic()
    if(gLogic.map.seasonState.haveSet){
      return {
        result: true,
        error: 'seasonHaveSet'
      }
    }
    for(let unionIdString in args.applies){
      const unionId = parseInt(unionIdString)
      if(unionId < 1 || unionId >4){
        continue
      }
      let userInfos = args.applies[unionIdString]
      for(let username in userInfos){
        const logic : LogicEssential = this.genLogic(username)
        logic.general.state.update(
          {
            'unionId' : unionId
          }
        )
        logic.general.addextraGeneral(userInfos[username])
      }
    }
    gLogic.map.seasonState.update(
      {
        'season_reservation': args.season.apply_ts,
        'season_ready' : args.season.prepare_ts,
        'season_open' : args.season.start_ts,
        'season_end' : args.season.end_ts,
        'unionRewardValue': args.season.reward_amount_1,
        'rankRewardValue': args.season.reward_amount_2,
        'rankConfigFromTo': args.season.rank_config_fromto,
        'rankConfigValue' : args.season.rank_config_value,
      }
    )
    return {
      result: true
    }
  }


  recordEvent(typ: TransitionEventType,event: any) {
    if (this.eventRecorderFunc){
      this.eventRecorderFunc(typ,event)
    }
  }

  updateRewardState(rewardState: IRewardGlobalState, username: string, oldGlory: number, newGlory: number, unionId: number){
    let unionLists =  rewardState.unionGloryRankInfo
    let globalList =  rewardState.globalGloryRankInfo
    addToSortList(unionLists[unionId - 1], username, oldGlory, newGlory, unionId)
    addToSortList(globalList, username, oldGlory, newGlory, unionId)
    rewardState.update(
      {
        unionGloryRankInfo : unionLists,
        globalGloryRankInfo: globalList
      }
    )
  }

  onSetIconId(args: SetIconIdArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    return logic.general.setIconId(args.iconId)
  }

  onRecharge(args: RechargeArgs){
    const logic : LogicEssential = this.genLogic(args.username)
    return logic.city.recharge(args.amount)
  }
}
