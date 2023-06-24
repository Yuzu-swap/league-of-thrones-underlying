import { General, GeneralConfig } from "./general";
import { City, CityConfig } from "./game";
import { IActivityState, IBlockState, ICityState, IGeneralState, IMapGlobalState, IRewardGlobalState, ISeasonConfigState, ITokenPriceInfoState, IStrategyState } from "../State";
import { Boost, IBoost } from "./boost";
import { ResouceType, StateName } from "../Const";
import { Map } from "./map";
import { Strategy } from "./strategy";
import { Activity } from "./activity";

export interface LogicEssential {
	city: City
	general: General
	map: Map
	activity: Activity
	strategy: Strategy
	boost: IBoost
}
export interface GlobalLogicEssential{
	map: Map
	activity: Activity
}
export interface StateEssential {
	city: ICityState
	general: IGeneralState
	mapGlobal: IMapGlobalState
	seasonState: ISeasonConfigState
	rewardGlobalState: IRewardGlobalState
	activityState : IActivityState
	blocks: IBlockState[]
	strategy: IStrategyState
	tokenPriceInfo: ITokenPriceInfoState
}
export interface ConfigEssential {
	cityConf: CityConfig
	generalConf: GeneralConfig
}

export interface GlobalStateEssential{
	mapGlobal: IMapGlobalState
	seasonState: ISeasonConfigState
	rewardGlobalState: IRewardGlobalState
	activityState : IActivityState
	blocks: IBlockState[]
	tokenPriceInfo: ITokenPriceInfoState
}


export function createLogicEsential(states: StateEssential): LogicEssential {
	var boost: IBoost = new Boost()
	var city: City = new City(states.city)
	var general: General = new General(states.general, city)
	var map: Map = new Map(states.mapGlobal, states.seasonState, states.rewardGlobalState, states.tokenPriceInfo)
	var strategy: Strategy = new Strategy(states.strategy)
	var activity: Activity = new Activity(states.activityState)
	city.setBoost(boost)
	general.setBoost(boost)
	map.setBoost(boost)
	map.setGeneral(general)
	map.loadBlockStates(states.blocks)
	strategy.setBoost(boost)
	strategy.setLogic(city, map, general)
	boost.setTroop(city.getResource(ResouceType.Troop), city.getMaintainNeedTroop())
	boost.setMapBuff(map.getBuffList(states.general.unionId))
	boost.setProduction(StateName.City, ResouceType.Silver, city.calculatePoduction(ResouceType.Silver))
	boost.setProduction(StateName.City, ResouceType.Troop, city.calculatePoduction(ResouceType.Troop))
	boost.setProduction(StateName.General, ResouceType.Silver, general.getGeneralProduction(ResouceType.Silver))
	boost.setProduction(StateName.General, ResouceType.Troop, general.getGeneralProduction(ResouceType.Troop))
	strategy.updateBoost()
	activity.setCity(city)
	activity.setMap(map)
	activity.setBoost(boost)
	//city.SetBoost(boost)
	//general.SetBoost(boost)
	//boost.recalulate() 

	return { city, general, map, strategy ,boost, activity }
}

export function createGlobalEsential(gStates: GlobalStateEssential) : GlobalLogicEssential{
	var map: Map = new Map(gStates.mapGlobal, gStates.seasonState, gStates.rewardGlobalState, gStates.tokenPriceInfo)
	map.loadBlockStates(gStates.blocks)

	var activity: Activity = new Activity(gStates.activityState)

	return { map , activity}
}