import fortressGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/fortress.json');
import militaryCenterGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/militarycenter.json');
import wallGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/wall.json');
import storeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/store.json');
import infantryCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/infantrycamp.json');
import cavalryCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/cavalrycamp.json');
import archerCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/archercamp.json');
import trainingCenterGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/trainingcenter.json');
import homeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/home.json');
import hospitalGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/hospital.json');
import assemblyGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/assembly.json');

import buildingCount = require('../../league-of-thrones-data-sheets/.jsonoutput/building_count.json');
import qualificationGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/general.json');
import buffGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/buff_table.json')
import parameterGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/parameter.json')
// import mapGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/map_config_.json')
import seasonGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/season.json')
import rechargeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/payment.json')
import strategyBuyGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/buy_stamina_times.json')
import activityTypeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/activity.json')
import vipGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/vip.json')
import offerGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/offer.json')

import mapListGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/map_list.json')
import mapGDS1 = require('../../league-of-thrones-data-sheets/.jsonoutput/map_config_1.json')
import mapGDS2 = require('../../league-of-thrones-data-sheets/.jsonoutput/map_config_2.json')

import {
	CityFacility,
	StateTransition,
	UpgradeFacilityArgs,
	StateName,
  } from '../Const';
import { ConfigContainer } from '../../Core/config';
import { BlockDefenseInfo } from '../State';
import { transDateToTimeStamp } from '../Utils';
import { copyObj } from '../../Core/state';
export class FacilityLimit {
	max_count: number;
	building_name: string;
	order: number;
  
	constructor(obj: {}) {
	  this.max_count = obj['max_count'] ? obj['max_count'] : 1;
	  this.building_name = obj['building_name'] ? obj['building_name'] : 'error';
	  this.order = obj['order'] ? obj['order'] : 1;
	}
}

export class Parameter {
    general_troops_coefficient: number;
    general_stamina_recovery: number;
    general_skill_max_level: number;
    general_max_level: number;
	troops_base_load: number;
	default_defense_general: number[]
	victory_need_occupy_times: number
	occupy_block_protect_times: number
	battle_victory_get_glory: number
	recovery_one_morale_need_gold: number
	order_recovery_need_times: number
	order_protect_times: number
	order_protect_need: number
	order_protect_1hour_need: number
	order_protect_1hour_times: number
	order_hoard_times: number
	order_hoard_need: number
	gather_need_general_stamina: number
	gather_get_silver_parameter: number
	new_player_protect_times: number
	choose_random_camp_reward: number
	register_reward_gold: number
	attack_player_need_stamina: number
	attack_plots_need_stamina: number
	defense_plots_need_stamina: number
	gather_need_stamina: number
	spy_need_stamina: number
	assembly_need_stamina: number
	assemble_last_times: number
  
    constructor(obj: {}) {
		this.default_defense_general = []
		for(let key in obj){
			if(obj[key]['value'].indexOf('|') != -1){
				let tempList = obj[key]['value'].split('|')
				for(let item of tempList){
					this[key].push(parseInt(item))
				}
			}
			else if(obj[key]['value'].indexOf('.') != -1){
				this[key] = parseFloat(obj[key]['value'])
			}
			else{
				this[key] = parseInt(obj[key]['value'])
			}
		}
    //   this.general_troops_coefficient = obj['general_troops_coefficient'] ? parseFloat(obj['general_troops_coefficient']['value']) : 1;
    //   this.general_stamina_recovery = obj['general_stamina_recovery'] ?  parseInt(obj['general_stamina_recovery']['value']) : 3600;
    //   this.general_skill_max_level = obj['general_skill_max_level'] ? parseInt(obj['general_skill_max_level']['value']) : 20;
    //   this.general_max_level = obj['general_max_level'] ? parseInt(obj['general_max_level']['value']) : 100;
	//   this.troops_base_load = obj['troops_base_load']? parseInt(obj['troops_base_load']['value']): 100;
	//   this.victory_need_occupy_times = obj['victory_need_occupy_times']? parseInt(obj['victory_need_occupy_times']['value']): 28800
	//   this.occupy_block_protect_times = obj['occupy_block_protect_times']? parseInt(obj['occupy_block_protect_times']['value']): 7200
	//   this.battle_victory_get_glory = obj['battle_victory_get_glory']? parseInt(obj['battle_victory_get_glory']['value']): 100
	//   let tempList = (obj['default_defense_general']['value'] as string).split('|')
	//   this.recovery_one_morale_need_gold = obj['recovery_one_morale_need_gold']? parseInt(obj['recovery_one_morale_need_gold']['value']): 10
	//   for(let item of tempList){
	// 	this.default_defense_general.push(parseInt(item))
	//   }
    }

}

