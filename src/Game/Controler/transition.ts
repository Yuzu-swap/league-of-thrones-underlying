import { IStateIdentity, IState, IStateManager, IStateChangeWatcher, State } from "../../Core/state";

import marketGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/market.json')
import powerGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/power.json')
import humanGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/human.json')
import logisticsGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/logistics.json')
import productionGDS = require('../../league-of-thrones-data-sheets/.jsonoutput/production.json')
import { CityFacility, StateTransition, UpgradeFacilityArgs, StateName, TestWallet } from "../Const";
import { ConfigContainer } from "../../Core/config";
import { FacilityProductionGdsRow, FacilityHumanGdsRow, FacilityLogisticsGdsRow, FacilityPowerGdsRow, FacilityMarketGdsRow } from "../DataConfig";
import { City } from "../Logic/game";
import { ICityState } from "../State";
import { MemoryStateManager } from "./statemanger";



export class TransitionHandler {
	stateManger: IStateManager
	dataConfigs: any

	constructor(stateWatcher: IStateChangeWatcher) {
		//init state
		const cityStateId = `${StateName.City}:${TestWallet}`
		this.stateManger = new MemoryStateManager({
			[cityStateId]: (new State<ICityState>({
				id: cityStateId, facilities: {
				}, resources: {}, troops: 0
			}, stateWatcher)).unsderlying(),
		})
		this.dataConfigs = {
			facilityConfig: {
				[CityFacility.Market]: new ConfigContainer<FacilityMarketGdsRow>(marketGDS.Config),
				[CityFacility.Production]: new ConfigContainer<FacilityProductionGdsRow>(productionGDS.Config),
				[CityFacility.Human]: new ConfigContainer<FacilityHumanGdsRow>(humanGDS.Config),
				[CityFacility.Logistics]: new ConfigContainer<FacilityLogisticsGdsRow>(logisticsGDS.Config),
				[CityFacility.Power]: new ConfigContainer<FacilityPowerGdsRow>(powerGDS.Config),
			},
		}
	}


	onTransition(sid: StateTransition, arg: {}) {
		switch (sid) {
			case StateTransition.UpgradeFacility:
				this.onUpdateFacility(arg as UpgradeFacilityArgs)
		}
	}

	onUpdateFacility(args: UpgradeFacilityArgs) {
		const stateId = { id: `${StateName.City}:${args.from}` }
		const cityState = this.stateManger.load(stateId)

		const city = new City((cityState as any as ICityState), {
			facilityConfig: this.dataConfigs.facilityConfig,
		});

		//Do Logic  here
		//Valdiate resource requirement first
		city.upgradeFacility(args.typ,args.targetLevel)
	}

}