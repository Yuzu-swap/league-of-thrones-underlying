import { BattleRecord, BattleResult, BattleType, General, GeneralAbility } from '../Logic/general'
import { City, RecruitStatus } from '../Logic/game'
import { ITransContext, LocalMediator, IStatetWithTransContextCallback, ITransResult, GetTestBattleTransRecord } from '../Controler/mediator'
import { StateTransition, CityFacility, ResouceType, StateName, ChatMessage, ChatChannel, ChatType, ChatTransId, RecoverMoraleType } from '../Const'
import { BaseMediator, IStateMediator, StateCallback } from '../../Core/mediator'
import { State, IState, IStateIdentity, copyObj } from '../../Core/state'
import { ConfigContainer } from '../../Core/config'
import { IActivityState, IBlockState, ICityState, IGeneralState, IMapGlobalState, InitState, IRewardGlobalState, ISeasonConfigState, IStrategyState, ITokenPriceInfoState, ResouceInfo } from '../State'
import {
  FacilityFortressGdsRow,
  FacilityMilitaryCenterGdsRow,
  FacilityWallGdsRow,
  FacilityStoreGdsRow,
  FacilityInfantryCampGdsRow,
  FacilityCavalryCampGdsRow,
  FacilityArcherCampGdsRow,
  FacilityTrainingCenterGdsRow,
  FacilityHomeGdsRow,
  FacilityGdsRow,
  GeneralGdsRow,
  BuffGdsRow
} from '../DataConfig';

import { LogicEssential, createLogicEsential, StateEssential, ConfigEssential } from '../Logic/creator'
import { promises } from 'dns'
import { WebSocketMediator } from '../Controler/websocket'
import { callbackify } from 'util'
import { MapComponent, IMapComponent } from './map'
import { BattleTransRecord, TransitionEventType } from '../Controler/transition'
import { decodeChatProfile, encodeChatProfile, getTimeStamp, parseStateId, setTimeOffset } from '../Utils'
import { StrategyComponent } from './strategy'
import { Activity } from '../Logic/activity'
import { MessageType } from '../Controler/Websocket/protocol'
import { ChainComponent } from './chain'



export interface IComponent {
  //trigger when state update
  onStateUpdate(callback: IStatetWithTransContextCallback): void;
}

export interface ICityComponent extends IComponent {
  //TODO: replace any with inteface
  getFacilityList(): { [key in CityFacility]?: number[] };
  getResource(): { [key : string]: {} };
  /**
   * Returns the info of facility than it upgrades need , when returns undefined means can't upgrade to this level
   * @param typ the type of the facility
  */
  getUpgradeInfo(typ: CityFacility, targetLevel: number): FacilityGdsRow | undefined;
  /**
   * Returns the all info of facility than it upgrades need
   * @param typ the type of the facility
  */
  getAllUpgradeInfo(typ: CityFacility): FacilityGdsRow[];

  /**
   * Returns the order of the facility for show
  */
  getFacilityOrder(): string[];
  getInjuredTroops(): any;
  healEstimate(amount: number): any;
  healTroopsStart(typ: string, amount: number, callback: (res: ITransResult) => void): void;
  updateResource(inter?: number): any;
  checkUpgradeFacility(typ: CityFacility, index: number): boolean;
  getFacilityUpgradeRequirement(typ: CityFacility, targetLevel: number): any;
  doUpgradeFacility(typ: CityFacility, index: number, callback: (res: ITransResult) => void): void;
  /**
   * recruit troop
  */
  doRecruit(amount: number, callback: (res: ITransResult) => void): void;

   /**
   * get Recruit state
  */
  getRecruitState():{}

  /**
   * receive troop
  */
  receiveTroop(callback:(result: any) => void): void

  getRechargeConfigs(chainName: string):[]

  getGold():number

  getTestResourceCoolDownTime(): number

  addTestResource(callback: (res: ITransResult) => void): void

  getOfferList(): {}

  buyOffer(offerId: number, callback: (res: ITransResult) => void): void

  onReceiveChat( channel: ChatChannel, callback: ( chatData: ChatMessage ) => void ) : void

  chat(data: {
    channel: ChatChannel
	  content: string
  }, callback: ( result: any ) => void) : Promise<void>

  getHistoryChatData(
    data: {
      unionId: number
    }, callback: ( result: ChatMessage[] ) => void
  ): Promise<void>

  getChatRedPoint( channel: ChatChannel ): boolean

  updateChatRedPoint( channel: ChatChannel, msg: ChatMessage ): void

  initRedPoint():Promise<void>

  getAbleActivityInfo(index: number): any[]

  readActivity(activityId: number): void

  donateSilver( activityId: number, amount: number, callback:(result: any) => void ): void

  getGuideStep( type: string): number
  
  setGuideStep( type :string , step: number , callback: (result: any) => void): void

  getRecruitNeed(amount : number) : number
}

export interface IGeneralComponent extends IComponent {
  /**
   * get const data
  */
  getConstData(): {}
  /**
   * get the vip buff of the user 
   * @param username the address of the user
  */
  getUserVipBuffs(username: string): {}
  /**
   * get the qualification of the general 
   * @param id the id of the general
  */
  getGeneralQualification(id: number): GeneralGdsRow | undefined
  /**
   * get able status
   * @returns able_count: number, max_able_count: number
  */
  getAbleStatus(): {}

