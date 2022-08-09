import { General, GeneralConfig } from "./general";
import { City, CityConfig } from "./game";
import { IBlockState, ICityState, IGeneralState, IMapGlobalState } from "../State";
import { Boost, IBoost } from "./boost";
import { ResouceType, StateName } from "../Const";
import { Map } from "./map";

export interface LogicEssential {
	city: City
	general: General
	map: Map
	boost: IBoost
}
export interface StateEssential {
	city: ICityState
	general: IGeneralState
	mapGlobal: IMapGlobalState
	blocks: {[key: string]: IBlockState}
}
export interface ConfigEssential {
	cityConf: CityConfig
	generalConf: GeneralConfig
}


export function createLogicEsential(states: StateEssential): LogicEssential {
	var boost: IBoost = new Boost()
	var city: City = new City(states.city)
	var general: General = new General(states.general, city)
	var map: Map = new Map(states.mapGlobal, states.blocks)
	city.setBoost(boost)
	general.setBoost(boost)
	map.setGeneral(general)
	boost.setProduction(StateName.City, ResouceType.Silver, city.calculatePoduction(ResouceType.Silver))
	boost.setProduction(StateName.City, ResouceType.Troop, city.calculatePoduction(ResouceType.Troop))
	boost.setProduction(StateName.General, ResouceType.Silver, general.getGeneralProduction(ResouceType.Silver))
	boost.setProduction(StateName.General, ResouceType.Troop, general.getGeneralProduction(ResouceType.Troop))
	//city.SetBoost(boost)
	//general.SetBoost(boost)
	//boost.recalulate() 

	return { city, general, map, boost }
}