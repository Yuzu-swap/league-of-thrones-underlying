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
  GuideStepArgs,
  checkerMapForTxArgsTypeMap,
  SetUnionWinArgs,
  OutChainUserActivityArgs,
  HealTroopsArgs,
  SpyEnamyArgs
} from '../Const';

import { City, CityConfig } from '../Logic/game';
import { GeneralDefenseBlock, GetInitState, GloryInfo, IActivityState, IBlockState, ICityState, IGeneralState, IMapGlobalState, IRewardGlobalState, ISeasonConfigState, ITokenPriceInfoState, IStrategyState } from '../State';
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
import { addToSortList, checkNaNInObj, getTimeStamp, getTxHash, parseStateId } from '../Utils';
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
  City = "city",
  Spy = "spy"
}

export interface BattleTransRecord{
  attackInfo: BattleRecordInfo
  defenseInfo: BattleRecordInfo
  recordType: BattleRecordType,
  blockInfo: {
    x_id: number
    y_id: number
    durabilityReduce: number
  }
  timestamp: number
  result: boolean
  txHash: string
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
      if(checkerMapForTxArgsTypeMap[sid]){
        checkerMapForTxArgsTypeMap[sid].check(arg)
        checkNaNInObj(arg)
      }
      const witnessName = "witness"
      const onlyWitnessTransitions = [
        StateTransition.StartSeason,
        StateTransition.Recharge,
        StateTransition.FinishOutChainUserActivity,
      ]
      // if sid in onlyWitness transition type
      if ( onlyWitnessTransitions.includes(sid) ) {
        if (arg["from"] != witnessName ){
          console.log(" only witness can do this transition sid: ",sid , " from: ", arg["from"])
          throw new Error(" only witness can do this transition sid: " + sid + " from: " + arg["from"])
        }
      }

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
        case StateTransition.StrategyBuyProtect1:
          re = this.onStrategyBuyProtect1(arg as StateTransitionArgs)
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
        case StateTransition.FirstLogin:
          re = this.onFirstLogin(arg as StateTransitionArgs)
          break
        case StateTransition.SetUnionWin:
          re = this.onSetUnionWin(arg as SetUnionWinArgs)
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
          re = this.onRegularTask(arg as OutChainUserActivityArgs)
          return re
        case StateTransition.FinishOutChainUserActivity:
          re = this.onUserFinsishOutChainActivity(arg as OutChainUserActivityArgs)
          console.log('FinishOutChainUserActivity re:', re);
          return re
        case StateTransition.HealTroops:
          re = this.onHealTroops(arg as HealTroopsArgs)
          return re
        case StateTransition.SpyEnamy:
          re = this.onSpyEnamy(arg as SpyEnamyArgs)
          return re
        case StateTransition.BuyOffer:
          re = this.onBuyOffer(arg as any)
          return re
        case StateTransition.CreateCod:
          re = this.onCreateCod(arg as any)
          return re
        case StateTransition.CancelCod:
          re = this.onCancelCod(arg as any)
          return re
        case StateTransition.JoinCod:
          re = this.onJoinCod(arg as any)
          return re
        case StateTransition.QuitCod:
          re = this.onQuitCod(arg as any)
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
    const cityState = this.stateManger.get({ 
      id: `${StateName.City}:${id}` 
    });
    const generalState = this.stateManger.get({
      id: `${StateName.General}:${id}`
    });
    const strategyState = this.stateManger.get({
      id: `${StateName.Strategy}:${id}`
    });
    
    let gStates : GlobalStateEssential
    if(gStatesIn == null){
      gStates = this.genGlobalStateEssential(x_id, y_id)
    }
    else{
      gStates = gStatesIn
    }

