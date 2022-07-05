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
	sliver_save: number
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

