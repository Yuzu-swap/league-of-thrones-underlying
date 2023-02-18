import {
  IStateIdentity,
  IState,
  IStateManager,
  IStateChangeWatcher,
  State,
  copyObj
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
  SetIconIdArgs,
  RechargeArgs,
  RecoverMoraleArgs,
  BuyStrategyPointArgs,
  InitUserStatesArgs,
  DonateSilverArgs,
  GuideStepArgs
} from '../Const';

import { City, CityConfig } from '../Logic/game';
import { GeneralDefenseBlock, GetInitState, GloryInfo, IActivityState, IBlockState, ICityState, IGeneralState, IMapGlobalState, IRewardGlobalState, ISeasonConfigState, IStrategyState } from '../State';
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
import { StrategyType } from '../Logic/strategy';
import { stringify } from 'querystring';

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
    console.log("underlying_transition: sid: ", sid, " args:", arg)
    let re = {}
    this.eventRecorderFunc = eventRecorderFunc
    try{
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
        case StateTransition.AddTestResource:
          re = this.onAddTestResource(arg as StateTransitionArgs)
          break
        case StateTransition.RecoverMorale:
          re = this.onRecoverMorale(arg as RecoverMoraleArgs)
          break
        case StateTransition.BuyStrategyPoint:
          re = this.onBuyStrategyPoint(arg as BuyStrategyPointArgs)
          break
        case StateTransition.StrategyBuySilver:
          re = this.onStrategyBuySilver(arg as StateTransitionArgs)
          break
        case StateTransition.StrategyBuyTroop:
          re = this.onStrategyBuyTroop(arg as StateTransitionArgs)
          break
        case StateTransition.StrategyBuyMorale:
          re = this.onStrategyBuyMorale(arg as StateTransitionArgs)
          break
        case StateTransition.StrategyBuyProtect:
          re = this.onStrategyBuyProtect(arg as StateTransitionArgs)
          break
        case StateTransition.StrategyBuyStore:
          re = this.onStrategyBuyStore(arg as StateTransitionArgs)
          break
        case StateTransition.MiningBlock:
          re = this.onMiningBlock(arg as AttackBlockArgs)
          break
        case StateTransition.SetGuideStep:
          re = this.onSetGuideStep(arg as GuideStepArgs)
          break
        case StateTransition.InitUserStates:
          re = this.onInitUserStates(arg as InitUserStatesArgs)
          return re
        case StateTransition.DonateSilver:
          re = this.onDonateSilver(arg as DonateSilverArgs)
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
        case StateTransition.InitGlobalStates:
          re = this.onInitGlobalStates(arg as StateTransitionArgs)
          return re
        case StateTransition.RegularTask:
          re = this.onRegularTask()
          return re
        
      }
      const logic: LogicEssential = this.genLogic(arg['from']);
      console.log("transition before update",logic.city.state)
      logic.general.updateDefenseInfo();
      logic.activity.updateAbleActivities();
      console.log("transition after update",logic.city.state)
      console.log("underlying_transition result: sid:", sid, " result:", re)
      return re
    }catch(err){
      console.log("underlying_transition failed,  sid:", sid, " args:", arg," err ",err)
      throw err
    }
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

  genLogic(id: string, x_id: number = 0, y_id: number = 0,  gStatesIn: GlobalStateEssential = null ): LogicEssential {
    const stateId = { id: `${StateName.City}:${id}` };
    const cityState = this.stateManger.get(stateId);
    const generalState = this.stateManger.get({
      id: `${StateName.General}:${id}`
    });
    const strategyState = this.stateManger.get(
      {
        id: `${StateName.Strategy}:${id}`
      }
    )
    let gStates : GlobalStateEssential
    if(gStatesIn == null){
      gStates = this.genGlobalStateEssential(x_id, y_id)
    }
    else{
      gStates = gStatesIn
    }

    const states: StateEssential = {
      city: cityState as ICityState,
      general: generalState as IGeneralState,
      mapGlobal: gStates.mapGlobal,
      seasonState: gStates.seasonState,
      rewardGlobalState: gStates.rewardGlobalState,
      blocks: gStates.blocks,
      strategy: strategyState as IStrategyState,
      activityState: gStates.activityState
    };
    return createLogicEsential(states);
  }

  genGlobalStateEssential(x_id: number, y_id:number): GlobalStateEssential{
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
    const activities = this.stateManger.get(
      {
        id: `${StateName.Activity}`
      }
    ) 
    const gStates : GlobalStateEssential = {
      mapGlobal: mapGlobalState as IMapGlobalState,
      seasonState : seasonState as ISeasonConfigState,
      rewardGlobalState: rewardGlobalState as IRewardGlobalState,
      blocks: this.getBlockStates(x_id, y_id),
      activityState: activities as IActivityState
    };
    return gStates
  }

  genGlobalLogic(x_id: number = 0, y_id:number = 0): GlobalLogicEssential{
    
    const gStates : GlobalStateEssential = this.genGlobalStateEssential(x_id, y_id)
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
    const gStates: GlobalStateEssential = this.genGlobalStateEssential(0, 0)
    const logic1: LogicEssential = this.genLogic(args.from, 0, 0, gStates)
    if( logic1.strategy.getStrategyStatus(StrategyType.Protect).able){
      logic1.strategy.setStrategyStatus(StrategyType.Protect, false)
    }
    const logic2: LogicEssential = this.genLogic(args.name.replace("defenderinfo:", ""), 0, 0, gStates)
    if( logic2.strategy.getStrategyStatus(StrategyType.Protect).able){
      return {
        result: false,
        error: 'cant-battle-player-be-protected'
      }
    }
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
      let moraleAdd = re['win'] ? 2 : -2
      logic1.general.offsetMorale(moraleAdd)
      logic2.general.offsetMorale(-moraleAdd)
      let oldGlory1 = logic1.general.state.glory
      let oldGlory2 = logic2.general.state.glory
      logic1.general.addGlory(btr.attackInfo.gloryGet)
      logic2.general.addGlory(btr.defenseInfo.gloryGet)
      logic2.city.useTroop(btr.defenseInfo.troopReduce)
      logic2.general.updateDefenseInfo()
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
    const gStates: GlobalStateEssential = this.genGlobalStateEssential(args.x_id, args.y_id)
    const logic : LogicEssential = this.genLogic(args.from, args.x_id, args.y_id, gStates)
    if( logic.strategy.getStrategyStatus(StrategyType.Protect).able){
      logic.strategy.setStrategyStatus(StrategyType.Protect, false)
    }
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
          let tempLogic: LogicEssential = this.genLogic(cancelDefense.username, args.x_id, args.y_id, gStates)
          tempLogic.general.cancelDefenseBlock(cancelDefense.generalId, 0)
        }
      }
      let oldGlory = logic.general.state.glory
      for(let record of re['records'] as BattleTransRecord[]){
        let moraleAdd = record.result ? 2 : -2
        logic.general.offsetMorale(moraleAdd)
        logic.general.addGlory(record.attackInfo.gloryGet)
        if(record.defenseInfo.username != ''){
          let tempLogic: LogicEssential = this.genLogic(record.defenseInfo.username, args.x_id, args.y_id, gStates)
          if(tempLogic){
            let oldTempGlory = tempLogic.general.state.glory
            tempLogic.general.addGlory(record.defenseInfo.gloryGet)
            tempLogic.general.offsetMorale(-moraleAdd)
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
    if( logic.strategy.getStrategyStatus(StrategyType.Protect).able){
      logic.strategy.setStrategyStatus(StrategyType.Protect, false)
    }
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
    for(let item in args.season){
      if(args.season[item] == undefined){
        throw "start season args error"
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
    let unionList = copyObj(unionLists[unionId - 1]) as GloryInfo[]
    addToSortList(unionList, username, oldGlory, newGlory, unionId)
    addToSortList(globalList, username, oldGlory, newGlory, unionId)
    unionLists[unionId - 1] = unionList
    console.log("after reward update: union:" + JSON.stringify(unionList) + "global" + globalList +  "unionId:" + unionId) 
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
    return logic.city.recharge(args.rechargeId, args.amount)
  }
  onAddTestResource(args: StateTransitionArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    return logic.city.addTestResource()
  }
  onRecoverMorale(args: RecoverMoraleArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    return logic.general.recoverMorale(args.resourceType)
  }

  onBuyStrategyPoint(args: BuyStrategyPointArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    return logic.strategy.buyStrategyPoint(args.amount)
  }

  onStrategyBuyTroop(args: StateTransitionArgs){
    const logic: LogicEssential = this.genLogic(args.from)
    return logic.strategy.buyTroop()
  }
  
  onStrategyBuySilver(args: StateTransitionArgs){
    const logic: LogicEssential = this.genLogic(args.from)
    return logic.strategy.buySilver()
  }

  onStrategyBuyMorale(args: StateTransitionArgs){
    const logic: LogicEssential = this.genLogic(args.from)
    return logic.strategy.buyMorale()
  }

  onStrategyBuyProtect(args: StateTransitionArgs){
    const logic: LogicEssential = this.genLogic(args.from)
    let re = logic.strategy.buyProtect()
    let defenseList: GeneralDefenseBlock[] = copyObj(logic.general.state.defenseBlockList) as GeneralDefenseBlock[]
    for(let item of defenseList){
      this.onCancelDefenseBlock({
        from: args.from,
        x_id: item.x_id,
        y_id: item.y_id,
        generalId: item.generalId
      })
    }
    return re
  }

  onStrategyBuyStore(args: StateTransitionArgs ){
    const logic: LogicEssential = this.genLogic(args.from)
    return logic.strategy.buyStore()
  }

  onMiningBlock(args: AttackBlockArgs){
    const logic : LogicEssential = this.genLogic(args.from, args.x_id, args.y_id)
    if(logic.general.state.unionId != logic.map.getBelongInfo(args.x_id, args.y_id)){
      return {
        result: false,
        error: 'unionId-error'
      }
    }
    if(!logic.map.miningable(args.x_id, args.y_id)){
      return {
        result: false,
        error: "remainSilver-too-less"
      }
    }
    let generalRe = logic.general.miningBlock(args.generalId)
    if(!generalRe.result){
      return generalRe
    } 
    let num = logic.map.miningBlock(args.x_id, args.y_id)
    logic.city.useSilver(-num)
    return {
      result: true,
      getSilver: num
    }
  }

  onInitUserStates(args : InitUserStatesArgs){
    const logic: LogicEssential = this.genLogic(args.username)
    let initState = GetInitState()
    console.log('state used to update', initState[StateName.City],initState[StateName.General],initState[StateName.Strategy])
    logic.city.state.update(
      initState[StateName.City]
    )
    logic.general.state.update(
      initState[StateName.General]
    )
    logic.strategy.state.update(
      initState[StateName.Strategy]
    )
    console.log('state after update', logic.city.state, logic.general.state, logic.strategy.state)
    logic.general.updateDefenseInfo();
    return {
      result: true
    }
  }

  onInitGlobalStates(args: StateTransitionArgs){
    let initState = GetInitState()
    const mapGlobalState = this.stateManger.get(
      {
        id: `${StateName.MapGlobalInfo}`
      }
    )
    const rewardGlobalState = this.stateManger.get(
      {
        id: `${StateName.RewardGloablState}`
      }
    )
    const activityState = this.stateManger.get(
      {
        id: `${StateName.Activity}`
      }
    )
    activityState['id'] = `${StateName.Activity}`
    console.log('activityState detail', JSON.stringify(activityState))
    mapGlobalState.update(
      initState[StateName.MapGlobalInfo]
    )
    rewardGlobalState.update(
      initState[StateName.RewardGloablState]
    )
    console.log('activityState to set', initState[StateName.Activity])
    activityState.update(
      initState[StateName.Activity]
    )
    for(let block in mapGDS){
      let key = `${StateName.BlockInfo}:${block}`
      let blockState = this.stateManger.get( {id : key})
      blockState.update(
        initState[key]
      )
    }
    return {
      result: true
    }
  }

  onDonateSilver(args: DonateSilverArgs){
    const logic: LogicEssential = this.genLogic(args.from)
    return logic.activity.donateSilver(args.activityId, args.amount)
  }

  onRegularTask(){
    const gLogic: GlobalLogicEssential = this.genGlobalLogic()
    let activityList = gLogic.activity.getBeforeActivities()
    const time = getTimeStamp()
    for(let activity of activityList){
      let haveSendReward = gLogic.activity.state.haveSendReward
      if(time < activity.startTime + activity.lastTime && haveSendReward[activity.activityId] == true)
      {
        haveSendReward[activity.activityId] = false
        gLogic.activity.state.update(
          {
            'haveSendReward' : haveSendReward
          }
        )
      }
      if(time > activity.startTime + activity.lastTime && !gLogic.activity.state.haveSendReward[activity.activityId]){
        //send activity reward
        console.log("sendActivity reward id:", activity.activityId)
        for(let userdata of gLogic.activity.state.activityData[activity.activityId]){
          const tempLogic : LogicEssential = this.genLogic(userdata.username)
          let rank = tempLogic.activity.getActivityRank(activity.activityId, userdata.username, userdata.value)
          tempLogic.city.useGold(-rank.rankReward)
        }
        haveSendReward[activity.activityId] = true
        gLogic.activity.state.update(
          {
            'haveSendReward' : haveSendReward
          }
        )
      }
    }
    return {
      result: true
    }
  }

  onSetGuideStep( args : GuideStepArgs ){
    const logic: LogicEssential = this.genLogic(args.from)
    return logic.city.setGuideStep( args.type, args.step)
  }

}
