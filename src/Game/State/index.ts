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

export interface IGeneralState extends IState{
  id: string;
  levels: number[]
  able: boolean[]
  skill_levels: number[][]
}


export * from  "./initstate"


