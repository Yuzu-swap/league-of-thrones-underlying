export enum StateName {
	City = "city"
}

export enum CityFacility {
	Center = 0,
	Human = 1,
	Market = 2,
	Production = 3,
	Logistics = 4,
	Power = 5
}

export enum ResouceType {
	Gold = 0,
	Silver = 1,
	Wookd = 2,
	Stone = 3
}

export enum StateTransition {
	UpgradeFacility = 1,
	TrainTroops = 2,
	ExcuteStrategy = 3,
	HireGeneral = 4,
	EnhanceGeneral = 5,
	AttackEnemy = 6,
	MarchToPos = 7,
}

interface StateTransitionArgs {
	from: string
}
export interface UpgradeFacilityArgs extends StateTransitionArgs {
	typ: CityFacility
	index: number
	targetLevel: number
}


//Using as test userid
export const TestWallet: string = "0xf6a6a8bad2aefae8733b07f48c62e3b8db66276e"