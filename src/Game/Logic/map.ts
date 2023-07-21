import { copyObj } from "../../Core/state";
import { mapIdOffset, StateName, StateTransition } from "../Const";
import { BattleRecordType, BattleTransRecord } from "../Controler/transition";
import { GenBlockDefenseTroop, MapConfig, MapConfigFromGDS, MapGDS, Parameter, parameterConfig, RankReward, SeasonConfig, SeasonConfigFromGDS } from "../DataConfig";
import { BelongInfo, BlockDefenseInfo, CampInfo, IBlockState, IMapGlobalState, InitState, IRewardGlobalState, ISeasonConfigState, ITokenPriceInfoState, RewardResult } from "../State";
import { SeasonStatus } from "../Throne/map";
import { getTimeStamp, getTxHash, parseStateId } from "../Utils";
import { IBoost } from "./boost";
import { BattleResult, BattleType, DefenseInfo, General } from "./general";

const DefaultTroopRecoverTime = 60 * 30
const DurabilityRecoverTime = 60 * 30

export enum UnionWinStatus {
    Normal = 'Normal',
    WaitToWin = 'WaitToWin',
    HaveWin = 'HaveWin'
}

export interface innerCancelBlockDefense{
    generalId: number,
    username: string
}

export class Map{
    gState: IMapGlobalState
    blockStates:{[key: string]: IBlockState} 
    mapConfig: MapConfig
    seasonState: ISeasonConfigState
    tokenPriceInfo: ITokenPriceInfoState
    seasonConfig: SeasonConfig
    rewardGlobalState : IRewardGlobalState
    parameter: Parameter
    boost: IBoost
    general: General
    constructor( 
        gState: IMapGlobalState, 
        seasonState: ISeasonConfigState, 
        rewardGlobalState : IRewardGlobalState,
        tokenPriceInfo : ITokenPriceInfoState ){
        this.gState = gState
        this.blockStates = {}
        this.mapConfig = MapConfigFromGDS
        this.parameter = parameterConfig
        this.seasonConfig = SeasonConfigFromGDS
        this.seasonState = seasonState
        this.tokenPriceInfo = tokenPriceInfo
        this.rewardGlobalState = rewardGlobalState
    }
    setBoost(boost:IBoost){
        this.boost = boost
    }

    setGeneral(general){
        this.general = general
    }

    getMapGDS(x_id: number, y_id: number){
        return this.mapConfig.get(x_id, y_id)
    }

    loadBlockStates( states : IBlockState[] ){
        for(let state of states){
            let x_id = state.x_id
            let y_id = state.y_id
            this.blockStates[x_id + "^" + y_id] = state
        }
    }

    getBlockState( x_id: number, y_id: number){
        return this.blockStates[ x_id + "^" + y_id ]
    }

    getBlockInitState(x_id: number, y_id: number){
        const state = InitState[ `${StateName.BlockInfo}:${x_id}^${y_id}`]
        return state
    }

    getBelongInfo(x_id: number, y_id: number): number{
        let xIndex = x_id + mapIdOffset;
        let yIndex = Math.floor((y_id + mapIdOffset) / 2)
        if(xIndex < 0 || yIndex < 0){
            return 0
        }
        if( 
            this.gState.campInfo.length > xIndex &&
            this.gState.campInfo[xIndex].length > yIndex 
        ){
            return this.gState.campInfo[xIndex][yIndex].unionId
        }
        return 0
    }

    getBlockBattleStatus(x_id: number, y_id: number): CampInfo {
        let xIndex = x_id + mapIdOffset;
        let yIndex = Math.floor((y_id + mapIdOffset) / 2)
        let defalutRe : CampInfo ={
            unionId: 0,
            attackEndTime: -1,
            protectEndTime: -1
        }
        if(xIndex < 0 || yIndex < 0){
            return defalutRe
        }
        if( 
            this.gState.campInfo.length > xIndex &&
            this.gState.campInfo[xIndex].length > yIndex 
        ){
            return this.gState.campInfo[xIndex][yIndex]
        }
        return defalutRe
    }

    changeBelongInfo(x_id: number, y_id: number, unionId: number, protectEnd: number){
        let xIndex = x_id  + mapIdOffset;
        let yIndex = Math.floor((y_id  + mapIdOffset) / 2)
        let infoMap = this.gState.campInfo
        infoMap[xIndex][yIndex].unionId = unionId
        infoMap[xIndex][yIndex].protectEndTime = protectEnd
        this.gState.update(
            {
                'campInfo': infoMap
            }
        )
    }

