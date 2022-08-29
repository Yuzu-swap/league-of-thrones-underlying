import { ConfigContainer } from '../../Core/config';
import { GeneralGdsRow ,BuffGdsRow, BuffTable} from '../DataConfig'
import { BlockDefenseInfo, IDefenderInfoState, IGeneralState , ResouceInfo} from '../State';
import { ResouceType, StateName } from '../Const';
import { City } from './game';
import { GeneralConfigFromGDS , Parameter} from '../DataConfig';
import { IBoost } from './boost';
import { State } from '../../Core/state';
import { parseStateId } from '../Utils';
import { BattleTransRecord } from '../Controler/transition';

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
    }
    type: BattleType
    result: boolean
  }

export interface BattleRecordInfo{
    username: string
    generalId: number
    generalLevel: number
    troopReduce: number
    silverGet: number
    gloryGet: number
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
    
    checkIdAble(id : number): boolean{
        let len = Object.keys(this.config.qualification.configs).length
        if(id > len|| id <= 0){
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
        this.city.updateResource(ResouceType.Silver)
        if(!this.checkIdAble(id)){
            return {result : false, error: 'index-error'} 
        }
        this.state.able[id - 1] = false
        if(this.state.defense_general == id){
            this.state.update(
                {
                    able : this.state.able,
                    defense_general : -1
                }
            )
        }
        else{
            this.state.update(
                {
                    able : this.state.able
                }
            )
        }
        return {result : true}
    }

    setDefenseGeneral(id : number){
        if(!this.checkIdAble(id)){
            return {result : false, error: 'id-error'} 
        }
        if(!this.state.able[id - 1]){
            return {result : false, error: 'general-not-able'}
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
        const sumq = row.qualification_attack + row.qualification_load + row.qualification_silver_product + row.qualification_troop_recruit
        let re = 0
        re = Math.round((2* Math.pow(currentLevel, 2) * currentLevel + 20) * sumq / 10) * 10
        return re 
    }

    checkUpgradeGeneral(id: number): boolean{
        if(!this.checkIdAble(id)){
            return false
        }
        const level = this.state.levels[id - 1]
        const cost = this.getGeneralUpgradeNeed(id, level)
        if(this.city.getResource(ResouceType.Silver) >= cost){
            return true
        }
        return false
    }

    getGeneralLevel( id : number): number{
        if(this.checkIdAble(id)){
            return this.state.levels[id - 1]
        }
        return 1
    }

    upgradeGeneral( id: number ){
        this.city.updateResource(ResouceType.Silver)
        if(!this.checkIdAble(id)){
            return {result : false, error: 'index-error'} 
        }
        const level = this.state.levels[id - 1]
        if(level == this.config.parameter.general_max_level){
            return {result : false, error: 'general-level-is-max'} 
        }
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
        const level = this.state.skill_levels[generalId -1][skillIndex]
        if( level == this.config.parameter.general_skill_max_level ){
            return {result : false, error: 'skill-is-max-level'} 
        }
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

    getGeneralStamina(generalId : number){
        const time = parseInt(new Date().getTime() / 1000 + '');
        const stamina = this.state.stamina[generalId - 1]
        const maxStamina = this.config.qualification.get((generalId-1).toString()).stamina
        const realStamina = Math.floor( (time - stamina.lastUpdate)/ this.config.parameter.general_stamina_recovery) + stamina.value
        if(realStamina >= maxStamina){
            return maxStamina
        }
        return realStamina
    }

    updateGeneralStamina(generalId: number){
        const time = parseInt(new Date().getTime() / 1000 + '');
        let staminaList = this.state.stamina
        const stamina = this.state.stamina[generalId - 1]
        const maxStamina = this.config.qualification.get((generalId-1).toString()).stamina
        const realStamina = Math.floor( (time - stamina.lastUpdate)/ this.config.parameter.general_stamina_recovery) + stamina.value
        if(realStamina > stamina.value && realStamina < maxStamina){
            staminaList[generalId - 1] = {
                lastUpdate: stamina.lastUpdate + (realStamina - stamina.value) * this.config.parameter.general_stamina_recovery,
                value: realStamina
            }
            this.state.update(
                {
                    'stamina': staminaList
                }
            )
        }
        else if(realStamina >= maxStamina){
            staminaList[generalId - 1] = {
                lastUpdate: time,
                value: maxStamina
            }
            this.state.update(
                {
                    'stamina': staminaList
                }
            )
        }
    }
    useGeneralStamina(generalId : number, amount: number): boolean{
        this.updateGeneralStamina(generalId)
        let staminaList = this.state.stamina
        if(this.getGeneralStamina(generalId) > amount){
            staminaList[generalId - 1].value -= amount
            this.state.update(
                {
                    'stamina' : staminaList
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
        const generalLevel = this.state.levels[generalId - 1]
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
            const skillLevel = this.state.skill_levels[generalId - 1][i]
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
        re.defenseMaxTroop = this.city.getMaxDefenseTroop()
        let defenseGeneralId = -1
        if(this.state.defense_general != -1){
            defenseGeneralId = this.state.defense_general
        }
        else{
            let maxValue = 1;
            for(let i = 0 ; i < this.state.able.length; i++){
                if(this.state.able[i]){
                    let generalLevel = this.state.levels[i]
                    let tempValue = this.getGeneralAbility(i + 1, generalLevel, GeneralAbility.Attack) + this.getGeneralAbility(i + 1, generalLevel, GeneralAbility.Defense)
                    if(tempValue > maxValue){
                        maxValue = tempValue
                        defenseGeneralId = i + 1 
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
            re.generalLevel = this.state.levels[defenseGeneralId - 1]
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
        return Math.max(this.city.getResource(ResouceType.Troop),this.city.getMaxAttackTroop())
    }

    battle( generalId : number , defenseInfo : DefenseInfo, remainTroop: number = -1, useStamina: boolean = true){
        if(!(this.checkIdAble(generalId) && this.state.able[generalId - 1])){
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
        let remainTroopD = Math.max(defenseInfo.troop, defenseInfo.defenseMaxTroop) 
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
        delete defenderInfo['defenseMaxTroop']
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
            generalLevel: this.state.levels[generalId - 1],
            generalType: row.general_type,
            attack: attackinfo.sum[SkillType.Attack],
            defense: attackinfo.sum[SkillType.Defense],
            troops: this.getMaxAttackTroop()
        }
        return re
    }

    checkDefenseBlock(generalId: number, x_id: number, y_id: number){
        for(let info of this.state.defenseBlockList){
            if(info.generalId == generalId){
                return false
            }
            if(info.x_id == x_id && info.y_id == y_id){
                return false
            }
        }
        return true
    }

    defenseBlock(generalId: number, x_id: number, y_id: number){
        if(!(this.checkIdAble(generalId) && this.state.able[generalId - 1])){
            return {
                result: false,
                error: 'generalid-error'
            }
        }
        if(!this.checkDefenseBlock(generalId, x_id, y_id)){
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
        let re :BattleRecord = {
            myInfo: myInfo,
            enemyInfo: enemyInfo,
            blockInfo: record.blockInfo,
            result : result,
            type: type
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

}