  /**
   * get all status of general , includes general level , able status and qualification
  */
  getGeneralList(): {}
  /**
   * enable the general
   *  @param id the id of the general
  */
  ableGeneral(id: number, callback: (result: any) => void): void
  /**
   * disable the general
   *  @param id the id of the general
  */
  disableGeneral(id: number, callback: (result: any) => void): void
  /**
   * check if can upgrade general 
   *  @param id the id of the general
  */
  checkUpgradeGeneral(id: number): boolean
  /**
   * upgrade the general
   *  @param id the id of the general
  */
  upgradeGeneral(id: number, callback: (result: any) => void): void
  /**
   * get the silver general upgrade need
   * @param id the id of the general
   * @param level current level
  */
  getUpgradeGeneralNeed(id: number, level: number): number

  /**
   * get the qualification value of the general 
   * @param id the id of the general 
   * @param level the level of the general
  */
  getGeneralQuaValue(id: number, level: number): {}
  /**
   * get the silver that general skill upgrade need
   * @param generalId the id of the general 
   * @param skillIndex the index of the skill in general 
   * @param level the level of the skill
  */
  getSkillUpgradeNeed(generalId: number, skillIndex: number, level: number): number
  /**
   * check if general skill can upgrade 
   * @param generalId the id of the general 
   * @param skillIndex the index of the skill in general 
  */
  checkGeneralSkillUpgrade(generalId: number, skillIndex: number): boolean

  /**
   * get general skill list 
   * @param generalId the id of the general 
   * @returns skill_id: number[],  skill_level : number[],  upgrade_need: number[] , value_type: number[], buff_value: number[], check_upgrade: boolean[]
  */
  getGeneralSkillList(generalId: number): {}

  /**
   * get skill info 
   * @param skillid the id of the skill 
  */
  getSkillInfo(skillId: number): BuffGdsRow | undefined

  /**
   * upgrade skill of general
   * @param generalId the id of the general 
   * @param skillIndex the index of the skill in general 
  */
  upgradeGeneralSkill(generalId: number, skillIndex: number, callback: (result: any) => void): void


  /**
   * set defense general
   * @param generalId the id of the general
  */
  setDefenseGeneral(generalId: number, callback: (result: any) => void): void

  /**
   * get defenseGeneral
  */
  getDefenseGeneralId(): number

  /**
   * get battle info of the general
   * @param generalId the id of the general
  */
  getGeneralBattleInfo(generalId: number): {}

  /**
   * 
  */

  getBattleStatuses(name : string, callback: (result: any) => void ): Promise<void>
  spyEnamy(username : string, generalId: number, callback: (result: any) => void ): void

  getGloryAndRank(callback: (result: any) => void ): Promise<void>

  /**
   * battle
   * @param name name of the player to battle
   * @param generalId id of the general
  */
  battle( generalId: number ,name: string , callback: (result: any) => void): void

  getBattleRecords( callback: (result: any) => void ): Promise<void>

  getRecentWorldBattleRecords( callback: (result: BattleTransRecord[]) => void ): Promise<void>

  getDefenseBlockGenerals():[]

  getIconId(): number

  setIconId(iconId: number, callback: (result: any) => void): void

  getMorale(): number

  getRecoverMoraleInfo(): {}

  getMoraleBuff(): {}

  recoverMorale( resourceType: RecoverMoraleType, callback: (result: any) => void): void

  getAttackTroop(): number
  getDefenseTroop(): number

  getBattleRecordRedPoint(): boolean
  updateBattleRedPoint(timestamp : number ):void
  initRedPoint():Promise<void>



  getCodList():Promise<any>
  joinCod(codId: string, generalId: number, callback: (result: any) => void ) : void

  getAllBattleStatuses( callback: (result: any) => void ) : Promise<void>
}


export class CityComponent implements ICityComponent {
  type: ComponentType;
  city: City;
  activity: Activity
  mediator: IStateMediator<StateTransition, ITransContext>
  cityStateId: IStateIdentity
  listener: IStatetWithTransContextCallback[]
  chatRedPointInfo: { [key in ChatChannel ]? : { id: string , ts : number } } // global chat msg info
  chatReadInfo:{ [key in ChatChannel ]? : { id: string , ts : number } }  // local read info
  chatProfileKey : {
    [key in ChatChannel ] : string
  }
  activityHaveRead: boolean[]

  constructor(myStateId: string, mediator: IStateMediator<StateTransition, ITransContext>) {
    this.cityStateId = {
      id: myStateId
    }
    this.type = ComponentType.City
    this.mediator = mediator
    this.listener = []
    this.chatReadInfo = {}
    this.chatRedPointInfo = {}
    this.chatProfileKey = {
      [ChatChannel.ChatChannel_Camp] : "profile-chatCamp",
      [ChatChannel.ChatChannel_WORLD]: "profile-chatWorld"
    }
    this.activityHaveRead = []
  }

  setCity(city : City){
    this.city = city
    this.mediator.onReceiveState(
      this.cityStateId
      ,
      ()=>{
        this.city.updateBoost()
      }
    )
  }

  setActivity(activity: Activity){
    this.activity = activity
    let len = this.activity.state.activityData.length
    for(let i = 0; i< len; i++)
    {
      this.activityHaveRead.push(false) 
    }
  }

  getActivityProfileKey(activityId: number){
    return `profile-activity-${activityId}`
  }

  getUpgradeInfo(typ: CityFacility, targetLevel: number): FacilityGdsRow {
    return this.city.getUpgradeInfo(typ, targetLevel)
  }