    changeGlobalLastAttack( x_id: number, y_id: number, attackEnd: number){
        let xIndex = x_id  + mapIdOffset;
        let yIndex = Math.floor((y_id  + mapIdOffset) / 2)
        let infoMap = this.gState.campInfo
        infoMap[xIndex][yIndex].attackEndTime = attackEnd
        this.gState.update(
            {
                'campInfo': infoMap
            }
        )
    }

    checkBetween(unionId : number, x_id: number, y_id: number){
        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let re = false
        for(let i = 0; i < 6; i++){
            let tempX = x_id + xOffset[i]
            let tempY = y_id + yOffset[i]
            if(this.getBelongInfo(tempX, tempY) == unionId){
                re = true
            }
        }
        return true
    }

    defenseBlock(x_id: number, y_id: number, info : BlockDefenseInfo ){
        let blockState = this.getBlockState(x_id, y_id)
        let defenseList = blockState.defenseList
        defenseList.push(info)
        blockState.update(
            {
                'defenseList': defenseList
            }
        )
    }

    cancelDefenseBlock( x_id: number, y_id: number, username: string, generalId: number){
        let blockState = this.getBlockState(x_id, y_id)
        let defenseList = blockState.defenseList
        let remainTroop = 0
        for(let i = 0; i< defenseList.length; i++){
            if(defenseList[i].username == username && defenseList[i].generalId == generalId){
                remainTroop = defenseList[i].troops
                defenseList.splice(i, 1)
                break
            }
        }
        blockState.update(
            {
                'defenseList': defenseList
            }
        )
        return remainTroop
    }

    getDefenseList( x_id: number, y_id: number, defaultDefense : boolean){
        let time = getTimeStamp()
        let blockState = this.getBlockState(x_id, y_id)
        if(!blockState){
            return []
        }
        if(defaultDefense){
            if(time - blockState.lastAttachTime > DefaultTroopRecoverTime){
                return GenBlockDefenseTroop(x_id, y_id)
            }
            else{
                return blockState.defaultDefense
            }
        }
        else{
            return blockState.defenseList
        }
    }

    transBlockDefenseInfoToGeneralDefense( info: BlockDefenseInfo ){
        let re : DefenseInfo = {
            generalId : info.generalId,
            generalLevel: info.generalLevel,
            generalType: info.generalType,
            attack: info.attack,
            defense: info.defense,
            troop: info.troops,
            silver: 0,
            defenseMaxTroop: info.troops
        }
        return re
    }

    checkIfCanAttack( x_id: number, y_id: number ){
        let blockState = this.getBlockState(x_id, y_id);
        console.log('getBlockState:', { x_id, y_id }, blockState);
        let time = getTimeStamp();
        if(blockState.belong.updateTime == -1 || time - blockState.belong.updateTime > this.parameter.occupy_block_protect_times){
            return true
        }
        return false
    }

    getProtectRemainTime(x_id: number, y_id: number){
        let blockState = this.getBlockState(x_id, y_id)
        let time = getTimeStamp();
        if(blockState.belong.updateTime == -1 || time - blockState.belong.updateTime > this.parameter.occupy_block_protect_times){
            return 0
        }
        return blockState.belong.updateTime + this.parameter.occupy_block_protect_times - time
    }

