import { CityFacility, ResouceType } from "../Const";
import {IState} from "../../Core/state";

export interface ResouceInfo {
	lastUpdate: number;
	value: number;
	production: number;
}

export interface ICityState  extends IState {
	id: string
	facilities: { [key in CityFacility]?: number };
	resources: { [key in ResouceType]?: ResouceInfo };
	troops: number;
}