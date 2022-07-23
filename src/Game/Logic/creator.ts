import { General, GeneralConfig } from "./general";
import { City, CityConfig } from "./game";
import { ICityState, IGeneralState } from "../State";
import { Boost, IBoost } from "./boost";
import { ResouceType, StateName } from "../Const";

export interface LogicEssential {
	city: City
	general: General
	boost: IBoost
}
export interface StateEssential {
	city: ICityState
	general: IGeneralState
}
export interface ConfigEssential {
	cityConf: CityConfig
	generalConf: GeneralConfig
}


export function createLogicEsential(states: StateEssential): LogicEssential {
	var boost: IBoost = new Boost()
	var city: City = new City(states.city)
	var general: General = new General(states.general, city)
	city.setBoost(boost)
	general.setBoost(boost)
	boost.setProduction(StateName.City, ResouceType.Silver, city.calculatePoduction(ResouceType.Silver))
	boost.setProduction(StateName.City, ResouceType.Troop, city.calculatePoduction(ResouceType.Troop))
	boost.setProduction(StateName.General, ResouceType.Silver, general.getGeneralProduction(ResouceType.Silver))
	boost.setProduction(StateName.General, ResouceType.Troop, general.getGeneralProduction(ResouceType.Troop))
	//city.SetBoost(boost)
	//general.SetBoost(boost)
	//boost.recalulate() 

	return { city, general, boost }
}