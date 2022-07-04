
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