import { CityFacility, ResouceType, StateName } from '../Const';
import { IState } from '../../Core/state';

export interface ResouceInfo {
  lastUpdate: number;
  value: number;
  production: number;
}

export interface ICityState extends IState {
  id: string;
  facilities: { [key in CityFacility]?: number[] };
  resources: { [key in ResouceType]?: ResouceInfo };
}

export var InitState = {
  [StateName.City]: {
    facilities: { },
    resources: {
		[ResouceType.Silver]:
		{
			lastUpdate: -1,
			value: 1000000,
			production: 0
		},
		[ResouceType.Troop]:
		{
			lastUpdate: -1,
			value: 0,
			production: 0
		}
	},
  }
};