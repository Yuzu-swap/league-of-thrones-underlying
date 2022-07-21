import { General, GeneralConfig } from "./general";
import { City, CityConfig } from "./game";
import { ICityState, IGeneralState } from "../State";
import { Boost } from "./boost";

export interface LogicEssential {
	city: City
	general: General
	boost: Boost
}
export interface StateEssential {
	city: ICityState
	general: IGeneralState
}
export interface ConfigEssential {
	cityConf: CityConfig
	generalConf: GeneralConfig
}


export function createLogicEsential(states: StateEssential, configs: ConfigEssential): LogicEssential {
	var boost: Boost = {} as Boost
	var city: City = new City(states.city, configs.cityConf)
	var general: General = new General(states.general, configs.generalConf, city)
	//city.SetBoost(boost)
	//general.SetBoost(boost)
	//boost.recalulate() 

	return { city, general, boost }
}