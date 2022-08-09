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
    constructor( gState: IMapGlobalState, blockStates:{[key: string]: IBlockState}){
        this.gState = gState
        this.blockStates = blockStates
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

    getBlockState( x_id: number, y_id: number){
        return this.blockStates[ x_id + "^" + y_id ]
    }

    getBelongInfo(x_id: number, y_id: number){
        // let xIndex = x_id - 1;
        // let yIndex = Math.floor((y_id - 1) / 2)
        // if( 
        //     this.gState.campInfo.length > xIndex &&
        //     this.gState.campInfo[xIndex].length > yIndex 
        // ){
        //     return this.gState.campInfo[xIndex][yIndex]
        // }
        // return 0
        
        let blockState = this.getBlockState(x_id, y_id)
        if(!blockState){
            return 0
        }
        return blockState.belong.unionId
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
            return list 
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
        return list
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
    
}