    attackBlocksAround(x_id: number, y_id: number, generalId: number, remainTroop: number, onBelongChange: () => void){
        if(!this.checkIfCanAttack(x_id, y_id)){
            return {
                result: false,
                txType: StateTransition.AttackBlock,
                error: 'block-is-be-protected'
            }
        }

        let stamina = this.parameter.attack_plots_need_stamina;
        if(!(this.general.useGeneralStamina(generalId, stamina))){
            return{
                result: false,
                txType: StateTransition.AttackBlock,
                error: 'general-stamina-error'
            }
        }
        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let centerBlockState = this.getBlockState(x_id, y_id)
        const unionId = centerBlockState.belong.unionId
        let records = []
        let cancelList = []
        // let remainTroop = -1
        let re = this.attackBlock(x_id, y_id, generalId, remainTroop)
        if(re['error']){
            return re
        }
        cancelList = cancelList.concat(re['cancelList'])
        records = records.concat(re['records'])
        remainTroop = re['remainTroop']
        if(unionId != 0){
            for(let i = 0; i < 6; i++){
                if(remainTroop <=0 ){
                    break
                }
                let tempX = x_id + xOffset[i]
                let tempY = y_id + yOffset[i]
                let tempBlockState = this.getBlockState(tempX, tempY)
                if(tempBlockState && tempBlockState.belong.unionId == unionId){
                    let tempRe = this.attackBlock(tempX, tempY, generalId, remainTroop)
                    if(tempRe['error']){
                        return tempRe
                    }
                    cancelList = cancelList.concat(tempRe['cancelList'])
                    records = records.concat(tempRe['records'])
                    remainTroop = tempRe['remainTroop']
                }
            }
        }
        
        let durabilityReduce = 0
        if(remainTroop > 0){
            durabilityReduce = this.reduceDurability(x_id, y_id, remainTroop, this.general.state.unionId, onBelongChange)      
            if(records.length != 0){
                let lastRecord = records[records.length - 1] as BattleTransRecord
                lastRecord.attackInfo.gloryGet += Math.floor(durabilityReduce / 50)
                lastRecord.blockInfo.durabilityReduce = durabilityReduce
            }     
        }
        return {
            txType: StateTransition.AttackBlock,
            records: records,
            cancelList: cancelList,
            durabilityReduce: durabilityReduce
        }
    }

    attackBlock( x_id: number, y_id: number, generalId: number, remainTroop: number = -1){
        let time = parseInt(new Date().getTime() / 1000 + '');
        let blockState = this.getBlockState(x_id, y_id)
        let defaultDefense = this.getDefenseList(x_id, y_id, true)
        let firstBlock = false
        let list : BattleTransRecord[] = []
        let generalRow = this.general.getGeneralQualification(generalId)
        if(remainTroop == -1){
            remainTroop = this.general.getMaxAttackTroop()
            firstBlock = true
        }
        if(firstBlock){
            for(let i = 0; i < defaultDefense.length; i++){
                let info = this.transBlockDefenseInfoToGeneralDefense(defaultDefense[i])
                let unionId = this.general.state.unionId;
                let unionIds = {
                  attackUnionId: unionId, 
                  defenseUnionId: 0
                };
                let bre = this.general.battle(generalId, unionIds, info, remainTroop, false)
                if(!bre['result']){
                    return bre
                }
                else{
                    bre = bre as BattleResult
                    let battleRecord : BattleTransRecord= {
                        attackInfo : {
                            username: parseStateId(this.general.state.getId()).username ,
                            generalId: generalId,
                            generalLevel: this.general.getGeneralLevel(generalId),
                            generalType: generalRow.general_type,
                            troopReduce: bre.attackTroopReduce,
                            silverGet: 0,
                            gloryGet: bre.attackGloryGet,
                            unionId: unionId,
                            iconId: this.general.state.iconId
                        },
                        defenseInfo: {
                            username: '',
                            generalId: info.generalId,
                            generalLevel: info.generalLevel,
                            generalType: info.generalType,
                            troopReduce: bre.defenseTroopReduce,
                            silverGet: 0,
                            gloryGet: bre.defenseGloryGet,
                            unionId: 0,
                            iconId: -1
                        },
                        recordType: BattleRecordType.Block,
                        timestamp: getTimeStamp(),
                        blockInfo:{
                            x_id: x_id,
                            y_id: y_id,
                            durabilityReduce: 0
                        },
                        txHash: getTxHash(),
                        result: bre.win
                    }
                    list.push(battleRecord)
                    if( bre.win ){
                        defaultDefense.shift()
                        i--
                        remainTroop -= bre.attackTroopReduce
                    }
                    else{
                        defaultDefense[i].troops -= bre.defenseTroopReduce
                        remainTroop -= bre.attackTroopReduce
                        break
                    }
                }
            }
            blockState.update(
                {
                    'defaultDefense': defaultDefense,
                    'lastAttachTime': time
                }
            )
            this.changeGlobalLastAttack(x_id, y_id, time + DurabilityRecoverTime)
        }
        if(remainTroop <= 0 ){
            return {
                txType: StateTransition.AttackBlock,
                records: list,
                cancelList: [],
                remainTroop: remainTroop
            }
        }
        let defenseInfos = this.getDefenseList(x_id, y_id, false)
        let cancelList : innerCancelBlockDefense[] = []
        for(let i = 0; i < defenseInfos.length; i++){
            let info = this.transBlockDefenseInfoToGeneralDefense(defenseInfos[i])
            let unionId = this.general.state.unionId;
            let unionIds = {
              attackUnionId: unionId, 
              defenseUnionId: defenseInfos[i].unionId
            };
            let bre = this.general.battle(generalId, unionIds, info, remainTroop, false)
            if(!bre['result']){
                return bre
            }
            else{
                bre = bre as BattleResult
                let battleRecord : BattleTransRecord= {
                    attackInfo : {
                        username:  parseStateId(this.general.state.getId()).username,
                        generalId: generalId,
                        generalLevel: this.general.getGeneralLevel(generalId),
                        generalType: generalRow.general_type,
                        troopReduce: bre.attackTroopReduce,
                        silverGet: 0,
                        gloryGet: bre.attackGloryGet,
                        unionId: unionId,
                        iconId: this.general.state.iconId
                    },
                    defenseInfo: 
                    {
                        username:  defenseInfos[i].username,
                        generalId: info.generalId,
                        generalLevel: info.generalLevel,
                        generalType: info.generalType,
                        troopReduce: bre.defenseTroopReduce,
                        silverGet: 0,
                        gloryGet: bre.defenseGloryGet,
                        unionId: defenseInfos[i].unionId,
                        iconId: defenseInfos[i].iconId
                    },
                    recordType: BattleRecordType.Block,
                    timestamp: getTimeStamp(),
                    blockInfo:{
                        x_id: x_id,
                        y_id: y_id,
                        durabilityReduce: 0
                    },
                    txHash: getTxHash(),
                    result: bre.win
                }
                list.push(battleRecord)
                if( bre.win ){
                    cancelList.push(
                        {
                            generalId: defenseInfos[i].generalId,
                            username: defenseInfos[i].username
                        }
                    )
                    defenseInfos.shift()
                    i--
                    remainTroop -= bre.attackTroopReduce
                }
                else{
                    defenseInfos[i].troops -= bre.defenseTroopReduce
                    remainTroop -= bre.attackTroopReduce
                    break
                }
            }
        }
        blockState.update(
            {
                'defenseList': defenseInfos
            }
        )
        return {
            txType: StateTransition.AttackBlock,
            records: list,
            cancelList: cancelList,
            remainTroop : remainTroop
        }
    }

