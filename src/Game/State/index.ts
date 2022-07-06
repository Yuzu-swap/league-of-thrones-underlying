import { CityFacility, ResouceType, StateName } from '../Const';
import { IState } from '../../Core/state';

export interface ResouceInfo {
  lastUpdate: number;
  value: number;
  production: number;
}

export interface ICityState extends IState {
  id: string;
  facilities: { [key in CityFacility]?: number };
  resources: { [key in ResouceType]?: ResouceInfo };
  troops: number;
}

export var InitState = {
  [StateName.City]: {
    facilities: { [CityFacility.Center]: 1 },
    resources: {},
    troops: 100
  }
};
