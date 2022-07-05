
type ConfigContainerArrayOrMap<ConfigRowType> = ConfigRowType[] | {[key:string]:ConfigRowType}


export class ConfigContainer<ConfigRowType> {
	configs : {}

	constructor(containers:ConfigContainerArrayOrMap<ConfigRowType>){
		this.configs = {}
		//standlize container
		for(var key in containers){
			this.configs[key] = containers[key]
		}
	}
	get(key:string):  ConfigRowType|undefined {
		return  this.configs[key]
	}

}

export class FacilityLimit{
	max_count: number
	building_name: string

	constructor( obj : {}){
		this.max_count = obj['max_count'] ? obj['max_count']  : 1
		this.building_name =  obj['building_name'] ? obj['building_name'] : 'error'
	}
}