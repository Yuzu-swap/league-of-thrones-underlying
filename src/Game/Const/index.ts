import {createCheckers} from "ts-interface-checker";
import IndexTI from "./index-ti"

export enum StateName {
	City = "city",
	General = "general" ,
	DefenderInfo = "defenderinfo",
	MapGlobalInfo = 'mapglobalinfo',
	BlockInfo = 'blockinfo',
	SeasonConfig = 'seasonconfig',
	RewardGloablState = 'rewardglobalstate',
	Strategy = 'strategy',
	Activity = 'activity'
}

export enum CityFacility {
	Fortress = 'fortress',
	MilitaryCenter = 'militarycenter',
	Wall = 'wall',
	Store = 'store',
	InfantryCamp = 'infantrycamp',
	CavalryCamp = 'cavalrycamp',
	ArcherCamp = 'archercamp',
	TrainingCenter = 'trainingcenter',
	Home = 'home',
	Hospital = 'hospital'
}

export enum ResouceType {
	Silver = 'silver',
	Troop = 'troop'
}

export const MaxSize = 21;
export const mapIdOffset = 10;
export const MaxStrategyPoint = 12

export enum StateTransition {
	UpgradeFacility = 1,
	Recruit = 2,
	ExcuteStrategy = 3,
	HireGeneral = 4,
	EnhanceGeneral = 5,
	AttackEnemy = 6,
	MarchToPos = 7,
	AbleGeneral,
	DisableGeneral,
	UpgradeGeneral,
	UpgradeGeneralSkill,
	SetDefenseGeneral,
	ReceiveTroop,
	Battle,
	DefenseBlock,
	AttackBlock,
	CancelDefenseBlock,
	SetUnionId,
	SetUnionWin,
	SetSeasonEnd,
	StartSeason,
	SetIconId,
	Recharge,
	AddTestResource,
	RecoverMorale,
	BuyStrategyPoint,
	StrategyBuySilver,
	StrategyBuyTroop,
	StrategyBuyMorale,
	StrategyBuyProtect,
	StrategyBuyStore,
	MiningBlock,
	InitUserStates,
	InitGlobalStates,
	DonateSilver,
	RegularTask,
	SetGuideStep,
	FirstLogin,
	StrategyBuyProtect1,
	FinishOutChainUserActivity
}

export function StringifyTxType() {
	let re = []
	for(let key of Object.getOwnPropertyNames(StateTransition)){
		if(isNaN(key as any)){
			re.push(
				{
					str: key,
					num: StateTransition[key]
				}
			)
		}
	}
	return re
}

export interface StateTransitionArgs {
	from: string
}
export interface UpgradeFacilityArgs extends StateTransitionArgs {
	typ: CityFacility
	index: number
}

export interface RecruitArgs extends StateTransitionArgs{
	amount: number
}

export interface AbleGeneralArgs extends StateTransitionArgs{
	id: number
}

export interface DisableGeneralArgs extends StateTransitionArgs{
	id: number
}

export interface UpgradeGeneralArgs extends StateTransitionArgs{
	id: number
}

export interface UpgradeGeneralSkillArgs extends StateTransitionArgs{
	generalId: number
	skillIndex: number
}

export interface SetDefenseGeneralArgs extends StateTransitionArgs{
	generalId: number
}

export interface ReceiveTroopArgs extends StateTransitionArgs{

}

export interface BattleArgs extends StateTransitionArgs{
	generalId: number
	name: string
}

export interface AttackBlockArgs extends StateTransitionArgs{
	x_id: number
	y_id: number
	generalId: number
}

export interface SetUnionIdArgs extends StateTransitionArgs{
	union_id: number
	force: boolean
	random_union:boolean
	general_ids: number[]
}

export interface SetUnionWinArgs extends StateTransitionArgs{
	unionId: number
}

export interface SetSeasonEndArgs extends StateTransitionArgs{

}

export interface StartSeasonArgs extends StateTransitionArgs{
	applies:{}
	season:{
		apply_ts: number,
		prepare_ts : number,
		start_ts : number,
		end_ts : number,
		reward_amount_1: number
        reward_amount_2: number
		rank_config_fromto: number[],
        rank_config_value: number[],
	}
}

export interface SetIconIdArgs extends StateTransitionArgs{
	iconId: number
}

export interface RechargeArgs extends StateTransitionArgs{
	username: string,
	rechargeId: number
	amount: number
}

