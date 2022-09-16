import { mapIdOffset } from "../Const";
import { BattleRecordType, BattleTransRecord } from "../Controler/transition";
import { GenBlockDefenseTroop, MapConfig, MapConfigFromGDS, MapGDS, Parameter, parameterConfig, SeasonConfig, SeasonConfigFromGDS } from "../DataConfig";
import { BelongInfo, BlockDefenseInfo, IBlockState, IMapGlobalState, ISeasonConfigState } from "../State";
import { SeasonStatus } from "../Throne/map";
import { getTimeStamp, parseStateId } from "../Utils";
import { IBoost } from "./boost";
import { BattleResult, BattleType, DefenseInfo, General } from "./general";

const DefaultTroopRecoverTime = 60 * 30
const DurabilityRecoverTime = 60 * 30

export class Map{
    gState: IMapGlobalState
    blockStates:{[key: string]: IBlockState} 
    mapConfig: MapConfig
    seasonState: ISeasonConfigState
    seasonConfig: SeasonConfig
    parameter: Parameter
    boost: IBoost
    general: General
    constructor( gState: IMapGlobalState, seasonState: ISeasonConfigState ){
        this.gState = gState
        this.blockStates = {}
        this.mapConfig = MapConfigFromGDS
        this.parameter = parameterConfig
        this.seasonConfig = SeasonConfigFromGDS
        this.seasonState = seasonState
    }
    setBoost(boost:IBoost, general: General){
        this.boost = boost
        this.general = general
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

    getBelongInfo(x_id: number, y_id: number){
        let xIndex = x_id + mapIdOffset;
        let yIndex = Math.floor((y_id + mapIdOffset) / 2)
        if(xIndex < 0 || yIndex < 0){
            return 0
        }
        if( 
            this.gState.campInfo.length > xIndex &&
            this.gState.campInfo[xIndex].length > yIndex 
        ){
            return this.gState.campInfo[xIndex][yIndex]
        }
        return 0
    }

    changeBelongInfo(x_id: number, y_id: number, unionId: number){
        let xIndex = x_id  + mapIdOffset;
        let yIndex = Math.floor((y_id  + mapIdOffset) / 2)
        let infoMap = this.gState.campInfo
        infoMap[xIndex][yIndex] = unionId
        this.gState.update(
            {
                'campInfo': infoMap
            }
        )

    }

    checkBetween(unionId : number, x_id: number, y_id: number){
        const xOffset = [ 2, 1, -1, -2, -1, 1]
        const yOffset = [ 0, 1, 1, 0, -1, -1]
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

    cancelDefenseBlock( x_id: number, y_id: number, username: string){
        let blockState = this.getBlockState(x_id, y_id)
        let defenseList = blockState.defenseList
        let remainTroop = 0
        for(let i = 0; i< defenseList.length; i++){
            if(defenseList[i].username == username){
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
            defenseMaxTroop: 0
        }
        return re
    }

    checkIfCanAttack( x_id: number, y_id: number ){
        let blockState = this.getBlockState(x_id, y_id)
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

    attackBlocksAround(x_id: number, y_id: number, generalId: number){
        if(!this.checkIfCanAttack(x_id, y_id)){
            return {
                result: false,
                error: 'block-is-be-protected'
            }
        }
        const xOffset = [ 2, 1, -1, -2, -1, 1]
        const yOffset = [ 0, 1, 1, 0, -1, -1]
        let centerBlockState = this.getBlockState(x_id, y_id)
        const unionId = centerBlockState.belong.unionId
        let records = []
        let remainTroop = -1
        let re = this.attackBlock(x_id, y_id, generalId, remainTroop)
        if(re['error']){
            return re
        }
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
                    records = records.concat(tempRe['records'])
                    remainTroop = tempRe['remainTroop']
                }
            }
        }
        if(remainTroop > 0){
            let count = this.reduceDurability(x_id, y_id, remainTroop, this.general.state.unionId)
            let lastRecord = records[records.length - 1] as BattleTransRecord
            lastRecord.attackInfo.gloryGet += count 
        }
        return records
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
                let bre = this.general.battle(generalId, info, remainTroop, firstBlock)
                firstBlock = false
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
                            gloryGet: bre.attackGloryGet
                        },
                        defenseInfo: 
                        {
                            username: '',
                            generalId: info.generalId,
                            generalLevel: info.generalLevel,
                            generalType: info.generalType,
                            troopReduce: bre.defenseTroopReduce,
                            silverGet: 0,
                            gloryGet: bre.defenseGloryGet
                        },
                        recordType: BattleRecordType.Block,
                        timestamp: getTimeStamp(),
                        blockInfo:{
                            x_id: x_id,
                            y_id: y_id
                        },
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
        }
        if(remainTroop <= 0 ){
            return {
                records: list,
                remainTroop : remainTroop
            }
        }
        let defenseInfos = this.getDefenseList(x_id, y_id, false)
        for(let i = 0; i < defenseInfos.length; i++){
            let info = this.transBlockDefenseInfoToGeneralDefense(defenseInfos[i])
            let bre = this.general.battle(generalId, info, remainTroop)
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
                        gloryGet: bre.attackGloryGet
                    },
                    defenseInfo: 
                    {
                        username:  defenseInfos[i].username,
                        generalId: info.generalId,
                        generalLevel: info.generalLevel,
                        generalType: info.generalType,
                        troopReduce: bre.defenseTroopReduce,
                        silverGet: 0,
                        gloryGet: bre.defenseGloryGet
                    },
                    recordType: BattleRecordType.Block,
                    timestamp: getTimeStamp(),
                    blockInfo:{
                        x_id: x_id,
                        y_id: y_id
                    },
                    result: bre.win
                }
                list.push(battleRecord)
                if( bre.win ){
                    defenseInfos.shift()
                    i--
                    remainTroop -= bre.attackTroopReduce
                }
                else{
                    defenseInfos[i].troops -= bre.defenseTroopReduce
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
            records: list,
            remainTroop : remainTroop
        }
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

    reduceDurability( x_id: number, y_id: number, remainTroop: number , unionId: number ){
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
                    'belong': newBelong
                }
            )
            this.changeBelongInfo(x_id, y_id, unionId)
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
            re[id] = {
                unionId : this.getBelongInfo(row.x_id, row.y_id)
            }
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
        if(this.gState.unionWinId != 0){
            return {
                unionWin: true,
                unionId: this.gState.unionWinId
            }
        }
        const xOffset = [ 2, 1, -1, -2, -1, 1]
        const yOffset = [ 0, 1, 1, 0, -1, -1]
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
                break
            }
            if( winId == 0 || blockState.belong.unionId == winId){
                winId = blockState.belong.unionId
                if(time - blockState.belong.updateTime < this.parameter.victory_need_occupy_times){
                    unionWin = false
                    break
                }
            }
        }
        if(!unionWin){
            return {
                unionWin : unionWin,
                unionId : 0
            }
        }
        else{
            return {
                unionWin : unionWin,
                unionId : winId
            }
        }
    }
    getSeasonStatus(){
        let time = getTimeStamp()
        const config = this.seasonConfig.get(1)
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
                error: "this-union-do-not-win"
            }
        }
        this.gState.update(
            {
                'unionWinId': unionId
            }
        )
        return{
            result: true
        }
    }

    setSeasonEnd(){
        if(this.getSeasonStatus().status = SeasonStatus.End){
            this.gState.update(
                {
                    'seasonEnd': true
                }
            )
            return {
                result: true
            }
        }
        else{
            return{
                result: false,
                error: 'it-is-not-time-to-end'
            }
        }
    }
    
}