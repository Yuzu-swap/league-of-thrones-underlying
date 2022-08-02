export enum StateName {
	City = "city",
	General = "general" ,
	DefenderInfo = "defenderinfo"
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
	AbleGeneral,
	DisableGeneral,
	UpgradeGeneral,
	UpgradeGeneralSkill,
	SetDefenseGeneral,
	ReceiveTroop,
	Battle
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

export interface AbleGeneralArgs extends StateTransitionArgs{
	id: number
}

export interface DisableGeneralArgs extends StateTransitionArgs{
	id: number
}

export interface UpgradeGeneralArgs extends StateTransitionArgs{
	id: number
}

export interface UpgradeGeneralSkillArgs extends StateTransitionArgs{
	generalId: number
	skillIndex: number
}

export interface SetDefenseGeneralArgs extends StateTransitionArgs{
	generalId: number
}

export interface ReceiveTroopArgs extends StateTransitionArgs{

}

export interface BattleArgs extends StateTransitionArgs{
	generalId: number
	name: string
}