    genDurabilityRecord(x_id:number, y_id: number, generalId: number, gloryGet: number, durabilityReduce: number ) : BattleTransRecord{
        let generalRow = this.general.getGeneralQualification(generalId)
        let battleRecord : BattleTransRecord= {
            attackInfo : {
                username: parseStateId(this.general.state.getId()).username ,
                generalId: generalId,
                generalLevel: this.general.getGeneralLevel(generalId),
                generalType: generalRow.general_type,
                troopReduce: 0,
                silverGet: 0,
                gloryGet: gloryGet,
                unionId: this.general.state.unionId,
                iconId: this.general.state.iconId
            },
            defenseInfo: 
            {
                username: '',
                generalId: -1,
                generalLevel: 0,
                generalType: 0,
                troopReduce: 0,
                silverGet: 0,
                gloryGet: 0,
                unionId: 0,
                iconId: -1
            },
            recordType: BattleRecordType.Block,
            timestamp: getTimeStamp(),
            blockInfo:{
                x_id: x_id,
                y_id: y_id,
                durabilityReduce: durabilityReduce
            },
            txHash: getTxHash(),
            result: true
        }
        return battleRecord
    } 

    miningable(x_id: number, y_id: number ){
        let blockState = this.getBlockState(x_id, y_id)
        let row = this.getMapGDS(x_id, y_id)
        if(row.gather_silver_speed <= 0){
            return false
        }
        if(blockState.remainSilver >= row.gather_silver_speed){
            return true
        }
        return false
    }

    miningBlock(x_id: number, y_id: number){
        let blockState = this.getBlockState(x_id, y_id)
        let row = this.getMapGDS(x_id, y_id)
        if(this.miningable(x_id, y_id)){
            blockState.update(
                {
                    'remainSilver' : blockState.remainSilver - row.gather_silver_speed
                }
            )
        }
        return row.gather_silver_speed
    }