export interface MapOccupyReward{
	type: number
	name: string
	count: number
}

export interface MapDefenseTroop{
	type: number
	defense: number
	count: number
	attack: number
}

export interface MapGDS{
	x_id: number
	y_id: number
	victory_occupy_reward: MapOccupyReward[]
	type: number
	troops: MapDefenseTroop[]
	silver_total_number: number
	parameter: number
	gather_silver_speed: number
	durability: number
	buff_id: number
	area: number
}

export class MapConfig{
	config: {[key: string]: MapGDS}
	constructor(obj:{}){
		this.config = {}
		for(let key in obj){
			let row = obj[key]
			let temp: MapGDS = {
				x_id: row['x_id'],
				y_id: row['y_id'],
				victory_occupy_reward: [],
				type: row['type'],
				troops: [],
				silver_total_number: row['silver_total_number'],
				parameter: row['parameter'],
				gather_silver_speed: row['gather_silver_speed'],
				durability: row['durability'],
				buff_id: row['buff_id'],
				area: row['area']
			}
			for(let reward of row['victory_occupy_reward']){
				let rtemp: MapOccupyReward = {
					type: reward['type'],
					name: reward['name'],
					count: reward['count']
				}
				temp.victory_occupy_reward.push(rtemp)
			}
			for(let troop of row['troops']){
				let ttemp: MapDefenseTroop = {
					type: troop['type'],
					defense: troop['defense'],
					count: troop['count'],
					attack: troop['attack']
				}
				temp.troops.push(ttemp)
			}
			this.config[key] = temp
		}
	}
	get(x_id: number, y_id: number){
		let key = x_id + '^' + y_id
		return this.config[key]
	}
}

export interface FacilityGdsRow {
	need_troop: number
	need_silver: number
	maintain_need_troop: number
	level: number
}

export interface FacilityFortressGdsRow extends FacilityGdsRow{
	employ_count: number
}

export interface FacilityMilitaryCenterGdsRow extends FacilityGdsRow{
	scale_of_troop_attack: number
}

export interface FacilityWallGdsRow extends FacilityGdsRow{
	scale_of_troop_defense: number
}

export interface FacilityStoreGdsRow extends FacilityGdsRow{
	silver_save: number
}

export interface FacilityInfantryCampGdsRow extends FacilityGdsRow{
	infantry_defense: number
	infantry_attack: number
}

export interface FacilityCavalryCampGdsRow extends FacilityGdsRow{
	cavalry_defense: number
	cavalry_attack: number
}

export interface FacilityArcherCampGdsRow extends FacilityGdsRow{
	archer_defense: number
	archer_attack: number
}

export interface FacilityTrainingCenterGdsRow extends FacilityGdsRow{
	get_troop: number
}

export interface FacilityHomeGdsRow extends FacilityGdsRow{
	product_silver: number
}

export interface FacilityHospitalGdsRow extends FacilityGdsRow{
}

export interface FacilityAssemblyGdsRow{
	need_troop: number
	need_silver: number
	maintain_need_troop: number
	assemble_troops: number
	level: number
}

export interface GeneralGdsRow{
	qualification_troop_recruit: number
	qualification_silver_product: number
	qualification_load: number
	qualification_attack: number
	qualification_defense: number
	general_type: number
	general_skill: number[]
	general_id: number
	stamina: number
}

export interface BuffGdsRow{
	value_type: number
	buff_value: number
	buff_type: string
	buff_target: string[]
	buff_id: number
}

