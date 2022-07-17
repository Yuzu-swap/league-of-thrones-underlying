import { ConfigContainer } from '../../Core/config';
import { GeneralGdsRow ,BuffGdsRow} from '../DataConfig'
import { IGeneralState , ResouceInfo} from '../State';
import { City } from './game';

export interface GeneralConfig{
    qualification : ConfigContainer<GeneralGdsRow>
    buff: ConfigContainer<BuffGdsRow>
}

export enum GeneralAbility{
    Attack = 'qualification_attack',
    Defense = 'qualification_defense',
    Load = 'qualification_load',
    Silver = 'qualification_sliver_product',
    Troop = 'qualification_troop_recurit'
}
export enum SkillType{
    Attack = 'attack',
    Defense = 'defense',
    Load = 'load',
    Silver = 'product',
    Troop = 'recurit'
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

    getSkillInfo(id: number): BuffGdsRow| undefined{
        return this.config.buff.get( (id - 1).toString())
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
        re = Math.round((2* Math.pow(currentLevel, 2) * currentLevel + 20) * sumq / 10) * 10
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

    getGeneralAbility(index: number, level: number ,typ : GeneralAbility): number{
        const row = this.getGeneralQualification(index)
        switch(typ){
            case GeneralAbility.Attack:
            case GeneralAbility.Defense:
                return row[typ] * 100 * level
            case GeneralAbility.Load:
                return row[typ] * 250 * level
            case GeneralAbility.Silver:
                return parseFloat(((0.0002 * Math.pow(level, 2) + 0.01 * level + 0.1) * row[typ] * 3600).toFixed(2))
            case GeneralAbility.Troop:
                return parseFloat(((0.000002 * Math.pow(level, 2) + 0.0001 * level + 0.001) * row[typ] * 3600).toFixed(2))
        }
    }

    getSkillUpdateNeed( generalId : number, skillIndex : number, level: number): number{
        const row : GeneralGdsRow = this.getGeneralQualification(generalId)
        const skillId = row.general_skill[skillIndex]
        const buff = this.getSkillInfo(skillId)
        let cost = 0
        switch(buff.buff_type){
            case SkillType.Attack:
                cost = 0.02 * row.qualification_attack * Math.pow(level, 2) + 0.5
                break
            case SkillType.Defense:
                cost = 0.02 * row.qualification_defense * Math.pow(level, 2) + 0.5
                break
            case SkillType.Load:
                cost = 0.02 * row.qualification_load * Math.pow(level, 2) + 0.5
                break
            case SkillType.Silver:
                cost = 0.04 * row.qualification_sliver_product * Math.pow(level, 2) + 1
                break
            case SkillType.Troop:
                cost = 0.04 * row.qualification_troop_recurit * Math.pow(level, 2) + 1
                break
        }
        return cost
    }

    getSkillValue( generalId : number, skillIndex : number, level: number ) : {}{
        let re = {
            'value_type': 0,
            'value': 0
        }
        const row : GeneralGdsRow = this.getGeneralQualification(generalId)
        const skillId = row.general_skill[skillIndex]
        const buff = this.getSkillInfo(skillId)
        re['value_type'] = buff.value_type
        if(buff.value_type == 1){
            //percent
            re['value'] = buff.buff_value * level
        }
        else{
            //value
            switch(buff.buff_type){
                case SkillType.Silver:
                    re['value'] = parseFloat((buff.buff_value *  Math.pow(level, 2) * row.qualification_sliver_product * 3600).toFixed(2))
                    break
                case SkillType.Troop:
                    re['value'] = parseFloat((buff.buff_value *  Math.pow(level, 2) * row.qualification_troop_recurit * 3600).toFixed(2))
                    break
                case SkillType.Attack:
                    re['value'] = buff.buff_value * row.qualification_attack * Math.pow(level, 2)
                    break
                case SkillType.Defense:
                    re['value'] = buff.buff_value * row.qualification_defense * Math.pow(level, 2)
                    break
                case SkillType.Load:
                    re['value'] = buff.buff_value * row.qualification_load * Math.pow(level, 2)
                    break
            }
        }
        return re
    }

}