    const states: StateEssential = {
      username: 'transition:' + id,
      city: cityState as ICityState,
      general: generalState as IGeneralState,
      strategy: strategyState as IStrategyState,
      mapGlobal: gStates.mapGlobal,
      seasonState: gStates.seasonState,
      tokenPriceInfo: gStates.tokenPriceInfo,
      rewardGlobalState: gStates.rewardGlobalState,
      blocks: gStates.blocks,
      activityState: gStates.activityState,
      codsGlobal: gStates.codsGlobal
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
    const tokenPriceInfo = this.stateManger.get(
      {
        id: `${StateName.TokenPriceInfo}`
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
    const codsGlobal = this.stateManger.get(
      {
        id: `${StateName.Cods}`
      }
    ) 
    const gStates : GlobalStateEssential = {
      mapGlobal: mapGlobalState as IMapGlobalState,
      seasonState : seasonState as ISeasonConfigState,
      tokenPriceInfo : tokenPriceInfo as ITokenPriceInfoState,
      rewardGlobalState: rewardGlobalState as IRewardGlobalState,
      blocks: this.getBlockStates(x_id, y_id),
      activityState: activities as IActivityState,
      codsGlobal: codsGlobal as any
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
    let beforeReceive = city.getResource(ResouceType.Troop)
    city.updateResource(ResouceType.Troop)
    let afterReceive = city.getResource(ResouceType.Troop)
    return {
      result: true,
      txType: StateTransition.ReceiveTroop,
      receive: afterReceive - beforeReceive
    }
  }

  onBattle(args: BattleArgs):{}{
    const gStates: GlobalStateEssential = this.genGlobalStateEssential(0, 0)
    const logic1: LogicEssential = this.genLogic(args.from, 0, 0, gStates)
    if( logic1.strategy.getStrategyStatus(StrategyType.Protect).able){
      logic1.strategy.setStrategyStatus(StrategyType.Protect, false)
    }
    logic1.general.setLastBattle()
    const logic2: LogicEssential = this.genLogic(args.name.replace("defenderinfo:", ""), 0, 0, gStates)
    if( logic2.strategy.getStrategyStatus(StrategyType.Protect).able || logic2.general.isNewPlayerProtect()){
      return {
        result: false,
        txType: StateTransition.Battle,
        error: 'cant-battle-player-be-protected'
      }
    }
    if(logic1.city.state.id == logic2.city.state.id){
      return{
        result: false,
        txType: StateTransition.Battle,
        error: 'cant-battle-self'
      }
    }
    console.log('updateInjuredTroops battle args:', args)
    let defenseInfo = logic2.general.getDefenseInfo()
    console.log('updateInjuredTroops defenseInfo:', defenseInfo);
    let unionIds = {
      attackUnionId: logic1.general.state.unionId, 
      defenseUnionId: logic2.general.state.unionId
    };
    let re = logic1.general.battle(args.generalId, unionIds, defenseInfo)
    console.log('updateInjuredTroops battle result:', re)

    logic2.city.updateInjuredTroops(re['defenseTroopReduce'], 'battle')
    console.log('updateInjuredTroops defenseTroopReduce:', re)

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
          gloryGet: re['attackGloryGet'],
          unionId: logic1.general.state.unionId,
          iconId: logic1.general.state.iconId
        },
        defenseInfo:{
          username: parseStateId(logic2.city.state.getId()).username,
          generalId: defenseInfo.generalId,
          generalLevel: defenseInfo.generalLevel,
          generalType: defenseInfo.generalType,
          troopReduce: re['defenseTroopReduce'],
          silverGet: -re['silverGet'],
          gloryGet: re['defenseGloryGet'],
          unionId: logic2.general.state.unionId,
          iconId: logic2.general.state.iconId
        },
        recordType: BattleRecordType.City,
        blockInfo:{
          x_id: 0,
          y_id: 0,
          durabilityReduce: 0
        },
        timestamp: getTimeStamp(),
        txHash: getTxHash(),
        result: re['win']
      }

      const status1 = logic1.general.getGeneralBattleStatus(args.generalId);
      const total1 = status1.sum['attack'] + status1.sum['defense'];
      const status2 = logic2.general.getGeneralBattleStatus(defenseInfo.generalId);
      const total2 = status2.sum['attack'] + status2.sum['defense'];
      const powerCompare = total1/total2;
      console.log('powerCompare:', status1, status2, total1, total2, powerCompare);

      let moraleAdd = 2;
      if(powerCompare > 2){
        if(!re['win']){
          logic1.general.offsetMorale(moraleAdd * -1);
          logic2.general.offsetMorale(moraleAdd);
        }
      }else if(powerCompare <= 2 && powerCompare > 1/2){
        if(re['win']){
          logic1.general.offsetMorale(moraleAdd);
          logic2.general.offsetMorale(moraleAdd * -1);
        }else{
          logic1.general.offsetMorale(moraleAdd * -1);
          logic2.general.offsetMorale(moraleAdd);
        }
      }else{
        if(re['win']){
          logic1.general.offsetMorale(moraleAdd);
          logic2.general.offsetMorale(moraleAdd * -1);
        }
      }

      let oldGlory1 = logic1.general.state.glory
      let oldGlory2 = logic2.general.state.glory
      logic1.map.addGloryAndSum(btr.attackInfo.gloryGet)
      logic2.map.addGloryAndSum(btr.defenseInfo.gloryGet)
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
    if((re as any).silverGet > 0){
      logic1.city.useSilver( - (re as any).silverGet as number)
    }
    return re
  }

  onHealTroops(args: HealTroopsArgs){
    const logic: LogicEssential = this.genLogic(args.from);
    console.log('onHealTroops', args);
    let re = logic.general.healTroops(args.typ, args.amount);
    console.log('onHealTroops', re);
    return re;
  }

  onSpyEnamy(args: SpyEnamyArgs){
    const gStates: GlobalStateEssential = this.genGlobalStateEssential(0, 0)
    const logic1: LogicEssential = this.genLogic(args.from, 0, 0, gStates)
    const logic2: LogicEssential = this.genLogic(args.username, 0, 0, gStates)

    const logic: LogicEssential = this.genLogic(args.from);
    let re = logic.general.spyForEnamy(args.from, args.generalId);

    let typeInfos = logic2.city.getAllUpgradeInfo(CityFacility.Store);
    let cityLevel = logic2.city.state.facilities['store'][0];
    re['store'] = typeInfos[cityLevel-1];

    let btr: BattleTransRecord  = {
      attackInfo :{
        username: args.from,
        generalId: args.generalId,
        generalLevel: logic1.general.getGeneralLevel( args.generalId ),
        generalType: logic1.general.getGeneralQualification( args.generalId ).general_type,
        troopReduce: 0,
        silverGet: 0,
        gloryGet: 0,
        unionId: logic1.general.state.unionId,
        iconId: logic1.general.state.iconId
      },
      defenseInfo:{
        username: args.username,
        generalId: -1,
        generalLevel: -1,
        generalType: -1,
        troopReduce: 0,
        silverGet: 0,
        gloryGet: 0,
        unionId: logic2.general.state.unionId,
        iconId: logic2.general.state.iconId
      },
      recordType: BattleRecordType.Spy,
      blockInfo:{
        x_id: 0,
        y_id: 0,
        durabilityReduce: 0
      },
      timestamp: getTimeStamp(),
      txHash: getTxHash(),
      result: re['result']
    }
    this.recordEvent(TransitionEventType.Battles, btr);

    console.log('spyEnamy', args, re);
    return re;
  }

  onCreateCod(args: any) {
    let username = args.from;
    let blockInfo = args.blockInfo;
    let generalId = args.generalId;

    const logic : LogicEssential = this.genLogic(username)
    return logic.general.createCod(blockInfo, { username, generalId });
  }

  onCancelCod(args: any) {
    let username = args.from;
    let codId = args.codId;

    const logic : LogicEssential = this.genLogic(username);

    let codDetail = logic.general.getCodDetail(codId);
    let members = codDetail.members;
    members.forEach(function(member){
      let username = member['username'];
      let logicPlayer : LogicEssential = this.genLogic(username)
      return logicPlayer.general.quitCod(codId, { username });
    });

    return logic.general.cancelCod(codId);
  }
  
  onJoinCod(args: any) {
    let username = args.from;
    let generalId = args.generalId;
    let codId = args.codId;

    const logic : LogicEssential = this.genLogic(username)
    return logic.general.joinCod(codId, { username, generalId });
  }

  onQuitCod(args: any) {
    let username = args.from;
    let codId = args.codId;

    const logic : LogicEssential = this.genLogic(username)
    return logic.general.quitCod(codId, { username });
  }

  onAttackBlock(args: AttackBlockArgs){
    console.log('attackBlocksAround args:', args);
    const gStates: GlobalStateEssential = this.genGlobalStateEssential(args.x_id, args.y_id)
    const logic : LogicEssential = this.genLogic(args.from, args.x_id, args.y_id, gStates)
    if( logic.strategy.getStrategyStatus(StrategyType.Protect).able){
      logic.strategy.setStrategyStatus(StrategyType.Protect, false)
    }
    if(!logic.map.checkBetween(1, args.x_id, args.y_id )){
      return{
        result: false,
        txType: StateTransition.AttackBlock,
        error: 'block-is-too-far'
      }
    }
    const blockGds = logic.map.mapConfig.get(args.x_id, args.y_id)
    if(blockGds.type == 3){
      return {
        result: false,
        txType: StateTransition.AttackBlock,
        error: 'cant-attack-init-block'
      }
    }
    let re = logic.map.attackBlocksAround(args.x_id, args.y_id, args.generalId);
    console.log('attackBlocksAround result:', re);
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
        logic.map.addGloryAndSum(record.attackInfo.gloryGet)
        if(record.defenseInfo.username != ''){
          let tempLogic: LogicEssential = this.genLogic(record.defenseInfo.username, args.x_id, args.y_id, gStates)
          if(tempLogic){
            let oldTempGlory = tempLogic.general.state.glory
            tempLogic.map.addGloryAndSum(record.defenseInfo.gloryGet)
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
          txType: StateTransition.AttackBlock,
          record: temp[temp.length - 1],
          durabilityReduce: re['durabilityReduce']
        }
        let defenseInfo = temp[temp.length - 1].defenseInfo || { troopReduce: 0, username: '' };
        let { troopReduce = 0, username = ''} = defenseInfo;
        if(username !== ''){
          let logic2: LogicEssential = this.genLogic(username.replace("defenderinfo:", ""), args.x_id, args.y_id, gStates)
          logic2.city.updateInjuredTroops(troopReduce, 'battle')
          console.log('updateInjuredTroops attackBlock defenseInfo:', defenseInfo)
        }
      }else{
        let gloryGet = Math.floor(re['durabilityReduce'] / 50) + logic.general.config.parameter.battle_victory_get_glory;
        logic.map.addGloryAndSum(gloryGet)
        transRe = {
          result: true,
          txType: StateTransition.AttackBlock,
          gloryGet: gloryGet, //do fix
          durabilityReduce: re['durabilityReduce']
        }
        this.recordEvent(
          TransitionEventType.Battles,
          logic.map.genDurabilityRecord(
            args.x_id, args.y_id, args.generalId, Math.floor(re['durabilityReduce'] / 50) + logic.general.config.parameter.battle_victory_get_glory, re['durabilityReduce']
          )
        )
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
      console.log('attackBlocksAround result2:', transRe);
      return transRe
    }
    else{
      let records = re.records || [];
      let defenseInfo = (records[records.length - 1] || {}).defenseInfo || { troopReduce: 0, username: '' };
      let { troopReduce = 0, username = ''} = defenseInfo;
      if(username !== ''){
        let logic2: LogicEssential = this.genLogic(username.replace("defenderinfo:", ""), args.x_id, args.y_id, gStates)
        logic2.city.updateInjuredTroops(troopReduce, 'battle')
        console.log('updateInjuredTroops attackBlock defenseInfo:', defenseInfo)
      }
      console.log('attackBlocksAround result1:', re);
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
        txType: StateTransition.DefenseBlock,
        error: 'unionId-error'
      }
    }
    let re = logic.general.defenseBlock( args.generalId ,args.x_id, args.y_id)
    if(re['result'] == false){
      return re
    }
    let info = logic.general.getDefenseBlockInfo(args.generalId, re.troops)
    let re1 = logic.map.defenseBlock(args.x_id, args.y_id, info)
    return {
      txType: StateTransition.DefenseBlock,
      result: true
    }
  }