export var CityConfigFromGDS = {
	facilityConfig: {
	  [CityFacility.Fortress]: new ConfigContainer<FacilityFortressGdsRow>(
		fortressGDS.Config
	  ),
	  [CityFacility.MilitaryCenter]:
		new ConfigContainer<FacilityMilitaryCenterGdsRow>(
		  militaryCenterGDS.Config
		),
	  [CityFacility.Wall]: new ConfigContainer<FacilityWallGdsRow>(
		wallGDS.Config
	  ),
	  [CityFacility.Store]: new ConfigContainer<FacilityStoreGdsRow>(
		storeGDS.Config
	  ),
	  [CityFacility.InfantryCamp]:
		new ConfigContainer<FacilityInfantryCampGdsRow>(
		  infantryCampGDS.Config
		),
	  [CityFacility.CavalryCamp]:
		new ConfigContainer<FacilityCavalryCampGdsRow>(cavalryCampGDS.Config),
	  [CityFacility.ArcherCamp]:
		new ConfigContainer<FacilityArcherCampGdsRow>(archerCampGDS.Config),
	  [CityFacility.TrainingCenter]:
		new ConfigContainer<FacilityTrainingCenterGdsRow>(
		  trainingCenterGDS.Config
		),
	  [CityFacility.Home]: new ConfigContainer<FacilityHomeGdsRow>(
		homeGDS.Config
	  ),
	  [CityFacility.Hospital]: new ConfigContainer<FacilityHospitalGdsRow>(
		hospitalGDS.Config
	  ),
	  [CityFacility.Assembly]: new ConfigContainer<FacilityAssemblyGdsRow>(
		assemblyGDS.Config
	  )
	},
	limit: {
	  [CityFacility.Fortress]: new FacilityLimit(buildingCount.fortress),
	  [CityFacility.MilitaryCenter]: new FacilityLimit(
		buildingCount.militarycenter
	  ),
	  [CityFacility.Wall]: new FacilityLimit(buildingCount.wall),
	  [CityFacility.Store]: new FacilityLimit(buildingCount.store),
	  [CityFacility.InfantryCamp]: new FacilityLimit(
		buildingCount.infantrycamp
	  ),
	  [CityFacility.CavalryCamp]: new FacilityLimit(
		buildingCount.cavalrycamp
	  ),
	  [CityFacility.ArcherCamp]: new FacilityLimit(buildingCount.archercamp),
	  [CityFacility.TrainingCenter]: new FacilityLimit(
		buildingCount.trainingcenter
	  ),
	  [CityFacility.Home]: new FacilityLimit(buildingCount.home),
	  [CityFacility.Hospital]: new FacilityLimit(buildingCount.hospital),
	  [CityFacility.Assembly]: new FacilityLimit(buildingCount.assembly)
	},
  };

export class BuffTable{
	config: {}
	constructor(containers: {}) {
		this.config = {};
		//standlize container
		for (var key in containers) {
		  const row : BuffGdsRow = containers[key]
		  this.config[row.buff_id] = row;
		}
	}
	get(id : string){
		return this.config[id]
	}
}

export var parameterConfig = new Parameter(parameterGDS)

export var GeneralConfigFromGDS = {
	qualification: new ConfigContainer<GeneralGdsRow>(qualificationGDS.Config),
	buff: new BuffTable(buffGDS.Config),
	parameter: parameterConfig
}



export function getMapOffset(mapId: number){
	let offsets = { x: 10, y : 10, rows: 21, cols: 10, maxSize: 21 };
	for(let item of mapListGDS['Config']){
		if(item['map_id'] === mapId){
			offsets.x = item.cols - 1;
			offsets.y = (item.rows - 1)/2;
			offsets.maxSize = Math.max(item.rows, item.cols);
			offsets.rows = item.rows;
			offsets.cols = item.cols;
		}
	}
	return offsets;
}

export function loadMapGDS(mapId: number){
	let list = {
		1: mapGDS1,
		2: mapGDS2
	};
	return list[mapId] || mapGDS1;
}

export function getMapConfigFromGDS (mapId: number){
	 mapId = mapId || 1;
	const mapGDS = loadMapGDS(mapId);
	// console.log('mapId dataconfig:', mapId, mapGDS);
	var MapConfigFromGDS = new MapConfig(mapGDS)
	return MapConfigFromGDS;
}

// export var MapConfigFromGDS = new MapConfig(mapGDS)

export function GenBlockDefenseTroop(x_id: number, y_id: number, mapId: number){
	var MapConfigFromGDS = getMapConfigFromGDS(mapId);
	let row = MapConfigFromGDS.get(x_id, y_id)
	let troops = row.troops
	let re: BlockDefenseInfo[] = []
	for(let troop of troops){
		let temp : BlockDefenseInfo = {
			username: '',
			generalId: -1,
			generalLevel: 1,
			generalType: troop.type,
			attack: troop.attack,
			defense: troop.defense,
			troops: troop.count,
			unionId: 0,
			iconId: -1
		}
		re.push(temp)
	}
	return re
}

export interface Season{
	show_season_victory_reward: SeasonReward[]
	show_rank_reward: SeasonReward[]
	show_occupy_reward: SeasonReward[]
	season_reservation: number
	season_ready: number
	season_open: number
	season_end: number
	rank_reward: RankReward[]
	activities: ActivityConf[]
	id: number
}