  getAllUpgradeInfo(typ: CityFacility): FacilityGdsRow[] {
    return this.city.getAllUpgradeInfo(typ)
  }

  getFacilityOrder(): string[] {
    return this.city.getFacilityOrder()
  }

  getInjuredTroops() {
    return this.city.getInjuredTroops()
  }

  healEstimate(amount: number) {
    return this.city.healEstimate(amount);
  }

  healTroopsStart(typ: string, amount: number, callback: (res: ITransResult) => void){
    let supportTypes = {
      silver: true,
      gold: true
    };
    // if(!supportTypes[typ]){
    //   callback({
    //     err: 'support type should be silver/gold.'
    //   })
    // }
    // if(amount <= 0){
    //   callback({
    //     err: 'amount must > 0.'
    //   })
    // }

    // if(typ === 'silver'){
    //   return this.city.healTroopsBySilver(amount);
    // }
    // if(typ === 'gold'){
    //   return this.city.healTroopsByGold(amount);
    // }
    this.mediator.sendTransaction(StateTransition.HealTroops, {
      from: Throne.instance().username,
      typ: typ,
      amount: amount,
    }, callback)
  }

  updateResource(inter: number = 5000): void {
    setInterval(
      () => {
        for(let callbak of this.listener){
          callbak({} as any)
        }
      },
      inter
    )
  }

  getFacilityList(): { [key in CityFacility]?: number[] } {
    return copyObj(this.city.state.facilities)
  }
  getResource(): { } {
    let silverStatus = this.city.boost.getProductionStatus(ResouceType.Silver)
    let troopStatus = this.city.boost.getProductionStatus(ResouceType.Troop)
    let re = {
      [ResouceType.Silver]:
      {
          value: this.city.getResource(ResouceType.Silver),
          production: this.city.boost.getProduction(ResouceType.Silver),
          maintain: silverStatus.maintain,
          normal: silverStatus.normalProduction
      },
      [ResouceType.Troop]:
      {
          value: this.city.getResource(ResouceType.Troop),
          production: this.city.boost.getProduction(ResouceType.Troop),
          maintain: troopStatus.maintain,
          normal: troopStatus.normalProduction
      } 
    }
    re['maintainNeedTroop'] = this.city.getMaintainNeedTroop()
    re['protectSilver'] = this.city.getSaveSilverAmount()
    re['troopUseSilver'] = re[ResouceType.Troop].value * 1
    return re
  }
  getFacilityUpgradeRequirement(typ: CityFacility, targetLevel: number): FacilityGdsRow | undefined {
    return this.city.getUpgradeInfo(typ, targetLevel)
  }

  checkUpgradeFacility(typ: CityFacility, index: number): boolean {
    return this.city.checkUpgradeFacility(typ, index)
  }

  doUpgradeFacility(typ: CityFacility, index: number, callback: (res: ITransResult) => void) {
    this.mediator.sendTransaction(StateTransition.UpgradeFacility, {
      from: Throne.instance().username,
      typ: typ,
      index: index,
    }, callback)
  }
  
  recruitEstimate(amount: number) {
    return this.city.recruitEstimate(amount);
  }

  doRecruit(amount: number, callback: (res: ITransResult) => void) {
    this.mediator.sendTransaction(StateTransition.Recruit, {
      from: Throne.instance().username,
      amount: amount
    }, callback)
  }
  getRecruitNeed(amount: number): number {
    return this.city.getRecruitNeed(amount)
  }

  getRecruitState(): {} {
    const time = parseInt(new Date().getTime() / 1000 + '');
    let re = {
      status: RecruitStatus.None,
      endtime: 0,
      amount: 0
    }
    if(this.city.state.recruit.length != 0){
      re.endtime = this.city.state.recruit[0].endtime
      re.amount = this.city.state.recruit[0].amount
      if(re.endtime >= time){
        re.status = RecruitStatus.Going
      }
      else{
        re.status = RecruitStatus.Ready
      }
    }
    return re
  }

  receiveTroop(callback: (result: any) => void): void {
    this.mediator.sendTransaction(StateTransition.ReceiveTroop, {
      from: Throne.instance().username
    }, callback)
  }

  onStateUpdate(callback: IStatetWithTransContextCallback): void {
    this.mediator.onReceiveState(
      this.cityStateId
      ,
      callback
    )
    this.listener.push(callback)
  }

  getRechargeConfigs(chainName): [] {
    return this.city.getRechargeConfigs(chainName) as []
  }

  getGold(): number {
    return this.city.state.gold
  }

  getTestResourceCoolDownTime(): number {
    return this.city.getTestResourceCoolDownTime()
  }

  addTestResource(callback: (res: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.AddTestResource, {
      from: Throne.instance().username
    }, callback)
  }

  getOfferList(): {} {
    let buyOfferRecords = this.city.state.buyOfferRecords;
    let all = this.city.getOfferList() as [];
    
    console.log('onBuyOffer getOfferList:', buyOfferRecords, all);

    return { buyOfferRecords, all };
  }

  buyOffer(offerId: number, callback: (res: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.BuyOffer, {
      from: Throne.instance().username,
      offerId: offerId
    }, callback)
  }

  onReceiveChat(channel: ChatChannel, callback: (chatData: ChatMessage) => void): void {
    this.mediator.listenChat(channel, callback)
  }

