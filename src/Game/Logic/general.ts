import { ConfigContainer } from '../../Core/config';
import { GeneralGdsRow ,BuffGdsRow, BuffTable, FacilityLimit, MapConfig, MapConfigFromGDS, normalMorale, minMorale, moraleReduceGap, maxMorale} from '../DataConfig'
import { BlockDefenseInfo, GeneralInfo, IDefenderInfoState, IGeneralState , ResouceInfo} from '../State';
import { CityFacility, ResouceType, StateName } from '../Const';
import { City } from './game';
import { GeneralConfigFromGDS , Parameter} from '../DataConfig';
import { IBoost } from './boost';
import { copyObj, State } from '../../Core/state';
import { getTimeStamp, parseStateId } from '../Utils';
import { BattleRecordType, BattleTransRecord } from '../Controler/transition';
import { StrategyType } from './strategy';

export interface GeneralConfig{
    qualification : ConfigContainer<GeneralGdsRow>
    buff: BuffTable
    parameter: Parameter
}

export interface BattleResult{
    result: boolean
    win: boolean
    attackTroopReduce: number
    defenseTroopReduce: number
    silverGet: number
    attackGloryGet: number
    defenseGloryGet: number
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

export enum RecoverMoraleType{
    Silver = 'silver',
    Gold = 'gold'
}

export interface DefenseInfo{
    generalId:number
    generalLevel: number
    generalType: number
    attack: number
    defense: number
    troop: number
    silver: number
    defenseMaxTroop: number
}

export enum BattleType{
    Attack = 'attack',
    Defense = 'defense'
}

export interface BattleRecord{
    myInfo: BattleRecordInfo
    enemyInfo: BattleRecordInfo
    blockInfo: {
      x_id: number
      y_id: number
      type: number
      parameter: number
    }
    type: BattleType
    recordType : string
    timestamp: number
    result: boolean
  }

export interface BattleRecordInfo{
    username: string
    generalId: number
    generalLevel: number
    generalType: number
    troopReduce: number
    silverGet: number
    gloryGet: number
}

export class General{
    state: IGeneralState
    config: GeneralConfig
    mapConfig: MapConfig
    city : City
    boost : IBoost
    constructor(state: IGeneralState, city: City) {
        this.state = state;
        this.config = GeneralConfigFromGDS;
        this.mapConfig = MapConfigFromGDS
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

    getGeneralState(id: number): GeneralInfo{
        return copyObj(this.state.generalList[id + ""]) as GeneralInfo
    }

    getAbleCount():number{
        let count = 0
        for( let id in this.state.generalList ){
            if(this.state.generalList[id].able){
                count++
            }
        }
        return count
    }

    getMaxAbleCount(): number{
        return this.city.getGeneralMaxAble()
    }
    
    checkIdAble(id : number): boolean{
        let len = Object.keys(this.config.qualification.configs).length
        if(id > len|| id <= 0){
            return false
        }
        if(!this.state.generalList[id + ""]){
            return false
        }
        return true
    }

    ableGeneral(id: number){
        this.city.updateResource(ResouceType.Silver)
        if(!this.checkIdAble(id)){
            return {result : false, error: 'index-error'}
        }
        let count = this.getAbleCount()
        let generalInfo = this.getGeneralState(id)
        if( count < this.getMaxAbleCount() ){
            generalInfo.able = true
        }
        this.state.update(
            {
                [`generalList.${id}`] : generalInfo
            }
        )
        return {result : true}
    }

    disableGeneral(id: number){
        this.city.updateResource(ResouceType.Silver)
        if(!this.checkIdAble(id)){
            return {result : false, error: 'index-error'} 
        }
        let generalInfo = this.getGeneralState(id)
        generalInfo.able = false
        if(this.state.defense_general == id){
            this.state.update(
                {
                    [`generalList.${id}`] : generalInfo,
                    defense_general : -1
                }
            )
        }
        else{
            this.state.update(
                {
                    [`generalList.${id}`] : generalInfo
                }
            )
        }
        return {result : true}
    }

    setDefenseGeneral(id : number){
        if(!this.checkIdAble(id)){
            return {result : false, error: 'id-error'} 
        }
        const generalInfo = this.getGeneralState(id)
        if(!generalInfo.able){
            return {result : false, error: 'general-not-able'}
        }
        if(!this.checkDefenseBlock(id)){
            return {result : false, error: 'id-error'} 
        }
        this.state.update(
            {
                defense_general: id
            }
        )
        return {result : true}
    }

    getGeneralUpgradeNeed(id: number, currentLevel: number): number{
        if(!this.checkIdAble(id)){
            return 0
        }
        const row = this.getGeneralQualification(id)
        const sumq = row.qualification_attack + row.qualification_load + row.qualification_silver_product + row.qualification_troop_recruit + row.qualification_defense
        let re = 0
        re = Math.round((2* Math.pow(currentLevel, 2) + 10 * currentLevel + 20) * sumq / 10) * 10
        return re 
    }

    checkUpgradeGeneral(id: number): boolean{
        if(!this.checkIdAble(id)){
            return false
        }
        const generalInfo = this.getGeneralState(id)
        const level = generalInfo.level
        if(level == this.config.parameter.general_max_level){
            return false
        }
        const cost = this.getGeneralUpgradeNeed(id, level)
        if(this.city.getResource(ResouceType.Silver) >= cost){
            return true
        }
        return false
    }

    getGeneralLevel( id : number): number{
        if(this.checkIdAble(id)){
            const generalInfo = this.getGeneralState(id)
            const level = generalInfo.level
            return level
        }
        return 1
    }

    upgradeGeneral( id: number ){
        this.city.updateResource(ResouceType.Silver)
        if(!this.checkIdAble(id)){
            return {result : false, error: 'index-error'} 
        }
        let generalInfo = this.getGeneralState(id)
        const level = generalInfo.level
        if(level == this.config.parameter.general_max_level){
            return {result : false, error: 'general-level-is-max'} 
        }
        const cost = this.getGeneralUpgradeNeed(id, level)
        generalInfo.level = level + 1
        if(this.city.useSilver(cost)){
            this.state.update({
                [`generalList.${id}`] : generalInfo,
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
        const generalInfo = this.getGeneralState(generalId)
        const level = generalInfo.skill_levels[skillIndex]
        if(level == this.config.parameter.general_skill_max_level){
            return false
        }
        const need = this.getSkillUpdateNeed(generalId, skillIndex, level)
        if(this.city.getResource(ResouceType.Silver) >= need){
            return true
        }
        return false
    }

    upgradeGeneralSkill(generalId : number, skillIndex : number){
        this.city.updateResource(ResouceType.Silver)
        if(!this.checkGeneralSkillUpgrade(generalId, skillIndex)){
            return {result : false, error: 'silver-not-enough-error'} 
        }
        let generalInfo = this.getGeneralState(generalId)
        const level = generalInfo.skill_levels[skillIndex]
        if( level == this.config.parameter.general_skill_max_level ){
            return {result : false, error: 'skill-is-max-level'} 
        }
        const need = this.getSkillUpdateNeed(generalId, skillIndex, level)
        if(this.city.useSilver(need)){
            
            generalInfo.skill_levels[skillIndex] = level + 1
            this.state.update({
                [`generalList.${generalId}`] : generalInfo,
            })
            return {result : true }
        }
        return {result : false, error: 'silver-not-enough-error'} 
    }

    getGeneralProduction(typ : ResouceType){

        let mapBase = 0
        let mapPercent = 0
        let mapBuffList = this.boost.getMapBuff()
        let moralePercent = this.getMoralePercent()
        for( let mapBuff of mapBuffList){
            const skillRow = this.getSkillInfo(mapBuff)
            if((skillRow.buff_type == SkillType.Silver && typ == ResouceType.Silver) ||
             (skillRow.buff_type == SkillType.Troop && typ == ResouceType.Troop )){
                if(skillRow['value_type'] == 1){
                    mapPercent += skillRow.buff_value
                }
                else{
                    mapBase += skillRow.buff_value
                }
            }
        }
        let product = 0
        for(let idstring in this.state.generalList){
            const generalInfo = this.state.generalList[idstring]
            const id = parseInt(idstring)
            if(!generalInfo.able){
                continue;
            }
            const row = this.getGeneralQualification(id)
            let baseProduct = 0
            let percentProduct = 1
            if(typ == ResouceType.Silver){
                baseProduct += this.getGeneralAbility(id, generalInfo.level, GeneralAbility.Silver)
            }else{
                baseProduct += this.getGeneralAbility(id, generalInfo.level, GeneralAbility.Troop)
            }
            for(let bi = 0; bi < row.general_skill.length; bi++){
                const buff = this.getSkillInfo(row.general_skill[bi])
                if(
                    (typ == ResouceType.Silver && buff.buff_type == SkillType.Silver) ||
                    (typ == ResouceType.Troop && buff.buff_type == SkillType.Troop)
                    ){
                    let skillValue = this.getSkillValue(id, bi, generalInfo.skill_levels[bi])
                    if(skillValue['value_type'] == 1){
                        percentProduct += skillValue['value']
                    }
                    else{
                        baseProduct += skillValue['value']
                    }
                }
            }
            product += (baseProduct + mapBase) * (percentProduct + mapPercent + moralePercent)
        }
        return product
    }

    getGeneralStamina(generalId : number){
        const time = parseInt(new Date().getTime() / 1000 + '');
        const generalInfo = this.getGeneralState(generalId)
        const stamina = generalInfo.stamina
        const maxStamina = this.config.qualification.get((generalId-1).toString()).stamina
        const realStamina = Math.floor( (time - stamina.lastUpdate)/ this.config.parameter.general_stamina_recovery) + stamina.value
        if(realStamina >= maxStamina){
            return maxStamina
        }
        return realStamina
    }

    updateGeneralStamina(generalId: number){
        const time = parseInt(new Date().getTime() / 1000 + '');
        let generalInfo = this.getGeneralState(generalId)
        const stamina = generalInfo.stamina
        const maxStamina = this.config.qualification.get((generalId-1).toString()).stamina
        const realStamina = Math.floor( (time - stamina.lastUpdate)/ this.config.parameter.general_stamina_recovery) + stamina.value
        if(realStamina > stamina.value && realStamina < maxStamina){
            generalInfo.stamina = {
                lastUpdate: stamina.lastUpdate + (realStamina - stamina.value) * this.config.parameter.general_stamina_recovery,
                value: realStamina
            }
            this.state.update(
                {
                    [`generalList.${generalId}`] : generalInfo,
                }
            )
        }
        else if(realStamina >= maxStamina){
            generalInfo.stamina = {
                lastUpdate: time,
                value: maxStamina
            }
            this.state.update(
                {
                    [`generalList.${generalId}`] : generalInfo,
                }
            )
        }
    }
    useGeneralStamina(generalId : number, amount: number): boolean{
        this.updateGeneralStamina(generalId)
        let generalInfo = this.getGeneralState(generalId)
        if(this.getGeneralStamina(generalId) >= amount){
            generalInfo.stamina.value -= amount
            this.state.update(
                {
                    [`generalList.${generalId}`] : generalInfo,
                }
            )
            return true
        }
        return false
    }
    

    updateBoost(){
        this.boost.setProduction(StateName.General, ResouceType.Silver, this.getGeneralProduction(ResouceType.Silver))
        this.boost.setProduction(StateName.General, ResouceType.Troop, this.getGeneralProduction(ResouceType.Troop))
    }

    getGeneralBattleStatus(generalId : number){
        const generalInfo = this.getGeneralState(generalId)
        if( generalId == -1 ){
            let base = {
                [SkillType.Attack]: this.config.parameter.default_defense_general[0],
                [SkillType.Defense]: this.config.parameter.default_defense_general[1],
                [SkillType.Load]: this.config.parameter.default_defense_general[2]
            }
            const cityStatus = this.city.getBattleStatus(1)
            let sum = {
                [SkillType.Attack]: base[SkillType.Attack] + cityStatus.attack,
                [SkillType.Defense]:  base[SkillType.Defense] + cityStatus.defense,
                [SkillType.Load]: base[SkillType.Load]
            }
            return{
                sum: sum,
                base: base
            }
        }
        const generalLevel = generalInfo.level
        let base = {
            [SkillType.Attack]: this.getGeneralAbility(generalId, generalLevel, GeneralAbility.Attack),
            [SkillType.Defense]: this.getGeneralAbility(generalId, generalLevel, GeneralAbility.Defense),
            [SkillType.Load]: this.getGeneralAbility(generalId, generalLevel, GeneralAbility.Load)
        }
        let extraValue = {
            [SkillType.Attack]: 0,
            [SkillType.Defense]: 0,
            [SkillType.Load]: 0
        }
        let extraPercent = {
            [SkillType.Attack]: 1,
            [SkillType.Defense]: 1,
            [SkillType.Load]: 1
        }
      
        const row = this.getGeneralQualification(generalId)
        const cityStatus = this.city.getBattleStatus(row.general_type)
        extraValue[SkillType.Attack] = cityStatus.attack
        extraValue[SkillType.Defense] = cityStatus.defense
        for( let i = 0; i < row.general_skill.length; i++){
            const skillRow = this.getSkillInfo(row.general_skill[i])
            const skillLevel = generalInfo.skill_levels[i]
            const value = this.getSkillValue(generalId, i, skillLevel)
            if(skillRow.buff_type == SkillType.Attack || skillRow.buff_type == SkillType.Defense || skillRow.buff_type == SkillType.Load){
                if(value['value_type'] == 1){
                    extraPercent[skillRow.buff_type] += value['value']
                }
                else{
                    extraValue[skillRow.buff_type] += value['value']
                }
            }
        }

        //  buff table miss

        let mapBuffList = this.boost.getMapBuff()
        for( let mapBuff of mapBuffList){
            const skillRow = this.getSkillInfo(mapBuff)
            if(skillRow.buff_type == SkillType.Attack || skillRow.buff_type == SkillType.Defense || skillRow.buff_type == SkillType.Load){
                if(skillRow['value_type'] == 1){
                    extraPercent[skillRow.buff_type] += skillRow.buff_value
                }
                else{
                    extraValue[skillRow.buff_type] += skillRow.buff_value
                }
            }
        }

        let moralePercent = this.getMoralePercent()
        for(let key in extraPercent){
            extraPercent[key] += moralePercent
        }
        

        let sum = {
            [SkillType.Attack]: 0,
            [SkillType.Defense]: 0,
            [SkillType.Load]: 0
        }
        for( let type in sum ){
            sum[type] = (extraValue[type] + base[type]) * extraPercent[type]
        }
        return{
            sum: sum,
            base: base
        }
    }

    getDefenseInfo(): DefenseInfo{
        let re : DefenseInfo = {
            generalType: 1,
            generalId: -1,
            generalLevel: 1,
            attack: 0,
            defense: 0,
            silver: 0,
            troop: 0,
            defenseMaxTroop: 0
        }
        re.silver = this.city.getResource(ResouceType.Silver)
        re.troop = this.city.getResource(ResouceType.Troop)
        re.defenseMaxTroop = this.getMaxDefenseTroop()
        let defenseGeneralId = -1
        if(this.state.defense_general != -1){
            defenseGeneralId = this.state.defense_general
        }
        else{
            let maxValue = 1;
            for(let idstring in this.state.generalList ){
                const id = parseInt(idstring)
                const generalInfo = this.state.generalList[idstring]
                if(generalInfo.able && this.checkDefenseBlock(id)){
                    let generalLevel = generalInfo.level
                    let tempValue = this.getGeneralAbility( id, generalLevel, GeneralAbility.Attack) + this.getGeneralAbility( id, generalLevel, GeneralAbility.Defense)
                    if(tempValue > maxValue){
                        maxValue = tempValue
                        defenseGeneralId = id
                    }
                }
            }
        }
        let status = this.getGeneralBattleStatus(defenseGeneralId)
            re.attack = status.sum[SkillType.Attack]
            re.defense = status.sum[SkillType.Defense]
        if(defenseGeneralId != -1){
            const row = this.getGeneralQualification(defenseGeneralId)
            re.generalType = row.general_type
            re.generalLevel = this.getGeneralLevel(defenseGeneralId)
        }
        else{
            re.generalType = this.config.parameter.default_defense_general[3]
        }
        re.generalId = defenseGeneralId
        return re
    }

     //1= infantry ；2=cavalry ；3=archer
    getGeneralTypeCoe(generalType1: number , generalType2: number){
        let re = 1;
        if(
            (generalType1 - generalType2 + 3) % 3 == 1
        ){
            re = 1.2
        }
        return re
    }

    getMaxAttackTroop(){
        return Math.min(this.city.getResource(ResouceType.Troop),this.city.getMaxAttackTroop())
    }

    getMaxDefenseTroop(){
        return Math.min(this.city.getResource(ResouceType.Troop),this.city.getMaxDefenseTroop())
    }

    battle( generalId : number , defenseInfo : DefenseInfo, remainTroop: number = -1, useStamina: boolean = true){
        const generalInfo = this.getGeneralState(generalId)
        if(!(this.checkIdAble(generalId) && generalInfo.able)){
            return {
                result: false,
                error: 'generalid-error'
            }
        }
        if(useStamina){
            if(!(this.useGeneralStamina(generalId, 1))){
                return{
                    result: false,
                    error: 'general-stamina-error'
                }
            }
        }
        const status = this.getGeneralBattleStatus(generalId)
        const generalRow = this.getGeneralQualification(generalId)
        const generalType = generalRow.general_type
        let ableTroop = this.getMaxAttackTroop()
        if(ableTroop == 0){
            return{
                result: false,
                error: 'do-not-have-troop'
            }
        }
        let attackInfo ={
            attack: status.sum[SkillType.Attack],
            defense: status.sum[SkillType.Defense],
            load: status.sum[SkillType.Load],
            generalType: generalType,
            ableTroop: remainTroop != -1? remainTroop : ableTroop
        }
        let remainTroopA = attackInfo.ableTroop
        let coeA = this.getGeneralTypeCoe(generalType, defenseInfo.generalType)
        let randomA = 0.9 + Math.random() * 0.2
        let remainTroopD = defenseInfo.defenseMaxTroop
        let coeD = this.getGeneralTypeCoe(defenseInfo.generalType, generalType)
        let randomD = 0.9 + Math.random() * 0.2
        let loopTime = 0
        while(true){
            loopTime++
            if(loopTime > 10000){
                throw "battle data error"
            }
            remainTroopD -= (( attackInfo.attack * randomA / defenseInfo.defense / randomD ) * coeA * remainTroopA / 10)
            if(remainTroopD <= 0){
                remainTroopD = 0
                break
            }
            remainTroopA -= (( defenseInfo.attack * randomD / attackInfo.defense / randomA ) * coeD * remainTroopD / 10 )
            if(remainTroopA <= 0){
                remainTroopA  = 0
                break
            }
        }
        let re : BattleResult = {
            result: true,
            win: false,
            attackTroopReduce: 0,
            defenseTroopReduce: 0,
            silverGet: 0,
            attackGloryGet: 0,
            defenseGloryGet: 0
        }
        re.attackTroopReduce = Math.floor(attackInfo.ableTroop - remainTroopA)
        re.defenseTroopReduce = Math.floor(Math.max(defenseInfo.troop, defenseInfo.defenseMaxTroop) - remainTroopD)
        re.attackGloryGet = Math.floor((attackInfo.attack + attackInfo.defense) *  re.defenseTroopReduce / 100 )
        re.defenseGloryGet = Math.floor((defenseInfo.attack + defenseInfo.defense) * re.attackTroopReduce / 100 )
        if(remainTroopA > 0 ){
            re.win = true
            re.silverGet = attackInfo.load + Math.floor(remainTroopA) * this.config.parameter.troops_base_load
        }
        else{
            re.win = false
        }
        if(re.win){
            re.attackGloryGet += this.config.parameter.battle_victory_get_glory
        }
        else{
            re.defenseGloryGet += this.config.parameter.battle_victory_get_glory
        }
        this.city.useTroop(re.attackTroopReduce)
        return re
    }

    //should trigger when defense general change
    updateDefenseInfo(){
        const defenseInfoId = this.state.id.replace(StateName.General,StateName.DefenderInfo)
        let defenderInfo = this.getDefenseInfo() as any
        defenderInfo['unionId'] = this.state.unionId
        defenderInfo['glory'] = this.state.glory
        defenderInfo['username'] = parseStateId(defenseInfoId).username
        defenderInfo['fortressLevel'] = this.city.state.facilities[CityFacility.Fortress][0]
        defenderInfo['isProtected'] = this.boost.getStrategyStatus(StrategyType.Protect)
        new State<IDefenderInfoState>({id: defenseInfoId} as IDefenderInfoState, this.state.getWatcher()).update(defenderInfo)
    }

    getDefenseBlockInfo(generalId : number) : BlockDefenseInfo
    {
        let attackinfo = this.getGeneralBattleStatus(generalId)
        let row = this.getGeneralQualification(generalId)
        let username =  parseStateId(this.state.getId()).username
        let re: BlockDefenseInfo = {
            username: username,
            generalId: generalId,
            generalLevel: this.getGeneralLevel(generalId),
            generalType: row.general_type,
            attack: attackinfo.sum[SkillType.Attack],
            defense: attackinfo.sum[SkillType.Defense],
            troops: this.getMaxAttackTroop()
        }
        return re
    }

    checkDefenseBlock(generalId: number){
        if(this.state.defense_general == generalId){
            return false
        }
        for(let info of this.state.defenseBlockList){
            if(info.generalId == generalId){
                return false
            }
        }
        return true
    }

    defenseBlock(generalId: number, x_id: number, y_id: number){
        const generalInfo = this.getGeneralState(generalId)
        if(!(this.checkIdAble(generalId) && generalInfo.able)){
            return {
                result: false,
                error: 'generalid-error'
            }
        }
        if(!this.checkDefenseBlock(generalId)){
            return {
                result: false,
                error: 'one-block-can-only-defense-once'
            }
        }
        if(!(this.useGeneralStamina(generalId, 1))){
            return{
                result: false,
                error: 'general-stamina-error'
            }
        }
        let troop = this.getMaxAttackTroop()
        this.city.useTroop(troop)
        let defenseList = this.state.defenseBlockList
        defenseList.push(
            {
                generalId: generalId,
                x_id: x_id,
                y_id: y_id
            }
        )
        this.state.update(
            {
                'defenseBlockList': defenseList
            }
        )
        return {
            result: true
        }
    }

    miningBlock(generalId: number){
        const generalInfo = this.getGeneralState(generalId)
        if(!(this.checkIdAble(generalId) && generalInfo.able)){
            return {
                result: false,
                error: 'generalid-error'
            }
        }
        if(!(this.useGeneralStamina(generalId, 1))){
            return{
                result: false,
                error: 'general-stamina-error'
            }
        }
        return {
            result: true
        }
    }

    cancelDefenseBlock(generalId: number, remainTroop: number){
        let defenseList = this.state.defenseBlockList
        for(let i = 0; i< defenseList.length; i++){
            let info = defenseList[i]
            if(info.generalId == generalId){
                defenseList.splice(i, 1)
                break;
            }
        }
        this.state.update(
            {
                'defenseBlockList': defenseList
            }
        )
        this.city.useTroop(-remainTroop)
    }

    transferTransRecord(record: BattleTransRecord): BattleRecord{
        let username = parseStateId(this.state.getId()).username
        let type = BattleType.Attack
        let result = true
        let myInfo: BattleRecordInfo
        let enemyInfo: BattleRecordInfo
        if(record.attackInfo.username == username){
            type = BattleType.Attack
            result = record.result
            myInfo = record.attackInfo
            enemyInfo = record.defenseInfo
        }
        else{
            type = BattleType.Defense
            result = !record.result
            myInfo = record.defenseInfo
            enemyInfo = record.attackInfo
        }
        let row = this.mapConfig.get(record.blockInfo.x_id, record.blockInfo.y_id)
        let newBlockInfo = {
            x_id: row.x_id,
            y_id: row.y_id,
            type: row.type,
            parameter: row.parameter
        }
        let re :BattleRecord = {
            myInfo: myInfo,
            enemyInfo: enemyInfo,
            blockInfo: newBlockInfo,
            result : result,
            type: type,
            timestamp: record.timestamp,
            recordType: record.recordType
        }
        return re
    }

    addGlory(count : number){
        let nowCount = this.state.glory
        this.state.update(
            {
                'glory' : nowCount + count
            }
        )       
    }

    addextraGeneral( ids: number[] ){
        let generalInfos = this.state.generalList;
        const time = getTimeStamp()
        for(let id of ids){
            if(generalInfos[id+''] != undefined){
                continue;
            }
            const row = this.getGeneralQualification(id)
            if(row == undefined){
                continue;
            }
            let generalInfo : GeneralInfo = {
                id: row.general_id,
                level: 1,
                able: false,
                skill_levels: new Array(3).fill(1),
                stamina: {
                    value: row.stamina,
                    lastUpdate: time
                }
            }
            generalInfos[id + ""] = generalInfo
        }
        this.state.update(
            {'generalList' : generalInfos}
        )
    }

    getIconId(){
        return this.state.iconId
    }

    setIconId(id: number){
        if(!this.checkIdAble(id)){
            return{
                result: false,
                error: 'does-not-have-this-icon'
            }
        }
        this.state.update(
            {'iconId': id}
        )
        return{
            result: true
        }
    }

    getMorale(){
        let morale = this.state.morale.value
        if(morale <= normalMorale){
            return Math.max(morale, minMorale)
        }
        else{
            const time = getTimeStamp()
            let reduceNumber = Math.floor((time - this.state.morale.lastUpdate) / moraleReduceGap)
            if(reduceNumber < 0){
                throw "time error when reduce morale"
            }
            return Math.max(normalMorale, morale - reduceNumber)
        }
    }

    offsetMorale(amount: number){
        const time = getTimeStamp()
        let morale = this.getMorale() + amount
        morale = Math.max(morale, minMorale)
        morale = Math.min(morale, maxMorale)
        this.state.update(
            {
                morale: {
                    value: morale,
                    lastUpdate: time
                }
            }
        )
    }

    getMoralePercent(){
        let morale = this.getMorale()
        return morale / 100 - 1
    }

    getRecoverMoraleInfo(){
        let morale = this.getMorale()
        let re = {
            silverUse: 0,
            silverAble: true,
            goldUse:0,
            goldAble: true
        }
        if(morale >= normalMorale){
            return re
        }
        re.silverUse = this.boost.getSilverPosProduction() * (normalMorale - morale) * 0.15
        re.silverAble = this.city.getResource(ResouceType.Silver) >= re.silverUse ? true : false
        re.goldUse = this.config.parameter.recovery_one_morale_need_gold * (normalMorale - morale)
        re.goldAble = this.city.state.gold >= re.goldUse ? true : false
        return re
    }

    recoverMorale(type : RecoverMoraleType){
        let morale = this.getMorale()
        if(morale >= normalMorale){
            return{
                result: false,
                error: 'no-need-to-recover-morale'
            }
        }
        let info = this.getRecoverMoraleInfo()
        if(type == RecoverMoraleType.Gold){
            if(info.goldAble){
                this.city.useGold(info.goldUse)
                this.offsetMorale( normalMorale - morale )
                return{
                    result: true
                }
            }
            else{
                return{
                    result: false,
                    error: 'gold-is-not-enough'
                }
            }
        }
        else if(type == RecoverMoraleType.Silver){
            if(info.silverAble){
                this.city.useSilver(info.silverUse)
                this.offsetMorale( normalMorale - morale )
                return{
                    result: true
                }
            }
            else{
                return{
                    result: false,
                    error: 'silver-is-not-enough'
                }
            }
        }
        return{
            result: false,
            error: 'undefined-type'
        }
    }



}