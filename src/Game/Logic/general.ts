import { ConfigContainer } from '../../Core/config';
import { GeneralGdsRow ,BuffGdsRow, BuffTable, FacilityLimit, MapConfig, MapConfigFromGDS, normalMorale, minMorale, moraleReduceGap, maxMorale, VipType} from '../DataConfig'
import { BlockDefenseInfo, GeneralInfo, IDefenderInfoState, IGeneralState, ResouceInfo} from '../State';
import { CityFacility, RecoverMoraleType, ResouceType, StateName, StateTransition } from '../Const';
import { City } from './game';
import { Map } from "./map";
import { GeneralConfigFromGDS , Parameter, VipConfig, vipConfigFromGDS} from '../DataConfig';
import { IBoost } from './boost';
import { copyObj, State } from '../../Core/state';
import { getRandom, getTimeStamp, parseStateId } from '../Utils';
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
    records: []
    txType: number
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
    unionId: number
    iconId: number
}

export class General{
    state: IGeneralState
    config: GeneralConfig
    mapConfig: MapConfig
    vipConfig: VipConfig
    map: Map
    city : City
    boost : IBoost
    constructor(state: IGeneralState, city: City) {
        this.state = state;
        this.config = GeneralConfigFromGDS;
        this.vipConfig = vipConfigFromGDS;
        this.mapConfig = MapConfigFromGDS
        this.city = city
    }

    setMap( map : Map){
        this.map = map
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
            return {
                result : false, 
                generalId: id,
                txType: StateTransition.AbleGeneral,
                error: 'index-error'
            }
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
        return {
            txType: StateTransition.AbleGeneral,
            generalId: id,
            result : true
        }
    }

    disableGeneral(id: number){
        this.city.updateResource(ResouceType.Silver)
        if(!this.checkIdAble(id)){
            return {
                result : false, 
                generalId: id,
                txType: StateTransition.DisableGeneral,
                error: 'index-error'
            } 
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
        return {
            generalId: id,
            txType: StateTransition.DisableGeneral,
            result : true
        }
    }

    setDefenseGeneral(id : number){
        if(!this.checkIdAble(id)){
            return {
                result : false, 
                generalId: id,
                txType: StateTransition.SetDefenseGeneral,
                error: 'id-error'
            } 
        }
        const generalInfo = this.getGeneralState(id)
        if(!generalInfo.able){
            return {
                result : false, 
                generalId: id,
                txType: StateTransition.SetDefenseGeneral,
                error: 'general-not-able'
            }
        }
        if(!this.checkDefenseBlock(id)){
            return {
                result : false, 
                generalId: id,
                txType: StateTransition.SetDefenseGeneral,
                error: 'id-error'
            } 
        }
        this.state.update(
            {
                defense_general: id
            }
        )
        return {
            txType: StateTransition.SetDefenseGeneral,
            generalId: id,
            result : true
        }
    }

    getGeneralUpgradeNeed(id: number, currentLevel: number): number{
        if(!this.checkIdAble(id)){
            return 0
        }
        const row = this.getGeneralQualification(id)
        const sumq = row.qualification_attack + row.qualification_load + row.qualification_silver_product + row.qualification_troop_recruit + row.qualification_defense
        let re = 0
        re = Math.ceil(20 * sumq * currentLevel)
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
        let generalInfo = this.getGeneralState(id)
        const level = generalInfo.level
        if(!this.checkIdAble(id)){
            return {
                txType: StateTransition.UpgradeGeneral,
                generalId: id,
                levelTo:  level + 1,
                result : false, 
                error: 'index-error'
            } 
        }
        if(level == this.config.parameter.general_max_level){
            return {
                txType: StateTransition.UpgradeGeneral,
                generalId: id,
                levelTo:  level + 1,
                result : false, 
                error: 'general-level-is-max'
            } 
        }
        const cost = this.getGeneralUpgradeNeed(id, level)
        generalInfo.level = level + 1
        if(this.city.useSilver(cost)){
            this.state.update({
                [`generalList.${id}`] : generalInfo,
            })
            return {
                result: true,
                txType: StateTransition.UpgradeGeneral,
                generalId: id,
                levelTo:  generalInfo.level
            }
        }
        return {
            txType: StateTransition.UpgradeGeneral,
            generalId: id,
            levelTo:  level + 1,
            result : false, 
            error: 'silver-not-enough-error'
        } 
    }

    getGeneralAbility(id: number, level: number ,typ : GeneralAbility): number{
        const row = this.getGeneralQualification(id)
        switch(typ){
            case GeneralAbility.Attack:
            case GeneralAbility.Defense:
                return row[typ] * 10 * level
            case GeneralAbility.Load:
                //qualification_load
                return row[typ] * 100 * level
            case GeneralAbility.Silver:
                return parseFloat((20 * row[typ] * level).toFixed(2))
            case GeneralAbility.Troop:
                return parseFloat((0.1 * row[typ] * level).toFixed(2))
        }
    }

    getSkillUpdateNeed( generalId : number, skillIndex : number, level: number): number{
        const row : GeneralGdsRow = this.getGeneralQualification(generalId)
        const skillId = row.general_skill[skillIndex]
        const buff = this.getSkillInfo(skillId)
        let cost = 0
        switch(buff.buff_type){
            case SkillType.Attack:
                cost = row.qualification_attack * level
                break
            case SkillType.Defense:
                cost = row.qualification_defense * level
                break
            case SkillType.Load:
                cost = row.qualification_load * level
                break
            case SkillType.Silver:
                cost = row.qualification_silver_product * level
                break
            case SkillType.Troop:
                cost = row.qualification_troop_recruit * level
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
                    re['value'] = row.qualification_silver_product * 20 * level
                    break
                case SkillType.Troop:
                    re['value'] = row.qualification_troop_recruit * 0.1 * level
                    break
                case SkillType.Attack:
                    re['value'] = 10 * row.qualification_attack * level
                    break
                case SkillType.Defense:
                    re['value'] = 10 * row.qualification_defense * level
                    break
                case SkillType.Load:
                    re['value'] = 100 * row.qualification_load * level
                    break
            }
        }
        return re
    }