  async chat(data: { channel: ChatChannel; content: string }, callback: ( result: any ) => void): Promise<void> {
    let msg:ChatMessage = {
      id:  '',
      type: ChatType.ChatTypeText,
      channel: data.channel,
      content: data.content,
      sender: Throne.instance().username,
      seasonId: Throne.instance().seasonId,
      senderCamp: Throne.instance().logicEssential.general.state.unionId,
      iconId: Throne.instance().logicEssential.general.state.iconId,
      ts: getTimeStamp()
    }
    let re = await this.mediator.chat(msg)
    callback(re)
  }

  async getHistoryChatData(data: { unionId: number }, callback: (result: ChatMessage[]) => void): Promise<void> {
    let queryData = {}
    if(!data.unionId){
      queryData['camp'] = data.unionId = 1
    }
    else{
      queryData['camp'] = data.unionId
    }
    let re = await this.mediator.chatHistory(queryData)
    callback(re || [])
  }

  getAbleActivityInfo(index: number): any[] {
    this.activity.setChainIndex(index);
    let infolist = this.activity.getBeforeActivities()
    let re = []
    for(let item of infolist){
      let rank = this.activity.getActivityRank(item.activityId, parseStateId(this.cityStateId.id).username, this.city.getActivityData(item.activityId))
      let singleInfo = Object.assign(item, rank)
      singleInfo['redPoint'] = !this.activityHaveRead[item.activityId]
      re.push(singleInfo)
    }
    return re
  }


  donateSilver(activityId: number, amount: number, callback: (result: any) => void): void {
    this.mediator.sendTransaction(
      StateTransition.DonateSilver,
      {
        from: Throne.instance().username,
        activityId: activityId,
	      amount: amount
      },
      callback
    )
  }

  getGuideStep(type: string): number {
    return this.city.getGuideStep(type)
  }

  setGuideStep(type: string , step: number, callback: (result: any) => void): void {
    this.mediator.sendTransaction(
      StateTransition.SetGuideStep,
      {
        from :  Throne.instance().username,
        type : type,
        step : step,
      },
      callback
    )
  }

  getChatRedPoint(channel: ChatChannel): boolean {
    if( !this.chatRedPointInfo[channel] ||
      JSON.stringify(this.chatRedPointInfo[channel]) === '{}' )
    {
      return false
    }
    else if(
      this.chatReadInfo[channel]
      &&  JSON.stringify(this.chatReadInfo[channel]) !== '{}'
      && this.chatReadInfo[channel].ts == this.chatRedPointInfo[channel].ts
      && this.chatReadInfo[channel].id == this.chatRedPointInfo[channel].id )
    {
      return false
    }
    return true
  }

  updateChatRedPoint(channel: ChatChannel, msg: ChatMessage): void {
    let info = {
      id : msg.id,
      ts : msg.ts
    }
    this.chatReadInfo[channel] = info
    this.mediator.profileSave(this.chatProfileKey[channel], encodeChatProfile(msg.id, msg.ts))
  }

  async initRedPoint(): Promise<void> {
    console.log('Throne.instance()', Throne.instance())
    await this.getHistoryChatData({unionId: Throne.instance().unionId}, 
      (result)=>{
        if(result.length != 0){
          let worldInfo = {
            id: result[result.length - 1].id,
            ts: result[result.length - 1].ts
          }
          this.chatRedPointInfo[ChatChannel.ChatChannel_WORLD] = worldInfo
          for(let i = result.length - 1 ; i>=0 ; i--){
            if(result[i].senderCamp == Throne.instance().unionId){
              let unionInfo = {
                id: result[i].id,
                ts: result[i].ts
              }
              this.chatRedPointInfo[ChatChannel.ChatChannel_Camp] = unionInfo
            }
            break
          }

        }
      }
    )
    //read red point info from backend
    //for(let key in ChatChannel)
    let campProfile = await this.mediator.profileQuery(this.chatProfileKey[ChatChannel.ChatChannel_Camp])
    if(campProfile['code'] == 0){
      let campInfo = decodeChatProfile(campProfile['data'])
      this.chatReadInfo[ChatChannel.ChatChannel_Camp] = {
        id: campInfo.id,
        ts: campInfo.ts
      }
    }

    let worldProfile = await this.mediator.profileQuery(this.chatProfileKey[ChatChannel.ChatChannel_WORLD])
    if(worldProfile['code'] == 0){
      let worldInfo = decodeChatProfile(worldProfile['data'])
      this.chatReadInfo[ChatChannel.ChatChannel_WORLD] = {
        id: worldInfo.id,
        ts: worldInfo.ts
      }
    }

    this.mediator.listenChat(ChatChannel.ChatChannel_Camp , (msg)=>{
      this.chatRedPointInfo[ChatChannel.ChatChannel_Camp] = {
        id: msg.id,
        ts: msg.ts
      }
    })

    this.mediator.listenChat(ChatChannel.ChatChannel_WORLD , (msg)=>{
      this.chatRedPointInfo[ChatChannel.ChatChannel_WORLD] = {
        id: msg.id,
        ts: msg.ts
      }
    })
    for(let i= 0 ; i < this.activityHaveRead.length; i++){
      let activityInfo = await this.mediator.profileQuery(this.getActivityProfileKey(i))
      if(activityInfo['code'] == 0){
        this.activityHaveRead[i] = true;
      }
    }
  }

  readActivity(activityId: number): void {
    this.activityHaveRead[activityId] = true;
    this.mediator.profileSave(this.getActivityProfileKey(activityId), "1")
  }
}

