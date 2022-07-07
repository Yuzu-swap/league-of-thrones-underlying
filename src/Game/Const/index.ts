export enum StateName {
	City = "city"
}

export enum CityFacility {
	Fortress = 0,
	MilitaryCenter,
	Wall,
	Store,
	InfantryCamp,
	CavalryCamp,
	ArcherCamp,
	TrainingCenter,
	Home ,
}

export enum ResouceType {
	Silver = 0,
	Troop = 1
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