    checkGeneralSkillUpgrade(generalId : number, skillIndex : number):boolean{
        const generalInfo = this.getGeneralState(generalId);
        const generalLevel = generalInfo.level;
        const skillLevelLimit = Math.floor(generalLevel/5) + 1;
        const level = generalInfo.skill_levels[skillIndex]
        if(level == this.config.parameter.general_skill_max_level){
            return false
        }
        const need = this.getSkillUpdateNeed(generalId, skillIndex, level)
        if(this.city.state.gold >= need && level < skillLevelLimit){
            return true
        }
        return false
    }

    upgradeGeneralSkill(generalId : number, skillIndex : number){
        this.city.updateResource(ResouceType.Silver)
        let generalInfo = this.getGeneralState(generalId)
        const level = generalInfo.skill_levels[skillIndex]
        if(!this.checkGeneralSkillUpgrade(generalId, skillIndex)){
            return {
                txType: StateTransition.UpgradeGeneralSkill,
                generalId: generalId,
                skillIndex: skillIndex,
                levelTo: generalInfo.skill_levels[skillIndex],
                result : false, 
                error: 'silver-not-enough-error'
            } 
        }
        if( level == this.config.parameter.general_skill_max_level ){
            return {
                txType: StateTransition.UpgradeGeneralSkill,
                generalId: generalId,
                skillIndex: skillIndex,
                levelTo: generalInfo.skill_levels[skillIndex],
                result : false, 
                error: 'skill-is-max-level'
            } 
        }
        const need = this.getSkillUpdateNeed(generalId, skillIndex, level)
        if(this.city.useGold(need)){
            generalInfo.skill_levels[skillIndex] = level + 1
            this.state.update({
                [`generalList.${generalId}`] : generalInfo,
            })
            return {
                result : true,
                txType: StateTransition.UpgradeGeneralSkill,
                generalId: generalId,
                skillIndex: skillIndex,
                levelTo: generalInfo.skill_levels[skillIndex]
            }
        }
        return {
            txType: StateTransition.UpgradeGeneralSkill,
            generalId: generalId,
            skillIndex: skillIndex,
            levelTo: generalInfo.skill_levels[skillIndex],
            result : false, 
            error: 'silver-not-enough-error'
        } 
    }