export class GeneralComponent implements IGeneralComponent {
  type: ComponentType;
  general: General;
  mediator: IStateMediator<StateTransition, ITransContext>
  generalStateId: IStateIdentity
  battleRecordProfileKey : string
  battleRecordLocalTs: number // red point ts
  battleRecordGobalTs: number // red point ts
  recentWorldRecordTs: number

  constructor(myStateId: string, mediator: IStateMediator<StateTransition, ITransContext>) {
    this.generalStateId = {
      id: myStateId
    }
    this.type = ComponentType.General
    this.mediator = mediator
    this.battleRecordProfileKey = `profile-battleRecord`
    this.battleRecordLocalTs = 0
    this.battleRecordGobalTs = 0
    this.recentWorldRecordTs = 0
  }

  setGeneral(general : General){
    this.general = general
    this.mediator.onReceiveState(
      this.generalStateId
      ,
      ()=>{
        this.general.updateBoost()
      }
    )
  }

  async initRedPoint(): Promise<void> {
    let loaclInfo = await this.mediator.profileQuery(this.battleRecordProfileKey)
    if(loaclInfo['code'] == 0){
      this.battleRecordLocalTs = parseInt(loaclInfo['data'])
    } 
    setInterval(
      () => {
        this.getBattleRecords(()=>{})
      },
      10000
    )
  }

  getConstData(): {} {
    let re = {
      general_max_level: this.general.config.parameter.general_max_level,
      skill_max_level: this.general.config.parameter.general_skill_max_level
    }
    return re
  }

  getUserVipBuffs(username: string) {
    let userScore = this.general.getUserScore(username);
    let vipBuffs = this.general.getVipBuffs(userScore);
    return {
      address: username,
      accountRating: Math.floor(userScore*100)/100,
      vipBuffs: vipBuffs
    }
  }

  getGeneralQualification(id: number) {
    return this.general.getGeneralQualification(id)
  }

  getAbleStatus(): {} {
    let re = {
      able_count: 0,
      max_able_count: 0
    }
    re.max_able_count = this.general.city.getGeneralMaxAble()
    re.able_count = this.general.getAbleCount()
    return re
  }
  getGeneralList(): {} {
    let re = {}
    for (let idstring in this.general.state.generalList) {
      const generalInfo = this.general.state.generalList[idstring]
      const stamina = generalInfo.stamina;
      const id = parseInt(idstring)
      let temp = {
        id: id,
        qualification: {},
        level: 0,
        able: false,
        skilllevel: [1, 1, 1],
        stamina: 0,
        staminaTime: 0
      }
      temp.qualification = JSON.parse(JSON.stringify(this.getGeneralQualification(id)))
      temp.level = generalInfo.level
      temp.able = generalInfo.able
      temp.skilllevel = generalInfo.skill_levels.concat()
      temp.stamina = this.general.getGeneralStamina(id)
      temp.staminaTime =  stamina.lastUpdate;
      re[idstring] = temp
    }
    return re
  }

  ableGeneral(id: number, callback: (res: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.AbleGeneral, {
      from: Throne.instance().username,
      id: id
    }, callback)
  }

  disableGeneral(id: number, callback: (res: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.DisableGeneral, {
      from: Throne.instance().username,
      id: id
    }, callback)
  }

  upgradeGeneral(id: number, callback: (res: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.UpgradeGeneral, {
      from: Throne.instance().username,
      id: id
    }, callback)
  }

  onStateUpdate(callback: IStatetWithTransContextCallback): void {
    this.mediator.onReceiveState(
      this.generalStateId
      ,
      callback
    )
  }

  getSkillInfo(skillId: number): BuffGdsRow {
    return this.general.getSkillInfo(skillId)
  }

  checkUpgradeGeneral(id: number): boolean {
    return this.general.checkUpgradeGeneral(id)
  }

  getUpgradeGeneralNeed(id: number, level: number): number {
    return this.general.getGeneralUpgradeNeed(id, level)
  }

  getGeneralQuaValue(id: number, level: number): {} {
    let re = {}
    re['attack'] = this.general.getGeneralAbility(id, level, GeneralAbility.Attack)
    re['defense'] = this.general.getGeneralAbility(id, level, GeneralAbility.Defense)
    re['load'] = this.general.getGeneralAbility(id, level, GeneralAbility.Load)
    re['silver_product'] = this.general.getGeneralAbility(id, level, GeneralAbility.Silver)
    re['troop_product'] = this.general.getGeneralAbility(id, level, GeneralAbility.Troop)
    return re
  }

  getSkillUpgradeNeed(generalId: number, skillIndex: number, level: number): number {
    return this.general.getSkillUpdateNeed(generalId, skillIndex, level)
  }

  checkGeneralSkillUpgrade(generalId: number, skillIndex: number): boolean {
    return this.general.checkGeneralSkillUpgrade(generalId, skillIndex)
  }

