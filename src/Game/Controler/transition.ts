import { IStateIdentity, IState, IStateManager, IStateChangeWatcher, State } from "../../Core/state";

import fortressGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/fortress.json')
import militaryCenterGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/militarycenter.json')
import wallGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/wall.json')
import storeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/store.json')
import infantryCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/infantrycamp.json')
import cavalryCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/cavalrycamp.json')
import archerCampGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/archercamp.json')
import trainingCenterGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/trainingcenter.json')
import homeGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/home.json')
import buildingCount = require('../../league-of-thrones-data-sheets/.jsonoutput/building_count.json')
import { CityFacility, StateTransition, UpgradeFacilityArgs, StateName, TestWallet } from "../Const";
import { ConfigContainer , FacilityLimit} from "../../Core/config";
import { FacilityFortressGdsRow, FacilityMilitaryCenterGdsRow, FacilityWallGdsRow,  FacilityStoreGdsRow, FacilityInfantryCampGdsRow, FacilityCavalryCampGdsRow, FacilityArcherCampGdsRow, FacilityTrainingCenterGdsRow, FacilityHomeGdsRow  } from "../DataConfig";
import { City , CityConfig} from "../Logic/game";
import { ICityState } from "../State";
import { MemoryStateManager , LoadStateFunc} from "./statemanger";

export class TransitionHandler {
	stateManger: IStateManager
	dataConfigs: CityConfig

	constructor(stateWatcher: IStateChangeWatcher, loadLoadStateFunc?: LoadStateFunc) {
		//init state
		const cityStateId = `${StateName.City}:${TestWallet}`
		this.stateManger = new MemoryStateManager(
			{},
			loadLoadStateFunc
		  );
		this.dataConfigs = {
			facilityConfig: {
				[CityFacility.Fortress]: new ConfigContainer<FacilityFortressGdsRow>(fortressGDS.Config),
				[CityFacility.MilitaryCenter]: new ConfigContainer<FacilityMilitaryCenterGdsRow>(militaryCenterGDS.Config),
				[CityFacility.Wall]: new ConfigContainer<FacilityWallGdsRow>(wallGDS.Config),
				[CityFacility.Store]: new ConfigContainer<FacilityStoreGdsRow>(storeGDS.Config),
				[CityFacility.InfantryCamp]: new ConfigContainer<FacilityInfantryCampGdsRow>(infantryCampGDS.Config),
				[CityFacility.CavalryCamp]: new ConfigContainer<FacilityCavalryCampGdsRow>(cavalryCampGDS.Config),
				[CityFacility.ArcherCamp]: new ConfigContainer<FacilityArcherCampGdsRow>(archerCampGDS.Config),
				[CityFacility.TrainingCenter]: new ConfigContainer<FacilityTrainingCenterGdsRow>(trainingCenterGDS.Config),
				[CityFacility.Home]: new ConfigContainer<FacilityHomeGdsRow>(homeGDS.Config),
			},
			limit:{
				[CityFacility.Fortress]: new FacilityLimit(buildingCount.fortress),
				[CityFacility.MilitaryCenter]: new FacilityLimit(buildingCount.militarycenter),
				[CityFacility.Wall]: new FacilityLimit(buildingCount.wall),
				[CityFacility.Store]: new FacilityLimit(buildingCount.store),
				[CityFacility.InfantryCamp]: new FacilityLimit(buildingCount.infantrycamp),
				[CityFacility.CavalryCamp]: new FacilityLimit(buildingCount.cavalrycamp),
				[CityFacility.ArcherCamp]: new FacilityLimit(buildingCount.archercamp),
				[CityFacility.TrainingCenter]: new FacilityLimit(buildingCount.trainingcenter),
				[CityFacility.Home]: new FacilityLimit(buildingCount.home),
			}
		}
	}

  onTransition(sid: StateTransition, arg: {}) {
    switch (sid) {
      case StateTransition.UpgradeFacility:
        this.onUpdateFacility(arg as UpgradeFacilityArgs);
    }
  }

  onUpdateFacility(args: UpgradeFacilityArgs) {
    const stateId = { id: `${StateName.City}:${args.from}` };
    const cityState = this.stateManger.get(stateId);

    const city = new City(cityState as any as ICityState, this.dataConfigs);

    //Do Logic  here
    //Valdiate resource requirement first
    city.upgradeFacility(args.typ, args.index);
  }
}
