import { GenBlockDefenseTroop, MapConfig, MapConfigFromGDS, MapGDS, Parameter, parameterConfig } from "../DataConfig";
import { BelongInfo, BlockDefenseInfo, IBlockState, IMapGlobalState } from "../State";
import { IBoost } from "./boost";
import { BattleRecord, BattleResult, BattleType, DefenseInfo, General } from "./general";

const DefaultTroopRecoverTime = 60 * 30
const DurabilityRecoverTime = 60 * 30

export class Map{
    gState: IMapGlobalState
    blockStates:{[key: string]: IBlockState} 
    mapConfig: MapConfig
    parameter: Parameter
    boost: IBoost
    general: General
    constructor( gState: IMapGlobalState ){
        this.gState = gState
        this.blockStates = {}
        this.mapConfig = MapConfigFromGDS
        this.parameter = parameterConfig
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
        let xIndex = x_id - 1;
        let yIndex = Math.floor((y_id - 1) / 2)
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
        let xIndex = x_id - 1;
        let yIndex = Math.floor((y_id - 1) / 2)
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
        let time = parseInt(new Date().getTime() / 1000 + '');
        let blockState = this.getBlockState(x_id, y_id)
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
        let time = parseInt(new Date().getTime() / 1000 + '');
        if(blockState.belong.updateTime == -1 || time - blockState.belong.updateTime > this.parameter.occupy_block_protect_times){
            return true
        }
        return false
    }

    attackBlocksAround(x_id: number, y_id: number, generalId: number){
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
            this.reduceDurability(x_id, y_id, remainTroop, unionId)
        }
        return records
    }

    attackBlock( x_id: number, y_id: number, generalId: number, remainTroop: number = -1){
        let time = parseInt(new Date().getTime() / 1000 + '');
        let blockState = this.getBlockState(x_id, y_id)
        let defaultDefense = this.getDefenseList(x_id, y_id, true)
        let firstBlock = false
        let list : BattleRecord[] = []
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
                    let battleRecord : BattleRecord= {
                        myInfo : {
                            username: this.general.state.getId(),
                            generalId: generalId,
                            generalLevel: this.general.getGeneralLevel(generalId),
                            troopReduce: bre.attackTroopReduce,
                            silverGet: 0,
                        },
                        enemyInfo: 
                        {
                            username: '',
                            generalId: info.generalId,
                            generalLevel: info.generalLevel,
                            troopReduce: bre.defenseTroopReduce,
                            silverGet: 0,
                        },
                        type: BattleType.Attack,
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
                let battleRecord : BattleRecord= {
                    myInfo : {
                        username: this.general.state.getId(),
                        generalId: generalId,
                        generalLevel: this.general.getGeneralLevel(generalId),
                        troopReduce: bre.attackTroopReduce,
                        silverGet: 0,
                    },
                    enemyInfo: 
                    {
                        username:  defenseInfos[i].username,
                        generalId: info.generalId,
                        generalLevel: info.generalLevel,
                        troopReduce: bre.defenseTroopReduce,
                        silverGet: 0,
                    },
                    type: BattleType.Attack,
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
        let update = false
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
            update = true
        }
        else{
            blockState.update(
                {
                    'durability': durability - remainTroop
                }
            )
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
    
}