  getGeneralSkillList(generalId: number): {} {
    //skill_id: number[],  skill_level : number[],  upgrade_need: number[] , value_type: number[], buff_value: number[], check_upgrade: boolean[]
    let re = {
      skill_id: [],
      skill_level: [],
      upgrade_need: [],
      value_type: [],
      value: [],
      check_upgrade: []
    }
    const generalInfo = this.general.getGeneralState(generalId)
    let qualification = JSON.parse(JSON.stringify(this.getGeneralQualification(generalId)))
    re.skill_id = qualification.general_skill.concat()
    re.skill_level = generalInfo.skill_levels.concat()
    let upgrade_need = new Array(re.skill_id.length).fill(0)
    let value_type = new Array(re.skill_id.length).fill(0)
    let value = new Array(re.skill_id.length).fill(0)
    let check_upgrade = new Array(re.skill_id.length).fill(false)
    for (let i = 0; i < re.skill_id.length; i++) {
      upgrade_need[i] = this.general.getSkillUpdateNeed(generalId, i, re.skill_level[i])
      let temp = this.general.getSkillValue(generalId, i, re.skill_level[i])
      value_type[i] = temp['value_type']
      value[i] = temp['value']
      check_upgrade[i] = this.general.checkGeneralSkillUpgrade(generalId, i)
    }
    re.upgrade_need = upgrade_need
    re.value_type = value_type
    re.value = value
    re.check_upgrade = check_upgrade
    return re
  }

  upgradeGeneralSkill(generalId: number, skillIndex: number, callback: (result: ITransResult) => void): void {
    this.mediator.sendTransaction(StateTransition.UpgradeGeneralSkill, {
      from: Throne.instance().username,
      generalId: generalId,
      skillIndex: skillIndex
    }, callback)
  }

  setDefenseGeneral(generalId: number, callback: (result: any) => void): void {
    this.mediator.sendTransaction(StateTransition.SetDefenseGeneral,{
      from: Throne.instance().username,
      generalId: generalId
    }, callback)
  }

  getDefenseGeneralId(): number {
    return this.general.state.defense_general
  }

  getGeneralBattleInfo(generalId: number): {} {
    return this.general.getGeneralBattleStatus(generalId)
  }

  async getAllBattleStatuses( callback: (result: any) => void ) {
    let re = await this.mediator.query( StateName.DefenderInfo, {'$orderBy': '-silver'})
    callback(re ?? [])
  }
  async getBattleStatuses( username: string, callback: (result: any) => void ) {
    let re = []
    if(username == ''){
      re = await this.mediator.query( StateName.DefenderInfo, {'$orderBy': '-silver'})
    }
    else{
      re = await this.mediator.query( StateName.DefenderInfo, {username : username})
    }
    re = re ?? [];

    let list = [];
    re.forEach(function(item){
      list.push({
        id: item.id,
        username: item.username,
        unionId: item.unionId,
        player: item.player,
        isProtected: item.isProtected,
        statuses: item
      });
    });
    callback(list)
  }

  async spyEnamy( username: string, generalId: number, callback: (result: any) => void ) {
    let _this = this;
    let res = await this.mediator.query( StateName.DefenderInfo, {username : username});
    let _enamy = (res || [])[0] || {};
    if(_enamy.isProtected){
      callback({
        result: false,
        err: 'Player not exist or under protect',
        data: res || []
      });
      return;
    }
    this.mediator.sendTransaction(StateTransition.SpyEnamy, {
      from: Throne.instance().username,
      generalId: generalId,
      username: username
    }, async function(res){
      if(res.result){
        let data = await _this.mediator.query( StateName.DefenderInfo, {username : username});
        res.data = data || [];
        callback(res);
      }else{
        callback(res);
      }
    })
  }

  getCodCreatorDetail(codId: string,callback: (result: any) => void ) {
    this.mediator.sendTransaction(StateTransition.CodCreatorDetail, {
      from: Throne.instance().username,
      codId: codId,
    }, async function(res){
      callback(res);
    })
  }

  getCodGeneralIds() {
    return this.general.getCodGeneralIds('');
  }

  clearCodGeneralIds(){
    for(var i=0;i<20;i++){
      console.log('clearCodGeneralIds', i);
      this.general.opCodGeneralId(i, 'release', {});
    }
  }

  async getCodList() {
    let codsGlobal = (await this.mediator.queryState({ id: `${StateName.GlobalCod}` }, {}, null)) as any
    console.log('cod codsGlobal getCodList:', codsGlobal);
    return this.general.getCodList();
  }
  createCod(blockInfo:any, generalId: number, callback: (result: any) => void ) {
    this.mediator.sendTransaction(StateTransition.CreateCod,{
      from: Throne.instance().username,
      blockInfo: blockInfo,
      generalId: generalId
    }, callback)
  }
  cancelCod(codId: string, callback: (result: any) => void ) {
    this.mediator.sendTransaction(StateTransition.CancelCod,{
      from: Throne.instance().username,
      codId: codId
    }, callback)
  }
  joinCod(codId: string, generalId: number, callback: (result: any) => void ) {
    this.mediator.sendTransaction(StateTransition.JoinCod,{
      from: Throne.instance().username,
      codId: codId,
      generalId: generalId
    }, callback)
  }
  quitCod(codId: string, callback: (result: any) => void ) {
    this.mediator.sendTransaction(StateTransition.QuitCod,{
      from: Throne.instance().username,
      codId: codId
    }, callback)
  }

  async getGloryAndRank( callback: (result: any) => void ): Promise<void> {
    let rank = -1
    rank = await this.mediator.defaultQuery( MessageType.QueryCount, StateName.DefenderInfo, {"glory":{"$gt":  this.general.state.glory}})
    let re = {
      glory: this.general.state.glory,
      rank: rank + 1
    }
    callback(re)
  }

  battle(generalId: number,name: string, callback: (result: any) => void): void {
    this.mediator.sendTransaction(StateTransition.Battle,{
      from: Throne.instance().username,
      generalId: generalId,
      name: name
    }, callback)
  }