  onCancelDefenseBlock(args: AttackBlockArgs){
    const logic : LogicEssential = this.genLogic(args.from, args.x_id, args.y_id)
    const remainTroop = logic.map.cancelDefenseBlock(args.x_id, args.y_id, args.from, args.generalId)
    logic.general.cancelDefenseBlock(args.generalId, remainTroop)
    return {
      txType: StateTransition.CancelDefenseBlock,
      result: true
    }
  }

  onSetUnionId(args: SetUnionIdArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    if(args.force == false && logic.general.state.unionInit == true){
      return {
        result: false,
        txType: StateTransition.SetUnionId,
        error: 'unionId-have-set'
      }
    }
    logic.general.state.update(
      {
        'unionId' : args.union_id,
        "unionInit" : true
      }
    )

    const username = args.from
    console.log("onSetUnionId username ",username , " applyInfo is ", args)

    this.addUserScoresAndExtraGeneral('onSetUnionId : ', args);

    if(args.random_union){
      logic.city.addRandomCampGold()
    }
    
    return {
      result: true,
      txType: StateTransition.SetUnionId,
      username: args.from,
      unionId: args.union_id
    }
  }

  onCheckSeasonFinish(args : StateTransitionArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    let time = getTimeStamp()
    // const config = logic.map.seasonConfig.get(1)
    const config = logic.map.seasonState;
    if(time > config.season_end){
      return {
        result: false,
        error: 'season-end'
      }
    }
  }