    getDurability( x_id: number, y_id: number){
        let time = parseInt(new Date().getTime() / 1000 + '')
        let blockState = this.getBlockState(x_id, y_id)
        let row = this.getMapGDS(x_id, y_id)
        if(time - blockState.lastAttachTime > DurabilityRecoverTime){
            return row.durability
        }
        else{
            return blockState.durability
        }
    }

    reduceDurability( x_id: number, y_id: number, remainTroop: number , unionId: number, onBelongChange: () => void){
        let time = parseInt(new Date().getTime() / 1000 + '')
        let blockState = this.getBlockState(x_id, y_id)
        let row = this.getMapGDS(x_id, y_id)
        let durability = this.getDurability(x_id, y_id)
        let update = 0
        if(durability - remainTroop <= 0){
            let newBelong : BelongInfo ={
                unionId : unionId,
                updateTime: time
            }
            blockState.update(
                {
                    'durability': row.durability,
                    'belong': newBelong,
                    'lastAttachTime': -1
                }
            )
            this.changeBelongInfo(x_id, y_id, unionId, time + this.parameter.occupy_block_protect_times)
            onBelongChange && onBelongChange();
            update = durability
        }
        else{
            blockState.update(
                {
                    'durability': durability - remainTroop
                }
            )
            update = remainTroop
        }
        return update
    }

    getBlocksBelongInfo(){
        let re = {}
        for(let id in this.mapConfig.config){
            let row : MapGDS = this.mapConfig.config[id]
            re[id] = copyObj(
                this.getBlockBattleStatus(row.x_id, row.y_id)
            )
        }
        return re
    }

    getBuffList(unionId : number){
        let list = []
        for( let id in this.mapConfig.config){
            let row : MapGDS = this.mapConfig.config[id]
            if(unionId == this.getBelongInfo(row.x_id, row.y_id)){
                if(row.buff_id != 0){
                    list.push(row.buff_id)
                }
            }
        }
        return list
    }

    checkUnionWin(){
        let time = getTimeStamp()
        let status = UnionWinStatus.WaitToWin
        let endTime = 0
        if(this.gState.unionWinId != 0){
            return {
                unionWin: true,
                unionId: this.gState.unionWinId,
                status: UnionWinStatus.HaveWin,
                remainTime: 0
            }
        }
        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let xList = []
        let yList = []
        const centerX = 0
        const centerY = 0
        xList.push(centerX)
        yList.push(centerY)
        for(let i = 0; i < 6; i++){
            xList.push(centerX + xOffset[i])
            yList.push(centerY + yOffset[i])
        }
        let unionWin = true
        let winId = 0
        for(let i = 0; i < 7; i++){
            let blockState = this.getBlockState(xList[i], yList[i])
            if(!blockState){
                throw "error when check unionWin"
            }
            if( blockState.belong.unionId == 0){
                unionWin = false
                status = UnionWinStatus.Normal
                break
            }
            if( winId == 0 || blockState.belong.unionId == winId){
                winId = blockState.belong.unionId
                if(time - blockState.belong.updateTime < this.parameter.victory_need_occupy_times){
                    unionWin = false
                }
                let tempEndTime = blockState.belong.updateTime + this.parameter.victory_need_occupy_times
                endTime = tempEndTime > endTime ? tempEndTime : endTime
            }
            else{
                unionWin = false
                status = UnionWinStatus.Normal
                break
            }
        }
        if(!unionWin){
            if( status ==  UnionWinStatus.Normal){
                return {
                    unionWin : unionWin,
                    unionId : 0,
                    status : UnionWinStatus.Normal,
                    remainTime : 0
                }
            }
            else{
                return {
                    unionWin : unionWin,
                    unionId : winId,
                    status : UnionWinStatus.WaitToWin,
                    remainTime : endTime - time
                }
            }
        }
        else{
            return {
                unionWin : unionWin,
                unionId : winId,
                status : UnionWinStatus.HaveWin,
                remainTime : 0
            }
        }
    }

    getSeasonState(){
        return this.seasonState;
    }
    getSeasonStatus(){
        let time = getTimeStamp()
        const config = this.seasonState
        let re = {
            status: SeasonStatus.Reservation,
            remaintime: config.season_ready - time
        }
        if( time < config.season_ready ){
            re = {
                status: SeasonStatus.Reservation,
                remaintime: config.season_ready - time
            }
        }else if( time < config.season_open ){
            re = {
                status: SeasonStatus.Ready,
                remaintime: config.season_open - time
            }
        }else if( time < config.season_end ){
            re = {
                status: SeasonStatus.Open,
                remaintime: config.season_end - time
            }
        }else{
            re = {
                status: SeasonStatus.End,
                remaintime: -1
            }
        }
        return re
    }