  async getBattleRecords( callback: (result: any) => void ) {
    let re = (await this.mediator.query(TransitionEventType.Battles,
      {
      "$or":[ {"attackInfo.username" : Throne.instance().username},{"defenseInfo.username" : Throne.instance().username} ]
      ,'$orderBy' : '-timestamp'
      })) as BattleTransRecord[]
    console.log('getBattleRecords', re);
    let trans = []
    for(let record of re ?? [] ){
      trans.push(this.general.transferTransRecord(record))
    }
    callback(trans)
    if(trans.length != 0){
      this.battleRecordGobalTs = (trans[0] as BattleRecord).timestamp
      await this.mediator.profileSave(this.battleRecordProfileKey, this.battleRecordGobalTs + '')
    }
  }

  async getRecentWorldBattleRecords(callback: (result: BattleTransRecord[]) => void) {
    //for test
    // if(this.recentWorldRecordTs == 0){
    //   let re = GetTestBattleTransRecord()
    //   this.recentWorldRecordTs = re[0].timestamp
    //   callback(re)
    // }
    // end test
    let lastTime = this.recentWorldRecordTs == 0 ? getTimeStamp() - 180 : this.recentWorldRecordTs
    let re = (await this.mediator.query(TransitionEventType.Battles,
      {
      "timestamp": {"$gt" : lastTime} 
      ,'$orderBy' : '-timestamp'
      })) as BattleTransRecord[]
    if(re){
      this.recentWorldRecordTs = re[0].timestamp
    }
    callback(re ?? []) 
  }

  getDefenseBlockGenerals(): [] {
    return copyObj(this.general.state.defenseBlockList) as []
  }

  getIconId(): number {
    return this.general.getIconId()
  }

  setIconId(iconId: number, callback: (result: any) => void){
    this.mediator.sendTransaction(StateTransition.SetIconId,{
      from: Throne.instance().username,
      iconId: iconId
    }, callback)
  }

  getMorale(): number {
    return this.general.getMorale()
  }

  getRecoverMoraleInfo() {
    return this.general.getRecoverMoraleInfo()
  }

  getMoraleBuff() {
    let percent = this.general.getMoralePercent()
    let re = {}
    re['attack'] = 1 + percent
    re['defense'] = 1 + percent
    re['load'] = 1 + percent
    re['silver_product'] = 1 + percent
    re['troop_product'] = 1 + percent
    return re
  }

  recoverMorale(resourceType: RecoverMoraleType, callback: (result: any) => void): void {
    this.mediator.sendTransaction(StateTransition.RecoverMorale,{
      from: Throne.instance().username,
      resourceType: resourceType
    }, callback)
  }

  getAttackTroop(): number {
    return this.general.getMaxAttackTroop()
  }

  getDefenseTroop(): number {
    return this.general.getMaxDefenseTroop()
  }

  getBattleRecordRedPoint(): boolean {
    if(this.battleRecordLocalTs != this.battleRecordGobalTs){
      return true
    }
    return false
  }

  
  updateBattleRedPoint(timestamp: number): void {
    this.mediator.profileSave(this.battleRecordProfileKey, timestamp + '')
    this.battleRecordLocalTs = timestamp
  }

}

export enum ComponentType {
  City = 1,
  General = 2,
  Map = 3,
  Strategy = 4,
  User = 5,
  Chain = 6
}

export interface IThrone {
  initComponent<T extends IComponent>(
    typ: ComponentType,
    callback: (component: T) => void
  ): void;
}

export enum InstanceStatus{
  Null,
  Loading,
  Ready
}

export class Throne implements IThrone {
  //singleton
  static throne: Throne;
  static instance() {
    if (!Throne.throne) {
      Throne.throne = new Throne();
    }
    return this.throne;
  }
  mediator: IStateMediator<StateTransition, ITransContext>
  inited: boolean
  instanceState: InstanceStatus
  components: { [key in ComponentType]?: IComponent } = {};
  logicEssential: LogicEssential
  username : string
  unionId: number
  wsUrl : string
  version: string
  seasonId: string

  constructor() {
    this.inited = false
    this.instanceState = InstanceStatus.Null
    this.version = "u37"
  }


