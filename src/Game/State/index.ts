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

export interface GeneralDefenseBlock{
  generalId: number
  x_id: number
  y_id: number
}

export interface IGeneralState extends IState{
  id: string;
  levels: number[]
  able: boolean[]
  skill_levels: number[][]
  defense_general: number
  stamina: GeneralStamina[]
  defenseBlockList: GeneralDefenseBlock[]
  unionId: number
  glory: number
}

export interface IDefenderInfoState extends IState{
  id: string;
  generalId:number
  generalLevel: number
  generalType: number
  attack: number
  defense: number
  silver: number
  troop: number
  unionId: number
  glory: number
}

export interface IMapGlobalState extends IState{
  id: string
  campInfo: number[][]
  campMembers: string[][]
  updateTime: number[]
}

export interface BelongInfo{
  unionId: number,
  updateTime: number
}

export interface BlockDefenseInfo{
  username: string
  generalId: number
  generalType: number
  generalLevel: number
  attack: number
  defense: number
  troops: number
}

export interface IBlockState extends IState{
  id: string
  x_id: number
  y_id: number
  belong: BelongInfo
  durability: number
  defaultDefense: BlockDefenseInfo[]
  defenseList: BlockDefenseInfo[]
  lastAttachTime: number
}

export * from  "./initstate"


