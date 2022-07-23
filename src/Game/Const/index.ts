export enum StateName {
	City = "city",
	General = "general"
}

export enum CityFacility {
	Fortress = 'fortress',
	MilitaryCenter = 'militarycenter',
	Wall = 'wall',
	Store = 'store',
	InfantryCamp = 'infantrycamp',
	CavalryCamp = 'cavalrycamp',
	ArcherCamp = 'archercamp',
	TrainingCenter = 'trainingcenter',
	Home = 'home',
}

export enum ResouceType {
	Silver = 'silver',
	Troop = 'troop'
}

export enum StateTransition {
	UpgradeFacility = 1,
	Recruit = 2,
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
}

export interface RecruitArgs extends StateTransitionArgs{
	amount: number
}

//Using as test userid
export const TestWallet: string = "0xf6a6a8bad2aefae8733b07f48c62e3b8db66276e"