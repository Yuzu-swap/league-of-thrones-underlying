export interface FacilityGdsRow {
	need_human: number;
	need_gold: number
	maintain_need_human: number
	level: number
}

export interface FacilityMarketGdsRow  extends FacilityGdsRow{
	scale_of_human_attack: number;
}


export interface FacilityHumanGdsRow extends FacilityGdsRow{
	get_human: number;
}

export interface FacilityProductionGdsRow extends FacilityGdsRow{
	product: number;
}


export interface FacilityPowerGdsRow extends FacilityGdsRow{
	employ_count: number;
}


export interface FacilityLogisticsGdsRow extends FacilityGdsRow{
	scale_of_human_defense: number;
}