  onSetUnionWin(args : SetUnionWinArgs){
    const logic : LogicEssential = this.genLogic(args.from, 0, 0)
    let re = logic.map.setUnionWin(args.unionId)
    return re
  }

  onSetSeasonEnd(args: SetSeasonEndArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    logic.map.setSeasonEnd()
    return {
      txType: StateTransition.SetSeasonEnd,
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
    const logic : LogicEssential = this.genLogic(args.from)
    const gLogic: GlobalLogicEssential = this.genGlobalLogic()
    if(gLogic.map.seasonState.haveSet){
      return {
        result: true,
        txType: StateTransition.StartSeason,
        error: 'seasonHaveSet'
      }
    }
    console.log("onStartSeason args are ", args)
    let applies = args.applies || {};

    for(let unionIdString in applies){
      const unionId = parseInt(unionIdString)
      if(unionId < 1 || unionId >4){
        continue
      }
      let userInfos = applies[unionIdString]
      for(let username in userInfos){
        let applyInfo = userInfos[username];
        applyInfo['username'] = username;
        this.addUserScoresAndExtraGeneral('onStartSeason: ', applyInfo);
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

    const priceInfo = args.priceInfo || {};
    this.updateTokenPriceInfo(gLogic, 'initial', priceInfo);

    return {
      txType: StateTransition.StartSeason,
      result: true
    }
  }

  addUserScoresAndExtraGeneral(type: string, applyInfo: any){
    console.log('addUserScoresAndExtraGeneral:', type, applyInfo);
    let username= applyInfo.username || applyInfo.from;
    let unionId = applyInfo.union_id;
    const logic : LogicEssential = this.genLogic(username)
    logic.general.state.update(
      {
        'unionId' : unionId,
        "unionInit" : true
      }
    )
    console.log("username ",username , " applyInfo is ", applyInfo)

    // applyInfo.wallet_value = applyInfo.wallet_token_value + applyInfo.wallet_nft_value
    let wallet_token_value = applyInfo.wallet_token_value || 0;
    let wallet_nft_value = applyInfo.wallet_nft_value || 0;

    let userScores = {};
    let userScore1 = wallet_token_value/1 + wallet_nft_value/1;
    userScores[username] = userScore1 || 0.01;
    logic.general.addUserScores(userScores);

    let userScore2 = logic.general.getUserScore(username);
    let vipBuffs = logic.general.getVipBuffs(userScore2);

    let general_ids = applyInfo.general_ids || [];
    let generalIds = general_ids.concat(vipBuffs.add_general_id);
    logic.general.addextraGeneral(generalIds);

    console.log('addUserScoresAndExtraGeneral getVipBuffs: ', username, ' userScore: ', { userScore1, userScore2 }, vipBuffs)

    logic.city.addPreRegisterGold()
    if(applyInfo.random_union){
      logic.city.addRandomCampGold()
    }
  }

  updateTokenPriceInfo(gLogic: GlobalLogicEssential, typ: string, priceInfo: any){
    console.log('updateTokenPriceInfo 1:', typ, priceInfo);
    let newTokenPriceInfo = {
      [typ]: priceInfo,
      lastUpdate: getTimeStamp()
    };
    console.log('updateTokenPriceInfo 2:', newTokenPriceInfo);

    gLogic.map.tokenPriceInfo.update(newTokenPriceInfo);
    console.log('updateTokenPriceInfo 3:', gLogic.map.tokenPriceInfo);
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
  onUserFinsishOutChainActivity(args: OutChainUserActivityArgs){
    console.log('FinishOutChainUserActivity args:', args);
    const logic : LogicEssential = this.genLogic(args.username)
    const re = logic.city.finishOutChainUserActivity(args.type,args.action,logic.strategy);
    console.log('FinishOutChainUserActivity re:', re);
    return re;
  }
  onAddTestResource(args: StateTransitionArgs){
    const logic : LogicEssential = this.genLogic(args.from)
    return logic.city.addTestResource()
  }
  onBuyOffer(args: any){
    const logic : LogicEssential = this.genLogic(args.from);
    const offerId = args.offerId;
    console.log('onBuyOffer 1:', offerId);
    return logic.city.buyOffer(offerId);
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

  onStrategyBuyProtect1(args: StateTransitionArgs){
    const logic: LogicEssential = this.genLogic(args.from)
    let re = logic.strategy.buyProtect1()
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
        txType: StateTransition.MiningBlock,
        error: 'unionId-error'
      }
    }
    if(!logic.map.miningable(args.x_id, args.y_id)){
      return {
        result: false,
        txType: StateTransition.MiningBlock,
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
      txType: StateTransition.MiningBlock,
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
      txType: StateTransition.InitUserStates,
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
      txType: StateTransition.InitGlobalStates,
      result: true
    }
  }

  onDonateSilver(args: DonateSilverArgs){
    const logic: LogicEssential = this.genLogic(args.from)
    return logic.activity.donateSilver(args.activityId, args.amount)
  }

  onRegularTask(args: any){
    const logic : LogicEssential = this.genLogic(args.from)
    const seasonState = logic.map.seasonState;

    console.log('onRegularTask start:', seasonState, args);

    const gLogic: GlobalLogicEssential = this.genGlobalLogic()
    
    const priceInfo = args.priceInfo || {};
    this.updateTokenPriceInfo(gLogic, 'current', priceInfo);

    let activityList = gLogic.activity.getBeforeActivitiesForReward(seasonState);
    const time = getTimeStamp()
    console.log('onRegularTask run:', time, activityList);
    for(let activity of activityList){
      console.log('onRegularTask activityList:', time, activity);
      if(time > activity.startTime + activity.lastTime && !gLogic.activity.state.haveSendReward[activity.activityId]){
        //send activity reward
        console.log("sendActivity reward id:", activity.activityId)
        let haveSendReward = gLogic.activity.state.haveSendReward
        for(let userdata of (gLogic.activity.state.activityData[activity.activityId] || [])){
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
        console.log("sendActivity reward over id:", activity.activityId, haveSendReward)
      }
    }
    console.log("sendActivity reward over all:", gLogic.activity.state.haveSendReward)

    return {
      txType: StateTransition.RegularTask,
      result: true
    }
  }

  onSetGuideStep( args : GuideStepArgs ){
    const logic: LogicEssential = this.genLogic(args.from)
    return logic.city.setGuideStep( args.type, args.step)
  }

  onFirstLogin(args: StateTransitionArgs){
    const logic: LogicEssential = this.genLogic(args.from) 
    if(logic.city.state.firstLogin != -1)
    {
      return {
        result: false,
        txType: StateTransition.FirstLogin,
        error: "it-is-not-first-login"
      }
    }
    const time = getTimeStamp()
    logic.city.state.update({
      firstLogin: time
    })
    return{
      txType: StateTransition.FirstLogin,
      result: true
    }
  }

}