    getGeneralProduction(typ : ResouceType){
        let mapBase = 0
        let mapPercent = 0
        let mapBuffList = this.boost.getMapBuff()
        let moralePercent = this.getMoralePercent()
        let tokenBuff = this.getTokenBuff()

        let username =  parseStateId(this.state.getId()).username
        let userScore = this.getUserScore(username);
        let vipBuffs = this.getVipBuffs(userScore);
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
            product += (baseProduct + mapBase) * (percentProduct + mapPercent + moralePercent + tokenBuff + (vipBuffs[typ] || 0))
            console.log('product buff:', product);
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

    getTokenBuff(){
        let tokenPriceInfo = this.map.tokenPriceInfo;
        let unions = {
            1: "BTC",
            2: "ETH",
            3: "USDT",
            4: "BNB"
        };
        let unionId = this.state.unionId;
        let token = unions[unionId] || '';
        if(token === ''){
            return 0;
        }

        let { initial, current } = tokenPriceInfo;
        let v1 = initial[token]/1 || 0;
        let v2 = current[token]/1 || 0;
        // console.log('getGeneralBattleStatus tokenBuff 1: ', {v1, v2, unionId, token, tokenPriceInfo});

        if(v1 === 0 || v2 === 0){
            return 0;
        }

        let tokenBuff = (v2 - v1)/v1;
            tokenBuff = Math.min(tokenBuff, 5);
        console.log('token buff: ', {unionId, tokenPriceInfo, tokenBuff});
        return tokenBuff;
    }

    getGeneralBattleStatus(generalId : number){
        let tokenBuff = this.getTokenBuff();

        let username =  parseStateId(this.state.getId()).username
        let userScore = this.getUserScore(username);
        let vipBuffs = this.getVipBuffs(userScore);

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
            [SkillType.Attack]: 1 + tokenBuff + vipBuffs[SkillType.Attack],
            [SkillType.Defense]: 1 + tokenBuff + vipBuffs[SkillType.Defense],
            [SkillType.Load]: 1 + tokenBuff + vipBuffs[SkillType.Load]
        }
        console.log('extraPercent buff:', extraPercent);
      
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

    battle( generalId : number , unionIds : any, defenseInfo : DefenseInfo, remainTroop: number = -1, useStamina: boolean = true){
        const generalInfo = this.getGeneralState(generalId)
        if(!(this.checkIdAble(generalId) && generalInfo.able)){
            return {
                result: false,
                txType: StateTransition.Battle,
                error: 'generalid-error'
            }
        }
        if(useStamina){
            let stamina = this.config.parameter.attack_player_need_stamina;
            if(!(this.useGeneralStamina(generalId, stamina))){
                return{
                    result: false,
                    txType: StateTransition.Battle,
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
                txType: StateTransition.Battle,
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
        let randomA = 0.9 + getRandom() * 0.2
        let remainTroopD = defenseInfo.defenseMaxTroop
        let coeD = this.getGeneralTypeCoe(defenseInfo.generalType, generalType)
        let randomD = 0.9 + getRandom() * 0.2
        let loopTime = 0

        let { attackUnionId, defenseUnionId } = unionIds;
        console.log('battlecity:', attackUnionId, defenseUnionId);

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
            defenseGloryGet: 0,
            records: [],
            txType: StateTransition.Battle
        }
        re.attackTroopReduce = Math.floor(attackInfo.ableTroop - remainTroopA)
        let realDefenseTroop = defenseInfo.defenseMaxTroop > defenseInfo.troop? defenseInfo.troop : defenseInfo.defenseMaxTroop
        re.defenseTroopReduce = Math.floor(realDefenseTroop - remainTroopD)
        // re.attackGloryGet = Math.floor(Math.sqrt((attackInfo.attack + attackInfo.defense) *  re.defenseTroopReduce / 100 ))
        if(attackUnionId !== defenseUnionId){
            re.attackGloryGet = Math.floor(Math.sqrt((defenseInfo.attack + defenseInfo.defense)*  re.defenseTroopReduce)/100)            
        }
        // re.defenseGloryGet = Math.floor(Math.sqrt((defenseInfo.attack + defenseInfo.defense) * re.attackTroopReduce / 100 ))
        re.defenseGloryGet = Math.floor(Math.sqrt((attackInfo.attack + attackInfo.defense)* re.attackTroopReduce)/100)
        if(remainTroopA > 0 ){
            re.win = true
            re.silverGet = attackInfo.load + Math.floor(remainTroopA) * this.config.parameter.troops_base_load
        }
        else{
            re.win = false
        }
        if(re.win){
            if(attackUnionId !== defenseUnionId){
                re.attackGloryGet += this.config.parameter.battle_victory_get_glory
            }
        }
        else{
            re.defenseGloryGet += this.config.parameter.battle_victory_get_glory
        }
        this.city.useTroop(re.attackTroopReduce)
        this.city.updateInjuredTroops(re.attackTroopReduce, 'battle')
        console.log('updateInjuredTroops battle.attackTroopReduce', re);
        return re
    }

    healTroops(typ: string, amount: number){
        console.log('healTroops:', typ, amount);
        if(typ === 'silver'){
          return this.city.healTroopsBySilver(amount);
        }
        if(typ === 'gold'){
          return this.city.healTroopsByGold(amount);
        }
    }

    //username === enamy
    spyForEnamy( username: string, generalId: number) {
        if(username == ''){
          return {
            result: false,
            txType: StateTransition.SpyEnamy,
            err: 'username require'
          }
        }

        let stamina = this.config.parameter.spy_need_stamina;
        if(!(this.useGeneralStamina(generalId, stamina))){
            return{
                result: false,
                txType: StateTransition.SpyEnamy,
                error: 'general-stamina-error'
            }
        }

        //beacuse of no mediator, spy data in callback by index.ts(async spyEnamy)
        return {
            result: true,
            txType: StateTransition.SpyEnamy
        };
    }

    //should trigger when defense general change
    updateDefenseInfo(){
        const defenseInfoId = this.state.id.replace(StateName.General,StateName.DefenderInfo)
        let defenderInfo = this.getDefenseInfo() as any
        defenderInfo['unionId'] = this.state.unionId
        defenderInfo['iconId'] = this.state.iconId
        defenderInfo['glory'] = this.state.glory
        defenderInfo['username'] = parseStateId(defenseInfoId).username
        defenderInfo['fortressLevel'] = this.city.state.facilities[CityFacility.Fortress][0]
        defenderInfo['isProtected'] = this.boost.getStrategyStatus(StrategyType.Protect) || this.boost.getStrategyStatus(StrategyType.Protect1) || this.isNewPlayerProtect()
        new State<IDefenderInfoState>({id: defenseInfoId} as IDefenderInfoState, this.state.getWatcher()).update(defenderInfo)
    }

    getDefenseBlockInfo(generalId : number, troops: number) : BlockDefenseInfo{
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
            troops: troops? troops : this.getMaxDefenseTroop(),
            unionId: this.state.unionId,
            iconId: this.state.iconId
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
                txType: StateTransition.DefenseBlock,
                error: 'generalid-error'
            }
        }
        if(!this.checkDefenseBlock(generalId)){
            return {
                result: false,
                txType: StateTransition.DefenseBlock,
                error: 'one-block-can-only-defense-once'
            }
        }
        let stamina = this.config.parameter.defense_plots_need_stamina;
        if(!(this.useGeneralStamina(generalId, stamina))){
            return{
                result: false,
                txType: StateTransition.DefenseBlock,
                error: 'general-stamina-error'
            }
        }
        let troop = this.getMaxDefenseTroop()
        if(troop <= 0){
            return{
                result: false,
                txType: StateTransition.DefenseBlock,
                error: 'troop-not-enough'
            }
        }
        this.city.useTroop(troop)
        // this.city.updateInjuredTroops(troop, 'battle')
        // console.log('updateInjuredTroops defenseBlock', troop);

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
            result: true,
            txType: StateTransition.DefenseBlock,
            troops: troop
        }
    }

