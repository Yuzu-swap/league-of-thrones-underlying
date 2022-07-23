import fortressGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/fortress.json');
import militaryCenterGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/militarycenter.json');
import wallGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/wall.json');
import storeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/store.json');
import infantryCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/infantrycamp.json');
import cavalryCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/cavalrycamp.json');
import archerCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/archercamp.json');
import trainingCenterGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/trainingcenter.json');
import homeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/home.json');
import buildingCount = require('../../league-of-thrones-data-sheets/.jsonoutput/building_count.json');
import qualificationGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/general.json');
import buffGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/buff_table.json')
import {
	CityFacility,
	StateTransition,
	UpgradeFacilityArgs,
	StateName,
	TestWallet
  } from '../Const';
import { ConfigContainer } from '../../Core/config';
import { FacilityLimit } from '../Logic/game';

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

export interface GeneralGdsRow{
	qualification_troop_recurit: number
	qualification_sliver_product: number
	qualification_load: number
	qualification_attack: number
	qualification_defense: number
	general_type: number
	general_skill: number[]
	general_id: number
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
	  [CityFacility.Home]: new FacilityLimit(buildingCount.home)
	},
  };
export var GeneralConfigFromGDS = {
	qualification: new ConfigContainer<GeneralGdsRow>(qualificationGDS.Config),
	buff: new ConfigContainer<BuffGdsRow>(buffGDS.Config),
}