export enum RecoverMoraleType{
    Silver = 'silver',
    Gold = 'gold'
}


export interface RecoverMoraleArgs extends StateTransitionArgs{
	resourceType: RecoverMoraleType
}

export interface BuyStrategyPointArgs extends StateTransitionArgs{
	amount: number
}

export interface InitUserStatesArgs extends StateTransitionArgs{
	username: string
}

export interface DonateSilverArgs extends StateTransitionArgs{
	activityId: number
	amount: number
}

export interface GuideStepArgs extends StateTransitionArgs{
	type: string
	step: number
}

export interface OutChainUserActivityArgs extends StateTransitionArgs{
	username: string
	type: string
	action: string
}

export enum ChatType {
	ChatTypeText                  = 1,
	ChatTypePos                   = 2,
	ChatTypeSystem_OccupiedTile   = 3,
	ChatTypeSystem_OccupiedCenter  =4,
}

export enum ChatChannel {
	ChatChannel_WORLD  = 1,
	ChatChannel_Camp   = 2,
}

export enum ChatTransId {
	SendChat = 'send',
	HistoryData = 'query'
}

export enum ProfileTransId {
	Save = 'save',
	Query = 'query'
}

export interface ChatMessage {
	id: string
	type: ChatType
	channel: ChatChannel
	content: string
	sender: string
	senderCamp:number
	iconId: number
	ts :number
}



const checkMapFactory = createCheckers(IndexTI)

export const checkerMapForTxArgsTypeMap : {[key in StateTransition]?: any } = 
{
	[StateTransition.UpgradeFacility] : checkMapFactory.UpgradeFacilityArgs,
	[StateTransition.Recruit]: checkMapFactory.RecruitArgs,
	[StateTransition.AbleGeneral]: checkMapFactory.AbleGeneralArgs,
	[StateTransition.UpgradeGeneral]: checkMapFactory.UpgradeGeneralArgs,
	[StateTransition.UpgradeGeneralSkill]: checkMapFactory.UpgradeGeneralSkillArgs,
	[StateTransition.SetDefenseGeneral]: checkMapFactory.SetDefenseGeneralArgs,
	[StateTransition.ReceiveTroop]: checkMapFactory.ReceiveTroopArgs,
	[StateTransition.Battle]: checkMapFactory.BattleArgs,
	[StateTransition.AttackBlock]: checkMapFactory.AttackBlockArgs,
	[StateTransition.DefenseBlock]: checkMapFactory.AttackBlockArgs,
	[StateTransition.MiningBlock]: checkMapFactory.AttackBlockArgs,
	[StateTransition.CancelDefenseBlock]: checkMapFactory.AttackBlockArgs,
	[StateTransition.SetUnionId]: checkMapFactory.SetUnionIdArgs,
	[StateTransition.SetIconId]: checkMapFactory.SetIconIdArgs,
	[StateTransition.AddTestResource]: checkMapFactory.StateTransitionArgs,
	[StateTransition.RecoverMorale]: checkMapFactory.RecoverMoraleArgs,
	[StateTransition.BuyStrategyPoint]: checkMapFactory.BuyStrategyPointArgs,
	[StateTransition.StrategyBuyMorale]:  checkMapFactory.StateTransitionArgs,
	[StateTransition.StrategyBuyProtect]:  checkMapFactory.StateTransitionArgs,
	[StateTransition.StrategyBuyProtect1]:  checkMapFactory.StateTransitionArgs,
	[StateTransition.StrategyBuySilver]:  checkMapFactory.StateTransitionArgs,
	[StateTransition.StrategyBuyStore]:  checkMapFactory.StateTransitionArgs,
	[StateTransition.StrategyBuyTroop]:  checkMapFactory.StateTransitionArgs,
	[StateTransition.SetGuideStep]: checkMapFactory.GuideStepArgs,
	[StateTransition.InitUserStates]: checkMapFactory.InitUserStatesArgs,
	[StateTransition.DonateSilver]: checkMapFactory.DonateSilverArgs,
	[StateTransition.SetUnionWin]: checkMapFactory.SetUnionWinArgs,
	[StateTransition.SetSeasonEnd]: checkMapFactory.SetSeasonEndArgs,
	[StateTransition.StartSeason]: checkMapFactory.StartSeasonArgs,
	[StateTransition.Recharge]: checkMapFactory.RechargeArgs,
}
