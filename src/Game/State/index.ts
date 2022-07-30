import { CityFacility, ResouceType, StateName } from '../Const';
import { IState } from '../../Core/state';

export interface ResouceInfo {
  lastUpdate: number;
  value: number;
}

export interface Recruit{
  amount: number;
  endtime: number;
}

export interface ICityState extends IState {
  id: string;
  facilities: { [key in CityFacility]?: number[] };
  resources: { [key in ResouceType]?: ResouceInfo };
  recruit: Recruit[]
}

export interface GeneralStamina{
  value: number
  lastUpdate: number
}

export interface IGeneralState extends IState{
  id: string;
  levels: number[]
  able: boolean[]
  skill_levels: number[][]
  defense_general: number
  stamina: GeneralStamina[]
}


export * from  "./initstate"