    setUnionWin(unionId : number){
        if(!(this.checkUnionWin().unionId == unionId)){
            return {
                result: false,
                txType: StateTransition.SetUnionWin,
                error: "this-union-do-not-win"
            }
        }
        this.setRewardResult(unionId)
        this.gState.update(
            {
                'seasonEnd': true,
                'unionWinId': unionId
            }
        )
        return{
            txType: StateTransition.SetUnionWin,
            result: true
        }
    }

    setRewardResult(unionId: number){
        let addressList = []
        let gloryList = []
        let unionSumGlory = 0 
        for( let item  of this.rewardGlobalState.globalGloryRankInfo ){
            addressList.push(item.username)
            gloryList.push(item.glory)
        }
        if(unionId != 0){
            for( let item of this.rewardGlobalState.unionGloryRankInfo[unionId - 1] ){
                unionSumGlory += item.glory
                if(addressList.indexOf(item.username) == -1){
                    addressList.push(item.username)
                    gloryList.push(item.glory)
                }
            }
        }
        let unionRewardResult: RewardResult[] = []
        let gloryRewardResult: RewardResult[] = []

        const rankReward = this.genRankResultList()
        let rewardIndex = 0
        let reward = rankReward[rewardIndex]
        for(let i in this.rewardGlobalState.globalGloryRankInfo){
            if( parseInt(i) + 1  > reward.end){
                rewardIndex++
                if(rewardIndex >= rankReward.length){
                    break
                }
                reward = rankReward[rewardIndex]
            }
            let temp: RewardResult = {
                username : this.rewardGlobalState.globalGloryRankInfo[i].username,
                unionId : this.rewardGlobalState.globalGloryRankInfo[i].unionId,
                glory: this.rewardGlobalState.globalGloryRankInfo[i].glory,
                count: reward.count
            }
            gloryRewardResult.push(temp)
        }
        if(unionId != 0 && unionSumGlory != 0){
            for( let item of this.rewardGlobalState.unionGloryRankInfo[unionId - 1] ){
                let temp: RewardResult = {
                    username: item.username,
                    glory: item.glory,
                    unionId: item.unionId,
                    count: item.glory * this.seasonState.unionRewardValue / unionSumGlory
                }
                unionRewardResult.push(temp)
            }
        }

        this.rewardGlobalState.update(
            {
                contractAddressInput: addressList,
                contractGloryInput: gloryList,
                unionGlorySum: unionSumGlory,
                unionWinId: unionId,
                seasonEnd: true,
                unionRewardResult: unionRewardResult,
                gloryRewardResult: gloryRewardResult,
            }
        )
    }

    setSeasonEnd(){
        if(this.getSeasonStatus().status == SeasonStatus.End){
            console.log("endSeason success")
            this.setRewardResult(0)
            this.gState.update(
                {
                    'seasonEnd': true
                }
            )
            return {
                txType: StateTransition.SetSeasonEnd,
                result: true
            }
        }
        else{
            console.log("it-is-not-time-to-end")
            return{
                result: false,
                txType: StateTransition.SetSeasonEnd,
                error: 'it-is-not-time-to-end'
            }
        }
    }


    genRankResultList(){
        let re : RankReward[] = []
        if( this.seasonState.rankConfigValue.length * 2 != this.seasonState.rankConfigFromTo.length){
            return re
        }
        for(let i = 0; i < this.seasonState.rankConfigValue.length; i++){
            let temp: RankReward = {
                type: 1,
                name: "rose",
                from: this.seasonState.rankConfigFromTo[ i*2 ],
                end: this.seasonState.rankConfigFromTo[ i*2 + 1],
                count: this.seasonState.rankConfigValue[i]
            }
            re.push(temp)
        }
        return re
    }

    addGloryAndSum( value: number ){
        this.general.addGlory(value)
        let unionId = this.general.state.unionId
        let glorySum = this.rewardGlobalState.unionGlorySumRuntime
        glorySum[unionId -1 ] += value
        this.rewardGlobalState.update(
            {
                unionGlorySumRuntime: glorySum
            }
        )
    }
    
}