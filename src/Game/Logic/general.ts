import { ConfigContainer } from '../../Core/config';
import { GeneralGdsRow ,BuffGdsRow} from '../DataConfig'
import { IGeneralState , ResouceInfo} from '../State';
import { City } from './game';

export interface GeneralConfig{
    qualification : ConfigContainer<GeneralGdsRow>
    buff: ConfigContainer<BuffGdsRow>
}

export class General{
    state: IGeneralState
    config: GeneralConfig
    city : City
    constructor(state: IGeneralState, conf: GeneralConfig, city: City) {
        this.state = state;
        this.config = conf;
        this.city = city
    }
    initState(){
        let initState = {
            levels:[],
            able:[],
	        skill_levels:[]
        }
        let len = Object.keys(this.config.qualification.configs).length
        initState.levels = new Array(len).fill(1)
        initState.able = new Array(len).fill(false)
        initState.skill_levels = new Array(len).fill([])
        for(let i = 0; i < len; i++){
            initState.skill_levels[i] = new Array(3).fill(1)
        }
        this.state.update(initState)
    }

    /**
     * get the qualification of the general 
     * @param id the id of the general
    */
    getGeneralQualification(id: number):GeneralGdsRow | undefined{
        return this.config.qualification.get( (id - 1).toString() )
    }

    /**
     * get the able status of the generals
    */
    getAbleList():boolean[]{
        return this.state.able
    }

    getAbleCount():number{
        let count = 0
        for( let state of this.state.able ){
            if(state){
                count++
            }
        }
        return count
    }

    getMaxAbleCount(): number{
        return this.city.getGeneralMaxAble()
    }
    
    checkIndexAble(index : number): boolean{
        let len = Object.keys(this.config.qualification.configs).length
        if(index > len|| index <= 0){
            return false
        }
        return true
    }

    ableGeneral(index: number): boolean{
        if(!this.checkIndexAble(index)){
            return false
        }
        let count = this.getAbleCount()
        if( count < this.getMaxAbleCount() ){
            this.state.able[index - 1] = true
        }
        this.state.update(
            {
                able : this.state.able 
            }
        )
        return true
    }

    disableGeneral(index: number){
        if(!this.checkIndexAble(index)){
            return 
        }
        this.state.able[index - 1] = false
        this.state.update(
            {
                able : this.state.able 
            }
        )
    }

    getGeneralUpgradeNeed(index: number, currentLevel: number): number{
        if(!this.checkIndexAble(index)){
            return 0
        }
        const row = this.getGeneralQualification(index)
        const sumq = row.qualification_attack + row.qualification_load + row.qualification_sliver_product + row.qualification_troop_recurit
        let re = 0
        re = Math.round((2* Math.pow(2, currentLevel) * currentLevel + 20) * sumq / 10) * 10
        return re 
    }

    checkUpgradeGeneral(index: number): boolean{
        if(!this.checkIndexAble(index)){
            return false
        }
        const level = this.state.levels[index - 1]
        const cost = this.getGeneralUpgradeNeed(index, level)
        if(this.city.state.resources.silver.value >= cost){
            return true
        }
        return false
    }

    upgradeGeneral( index: number ): boolean{
        if(!this.checkIndexAble(index)){
            return false
        }
        const level = this.state.levels[index - 1]
        const cost = this.getGeneralUpgradeNeed(index, level)
        const levels = this.state.levels.concat()
        if(this.city.useSilver(cost)){
            levels[index - 1] = level + 1
            this.state.update({
                levels : levels
            })
            return true
        }
        return false
    }

}