    miningBlock(generalId: number){
        const generalInfo = this.getGeneralState(generalId)
        if(!(this.checkIdAble(generalId) && generalInfo.able)){
            return {
                result: false,
                txType: StateTransition.MiningBlock,
                error: 'generalid-error'
            }
        }
        let stamina = this.config.parameter.gather_need_stamina;
        if(!(this.useGeneralStamina(generalId, stamina))){
            return{
                result: false,
                txType: StateTransition.MiningBlock,
                error: 'general-stamina-error'
            }
        }
        return {
            txType: StateTransition.MiningBlock,
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
            parameter: row.parameter,
            durabilityReduce: record.blockInfo.durabilityReduce ?? 0
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

    addUserScores(scores: any){
        let userScores = this.state.userScores;
        for(var username in scores){
            userScores[username.toLowerCase()] = scores[username];
        }
        this.state.update({
            'userScores': userScores
        });
    }

    getUserScore(username: string){
        let userScores = this.state.userScores || {};
        return userScores[username.toLowerCase()] || 0;
    }

    getVipBuffs(userScore: number){
        let scores = this.vipConfig['config'];
        let minScore = scores[0].score;
        let maxScore = scores[scores.length - 1].score;

        if(userScore >= maxScore){
            let buffs: VipType = scores[scores.length - 1];
            console.log('vip buff: ', {userScore, buffs});
            return buffs;
        }

        let buffs: VipType;
        for(var i=0;i<scores.length-1;i++){
          if(userScore >= scores[i].score && userScore < scores[i+1].score){
            buffs = scores[i];
          }
        }
        console.log('vip buff: ', {userScore, buffs});
        return buffs;
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
                txType: StateTransition.SetIconId,
                error: 'does-not-have-this-icon'
            }
        }
        this.state.update(
            {'iconId': id}
        )
        return{
            result: true,
            txType: StateTransition.SetIconId
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
                txType: StateTransition.RecoverMorale,
                error: 'no-need-to-recover-morale'
            }
        }
        let info = this.getRecoverMoraleInfo()
        if(type == RecoverMoraleType.Gold){
            if(info.goldAble){
                this.city.useGold(info.goldUse)
                this.offsetMorale( normalMorale - morale )
                return{
                    txType: StateTransition.RecoverMorale,
                    result: true
                }
            }
            else{
                return{
                    result: false,
                    txType: StateTransition.RecoverMorale,
                    error: 'gold-is-not-enough'
                }
            }
        }
        else if(type == RecoverMoraleType.Silver){
            if(info.silverAble){
                this.city.useSilver(info.silverUse)
                this.offsetMorale( normalMorale - morale )
                return{
                    txType: StateTransition.RecoverMorale,
                    result: true
                }
            }
            else{
                return{
                    result: false,
                    txType: StateTransition.RecoverMorale,
                    error: 'silver-is-not-enough'
                }
            }
        }
        return{
            result: false,
            txType: StateTransition.RecoverMorale,
            error: 'undefined-type'
        }
    }

    isNewPlayerProtect(): boolean{
        let time = getTimeStamp()
        if(
            (this.city.state.firstLogin == -1 || time - this.city.state.firstLogin < this.config.parameter.new_player_protect_times)
            && this.state.lastBattle == -1
            )
        {
            return true
        }
        return false
    }

    setLastBattle(){
        let time = getTimeStamp()
        this.state.update(
            { lastBattle: time }
        )
    }
}
