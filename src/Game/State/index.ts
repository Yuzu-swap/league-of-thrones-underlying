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
  lastAddTestTime: number
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

export interface GeneralInfo{
  id: number
  level: number
  able: boolean
  skill_levels: number[]
  stamina: GeneralStamina
}

export interface IGeneralState extends IState{
  id: string;
  defense_general: number
  defenseBlockList: GeneralDefenseBlock[]
  generalList: {[key : string ]: GeneralInfo}
  unionId: number
  glory: number
}

export interface IDefenderInfoState extends IState{
  id: string;
  username: string;
  generalId:number
  generalLevel: number
  generalType: number
  attack: number
  defense: number
  silver: number
  troop: number
  defenseMaxTroop: number
  unionId: number
  glory: number
  fortressLevel: number
}


export interface IMapGlobalState extends IState{
  id: string
  campInfo: number[][]
  campMembers: string[][]
  updateTime: number[]
  unionWinId: number
  seasonEnd: boolean
}

export interface GloryInfo{
  username : string
  glory: number
  unionId: number
}

export interface RewardResult extends GloryInfo{
  count: number
}

export interface IRewardGlobalState extends IState{
  id: string
  unionGloryRankInfo: GloryInfo[][]
  globalGloryRankInfo: GloryInfo[]
  contractAddressInput: string[]
  contractGloryInput: number[]
  unionGlorySum: number
  unionWinId: number
  seasonEnd: boolean
  unionRewardResult: RewardResult[]
  gloryRewardResult: RewardResult[]
}

export interface ISeasonConfigState extends IState{
  id: string
  haveSet : boolean
  season_reservation: number,
  season_ready : number,
  season_open : number,
  season_end : number,
  rankConfigFromTo: number[],
  rankConfigValue: number[],
  unionRewardValue: number,
  rankRewardValue: number
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