export interface ActivityConf{
	relativeTime: string
	startTime: number
	type: number
}

export interface SeasonReward{
	type: number
	name: string
	count: number
}

export interface RankReward{
	type: number
	name: string
	from: number
	end: number
	count: number
}

export class SeasonConfig{
	config : Season[]
	constructor(obj : {}){
		let list = obj['Config'] as []
		this.config = []
		for(let seasonConf of list){
			let season: Season = {
				show_season_victory_reward : [],
				show_rank_reward: [],
				show_occupy_reward: [],
				season_reservation : 0,
				season_ready: 0,
				season_open: 0,
				season_end: 0,
				rank_reward: [],
				activities: [],
				id: seasonConf['id']
			}
			for(let item of (seasonConf['dailyactivity'] || []) as []){
				let actConf : ActivityConf = {
					relativeTime: item['day'],
					startTime: 0,
					type: item['activity']
				}
				season.activities.push(actConf)
				// console.log('season.activities', season.activities);
			}
			for(let item of seasonConf['show_season_victory_reward'] as []){
				season.show_season_victory_reward.push( item as SeasonReward)
			}
			for(let item of seasonConf['show_rank_reward'] as []){
				season.show_rank_reward.push(item as SeasonReward)
			}
			for(let item of seasonConf['rank_reward'] as []){
				season.rank_reward.push(item as RankReward)
			}
			this.config.push(season)
		}
	}
	get(id : number){
		return this.config[id - 1]
	}
}

export var SeasonConfigFromGDS = new SeasonConfig(seasonGDS)

export interface RechargeConfig{
	token: number,
	price: number,
    internal_id: number,
    internal_icon: number,
    gold: number,
    extra_gold: number
}

export class RechargeConfigs{
	config : RechargeConfig[]
	constructor(obj : {}){
		this.config = []
		for(let item of (obj['Config'] || [])){
			this.config.push(item as RechargeConfig)
		}
	}
	get(id : number){
		for(let i = 0; i< this.config.length; i++ ){
			if(this.config[i].internal_id == id){
				return this.config[i]
			}
		}
		return undefined
	}
}

export var RechargeConfigFromGDS = new RechargeConfigs(rechargeGDS)

export const minMorale = 80
export const maxMorale = 120
export const normalMorale = 100
export const moraleReduceGap = 15 * 60

export class StrategyBuyConfig{
	config: number[] 
	constructor(obj:{}){
		this.config = []
		for(let item of obj['Config']){
			this.config.push(item['need_gold'])
		}
	}
	getMaxTimes(){
		return this.config.length
	}
}

export var StrategyBuyConfigFromGDS = new StrategyBuyConfig(strategyBuyGDS)

export interface ActivityType {
	id: number
    activity_type: number,
    activity_pond: number,
    activity_last: number
}

export class ActivityTypeConfig{
	config: ActivityType[]
	constructor(obj:{}){
		this.config = []
		for(let item of obj['Config']){
			this.config.push(item)
		}
	}
	get(type : number){
		return this.config[type - 1]
	}
}

export var ActivityTypeConfigFromGDS = new ActivityTypeConfig(activityTypeGDS)


export interface VipType {
	add_general_id: [],
	attack: number,
    defense: number,
    load: number,
    product: number,
    recruit: number,
    score: number,
    vip_level: number
}
export class VipConfig{
	config: VipType[]
	constructor(obj:{}){
		this.config = []
		for(let item of obj['Config']){
			this.config.push(item)
		}
	}
	get(type : number){
		return this.config[type - 1]
	}
}
export var vipConfigFromGDS = new VipConfig(vipGDS)



export interface OfferType {
    offer_trigger_value: number,
    offer_trigger_2: number,
    offer_trigger_1: number,
    offer_reward_troops: number,
    offer_reward_sliver: number,
    offer_order: number,
    offer_id: number,
    offer_gold: number,
    offer_icon: [],
    offer_background: string
}
export class OfferConfig{
	config: OfferType[]
	constructor(obj:{}){
		this.config = []
		for(let item of obj['Config']){
			this.config.push(item)
		}
	}
	get(id : number){
		let res: OfferType;
		for(let item of this.config){
			if(item['offer_id'] === id){
				res = item;
			}
		}
		return res;
	}
}

export var offerConfigFromGDS = new OfferConfig(offerGDS)