  async init( obj : {}, callback: (result: any) => void = ()=>{}) {
    if(this.instanceState == InstanceStatus.Null){
      this.instanceState = InstanceStatus.Loading
    }else if(this.instanceState  == InstanceStatus.Loading){
      return {
        result: false,
        error: "throne-have-not-finish-init"
      }
    }else{
      return{
        result: true
      }
    }
    const states: StateEssential = {} as StateEssential;
    const statesTest: StateEssential = {} as StateEssential;
    this.username = obj['username'] ? obj['username'] : 'test';
    this.seasonId = obj['seasonId'];
    this.unionId = obj['unionId'] ?  obj['unionId'] : 0
    this.wsUrl = obj["wsurl"] ? obj["wsurl"] : `ws://test.leagueofthrones.com/ws/${this.username}`
    if(this.wsUrl && this.username!='test'){
      const wsmediator = new WebSocketMediator(this.wsUrl, obj)
      if(obj['wsCloseCallback']){
        wsmediator.setWsCloseCallback(obj['wsCloseCallback'])
      }
      await wsmediator.init()
      this.mediator = wsmediator
    }else{
      let mapId = InitState[StateName.SeasonConfig].mapId;
      this.mediator = new LocalMediator([this.username, 'test1'], mapId)
      if(obj['unionId']){
        InitState[StateName.General].unionId = obj['unionId']
      }
    }
    let serverTimeStamp = ( await this.mediator.query(TransitionEventType.TimeStamp, {})) as number
    setTimeOffset(serverTimeStamp - getTimeStamp(0))
    // init essensial states

    states.username =  'index:' + this.username;
    states.city = (await this.mediator.queryState({ id: `${StateName.City}:${this.username}` }, {}, null)) as ICityState
    states.general = (await this.mediator.queryState({ id: `${StateName.General}:${this.username}` }, {}, null)) as IGeneralState
    states.strategy = (await this.mediator.queryState({ id: `${StateName.Strategy}:${this.username}` }, {}, null)) as IStrategyState

    // await Promise.all([
    //   async () => {
    //     states.city = (await this.mediator.queryState({ id: `${StateName.City}:${this.username}` }, {}, null)) as ICityState
    //   },
    //   async () => {
    //     states.general = (await this.mediator.queryState({ id: `${StateName.General}:${this.username}` }, {}, null)) as IGeneralState
    //   },
    //   async () => {
    //     states.strategy = (await this.mediator.queryState({ id: `${StateName.Strategy}:${this.username}` }, {}, null)) as IStrategyState
    //   },
    // ])

    states.blocks = []

    states.activityState = (await this.mediator.queryState({ id: `${StateName.Activity}` }, {}, null)) as IActivityState
    states.mapGlobal = (await this.mediator.queryState({ id: `${StateName.MapGlobalInfo}` }, {}, null)) as IMapGlobalState
    states.seasonState = (await this.mediator.queryState({ id: `${StateName.SeasonConfig}` }, {}, null)) as ISeasonConfigState
    states.rewardGlobalState = (await this.mediator.queryState({ id: `${StateName.RewardGloablState}` }, {}, null)) as IRewardGlobalState
    states.tokenPriceInfo = (await this.mediator.queryState({ id: `${StateName.TokenPriceInfo}` }, {}, null)) as ITokenPriceInfoState
    states.codsGlobal = (await this.mediator.queryState({ id: `${StateName.GlobalCod}` }, {}, null)) as any
    
    this.logicEssential = createLogicEsential(states)

    this.inited = true
    this.instanceState = InstanceStatus.Ready
    if(this.unionId != 0){
      this.mediator.sendTransaction(StateTransition.SetUnionId,{
        from: this.username,
        unionId: this.unionId,
        force: false
      }, callback)
    }else{
      let mapId = InitState[StateName.SeasonConfig].mapId;
      callback({
        result: {
          result: true,
          unionId: states.general.unionId,
          mapId: mapId,
          username: this.username
        }
      })
      this.unionId = states.general.unionId
    }
    if( this.logicEssential.city.state.firstLogin == -1 ){
      this.mediator.sendTransaction(StateTransition.FirstLogin,{
        from: this.username,
      }, ()=>{})
    }
    this.components[ComponentType.Chain] = new ChainComponent(this.mediator)
  }

  async initComponent<T extends IComponent>(
    typ: ComponentType,
    callback: (component: T ) => void
  ) {
    let initRe =  await this.init({})
    this.inited = true
    if(!initRe['result'])
    {
      throw initRe['error']
    }
    if (typ == ComponentType.City) {
      this.components[ComponentType.City] = new CityComponent(`${StateName.City}:${this.username}`, this.mediator)
      let cityCom = this.components[ComponentType.City] as CityComponent
      cityCom.setCity(this.logicEssential.city)
      cityCom.setActivity(this.logicEssential.activity)
      await cityCom.initRedPoint()
      callback(cityCom as any as T)
    } else if (typ == ComponentType.General) {
      this.components[ComponentType.General] = new GeneralComponent(`${StateName.General}:${this.username}`, this.mediator)
      let generalCom = this.components[ComponentType.General] as GeneralComponent
      generalCom.setGeneral(this.logicEssential.general)
      await generalCom.initRedPoint()
      callback(generalCom as any as T)
    } else if(typ == ComponentType.Map){
      this.components[ComponentType.Map] = new MapComponent(this.mediator)
      let mapCom = this.components[ComponentType.Map] as MapComponent
      mapCom.setMap(this.logicEssential.map)
      callback(mapCom as any as T)
    } else if(typ == ComponentType.Strategy){
      this.components[ComponentType.Strategy] = new StrategyComponent(this.mediator)
      let strategyCom = this.components[ComponentType.Strategy] as StrategyComponent
      strategyCom.setStrategy(this.logicEssential.strategy)
      callback(strategyCom as any as T)
    } else if(typ == ComponentType.Chain){
      callback(this.components[ComponentType.Chain] as any as T)
    }
  }
}

function example() {
  Throne.instance().initComponent(
    ComponentType.City,
    (city: ICityComponent) => {
      console.log('City init');

      // bind button with action
      // button.onClick = () =>{
      //city.doUpgradeFacility()

      //      console.log(city.getAllUpgradeInfo(CityFacility.Home))

      // watch state update
      city.onStateUpdate((state) => {
        // regenerate  ui state
        const facilities = city.getFacilityList();
        const resource = city.getResource();
        const uiState = { facilities, resource };
        console.log("receive state", uiState)
        // rerender by new state
      });
      //update
    }
  );
  Throne.instance().initComponent(
    ComponentType.General,
    ((general: IGeneralComponent) => {
      general.onStateUpdate((state) => {
        console.log("general", state)
      })
    }
    )
  )
  Throne.instance()[ComponentType.City].doUpgradeFacility()
}
