import { ConfigContainer } from '../../Core/config';
import { GeneralGdsRow ,BuffGdsRow, BuffTable} from '../DataConfig'
import { IGeneralState , ResouceInfo} from '../State';
import { ResouceType, StateName } from '../Const';
import { City } from './game';
import { GeneralConfigFromGDS } from '../DataConfig';
import { IBoost } from './boost';

export interface GeneralConfig{
    qualification : ConfigContainer<GeneralGdsRow>
    buff: BuffTable
    parameter: Parameter
}

export enum GeneralAbility{
    Attack = 'qualification_attack',
    Defense = 'qualification_defense',
    Load = 'qualification_load',
    Silver = 'qualification_silver_product',
    Troop = 'qualification_troop_recruit'
}
export enum SkillType{
    Attack = 'attack',
    Defense = 'defense',
    Load = 'load',
    Silver = 'product',
    Troop = 'recruit'
}

export class Parameter {
    general_troops_coefficient: number;
    general_stamina_recovery: number;
    general_skill_max_level: number;
    general_max_level: number;
  
    constructor(obj: {}) {
      this.general_troops_coefficient = obj['general_troops_coefficient'] ? parseFloat(obj['general_troops_coefficient']['value']) : 1;
      this.general_stamina_recovery = obj['general_stamina_recovery'] ?  parseInt(obj['general_stamina_recovery']['value']) : 3600;
      this.general_skill_max_level = obj['general_skill_max_level'] ? parseInt(obj['general_skill_max_level']['value']) : 20;
      this.general_max_level = obj['general_max_level'] ? parseInt(obj['general_max_level']['value']) : 100;
    }
  }

export class General{
    state: IGeneralState
    config: GeneralConfig
    city : City
    boost : IBoost
    constructor(state: IGeneralState, city: City) {
        this.state = state;
        this.config = GeneralConfigFromGDS;
        this.city = city
    }

    setBoost( boost : IBoost){
        this.boost = boost
    }

    /**
     * get the qualification of the general 
     * @param id the id of the general
    */
    getGeneralQualification(id: number):GeneralGdsRow | undefined{
        return this.config.qualification.get( (id - 1).toString() )
    }

    getSkillInfo(id: number): BuffGdsRow| undefined{
        return this.config.buff.get(id.toString())
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
    
    checkIndexAble(id : number): boolean{
        let len = Object.keys(this.config.qualification.configs).length
        if(id > len|| id <= 0){
            return false
        }
        return true
    }

    ableGeneral(id: number){
        if(!this.checkIndexAble(id)){
            return {result : false, error: 'index-error'}
        }
        let count = this.getAbleCount()
        if( count < this.getMaxAbleCount() ){
            this.state.able[id - 1] = true
        }
        this.state.update(
            {
                able : this.state.able 
            }
        )
        return {result : true}
    }

    disableGeneral(id: number){
        if(!this.checkIndexAble(id)){
            return {result : false, error: 'index-error'} 
        }
        this.state.able[id - 1] = false
        this.state.update(
            {
                able : this.state.able 
            }
        )
        return {result : true}
    }

    getGeneralUpgradeNeed(id: number, currentLevel: number): number{
        if(!this.checkIndexAble(id)){
            return 0
        }
        const row = this.getGeneralQualification(id)
        const sumq = row.qualification_attack + row.qualification_load + row.qualification_silver_product + row.qualification_troop_recruit
        let re = 0
        re = Math.round((2* Math.pow(currentLevel, 2) * currentLevel + 20) * sumq / 10) * 10
        return re 
    }

    checkUpgradeGeneral(id: number): boolean{
        if(!this.checkIndexAble(id)){
            return false
        }
        const level = this.state.levels[id - 1]
        const cost = this.getGeneralUpgradeNeed(id, level)
        if(this.city.state.resources.silver.value >= cost){
            return true
        }
        return false
    }

    upgradeGeneral( id: number ){
        if(!this.checkIndexAble(id)){
            return {result : false, error: 'index-error'} 
        }
        const level = this.state.levels[id - 1]
        const cost = this.getGeneralUpgradeNeed(id, level)
        const levels = this.state.levels.concat()
        if(this.city.useSilver(cost)){
            levels[id - 1] = level + 1
            this.state.update({
                levels : levels
            })
            return {result: true}
        }
        return {result : false, error: 'silver-not-enough-error'} 
    }

    getGeneralAbility(id: number, level: number ,typ : GeneralAbility): number{
        const row = this.getGeneralQualification(id)
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
                cost = 0.04 * row.qualification_silver_product * Math.pow(level, 2) + 1
                break
            case SkillType.Troop:
                cost = 0.04 * row.qualification_troop_recruit * Math.pow(level, 2) + 1
                break
        }
        return cost * 10000
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
                    re['value'] = parseFloat((buff.buff_value *  Math.pow(level, 2) * row.qualification_silver_product * 3600).toFixed(2))
                    break
                case SkillType.Troop:
                    re['value'] = parseFloat((buff.buff_value *  Math.pow(level, 2) * row.qualification_troop_recruit * 3600).toFixed(2))
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

    checkGeneralSkillUpgrade(generalId : number, skillIndex : number):boolean{
        const level = this.state.skill_levels[generalId -1][skillIndex]
        const need = this.getSkillUpdateNeed(generalId, skillIndex, level)
        if(this.city.state.resources.silver.value >= need){
            return true
        }
        return false
    }

    upgradeGeneralSkill(generalId : number, skillIndex : number){
        if(!this.checkGeneralSkillUpgrade(generalId, skillIndex)){
            return {result : false, error: 'silver-not-enough-error'} 
        }
        const level = this.state.skill_levels[generalId -1][skillIndex]
        const need = this.getSkillUpdateNeed(generalId, skillIndex, level)
        if(this.city.useSilver(need)){
            let skill_levels = this.state.skill_levels
            skill_levels[generalId -1 ][skillIndex] = level + 1
            this.state.update({
                skill_levels : skill_levels
            })
            return {result : true }
        }
        return {result : false, error: 'silver-not-enough-error'} 
    }

    getGeneralProduction(typ : ResouceType){
        const ableList = this.state.able
        let product = 0
        for(let index = 0; index < ableList.length; index ++){
            if(!ableList[index]){
                continue;
            }
            const row = this.getGeneralQualification(index + 1)
            if(typ == ResouceType.Silver){
                product += this.getGeneralAbility(index + 1, this.state.levels[index], GeneralAbility.Silver)
            }else{
                product += this.getGeneralAbility(index + 1, this.state.levels[index], GeneralAbility.Troop)
            }
            for(let bi = 0; bi < row.general_skill.length; bi++){
                const buff = this.getSkillInfo(row.general_skill[bi])
                if(typ == ResouceType.Silver && buff.buff_type == SkillType.Silver ){
                    product += this.getSkillValue(index + 1, bi, this.state.skill_levels[index][bi])['value']
                }
                else if (typ == ResouceType.Troop && buff.buff_type == SkillType.Troop){
                    product += this.getSkillValue(index + 1, bi, this.state.skill_levels[index][bi])['value']
                }
            }
        }
        return product
    }

    updateBoost(){
        this.boost.setProduction(StateName.General, ResouceType.Silver, this.getGeneralProduction(ResouceType.Silver))
        this.boost.setProduction(StateName.General, ResouceType.Troop, this.getGeneralProduction(ResouceType.Troop))
      }

}