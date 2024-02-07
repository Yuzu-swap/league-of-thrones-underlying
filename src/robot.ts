import { IChainComponent } from './Game/Throne/chain';
import { IMapComponent } from './Game/Throne/map';
import { IStrategyComponent } from './Game/Throne/strategy';
import { CityFacility, ComponentType, ICityComponent, IGeneralComponent, ITransResult, ResouceType, Throne } from './index'
import fetch from 'node-fetch';
import * as ethUtil from 'ethereumjs-util';

import { createLogger, format, transports } from 'winston';
import { RecruitStatus } from './Game/Logic/game';
import {decrypt} from './BotLogic/utils/walletmgr';
import * as fs  from 'fs';
import { BlockDefenseInfo } from './Game/State';
import { SkillType } from './Game/Logic/general';
import { log } from 'console';
import { MapGDS } from './Game/DataConfig';








const logger = createLogger({
  format: format.combine(
    format.colorize(),  // This adds colors
    format.simple()
  ),
  transports: [new transports.Console()],
});


function initGuidBook() {
    console.log("here")
    const guideBookStr = fs.readFileSync("src/BotLogic/BotJS/data/guide.json", 'utf8');
    const guideBooks = JSON.parse(guideBookStr) as any;
    const guideBookByTemplate = {}

    guideBooks.forEach((item:any)=>{
        if(!guideBookByTemplate[item.tempalte]){
            guideBookByTemplate[item.tempalte] = []
        }

        guideBookByTemplate[item.tempalte].push(item)
    })

    return guideBookByTemplate
}



function getWalletAddressFromPrivateKey(privateKeyHex: string): string {
    const privateKey = Buffer.from(privateKeyHex, 'hex');
    const publicKey = ethUtil.privateToPublic(privateKey);
    const address = ethUtil.publicToAddress(publicKey);
    return ethUtil.toChecksumAddress('0x'+address.toString('hex'));
}

function signPersonalMessage(privateKeyHex: string, message: string): string {
    const privateKey = Buffer.from(privateKeyHex, 'hex');
    const messageHash = ethUtil.hashPersonalMessage(Buffer.from(message));
    console.log("messageHash: ", messageHash.toString('hex'))
    const signature = ethUtil.ecsign(messageHash, privateKey);
    return ethUtil.toRpcSig(signature.v, signature.r, signature.s);
}



(global as any).window = {};
(global as any).console.log = ()=>{};

type ObserverCallback = (event: string, data: any) => void;

class Subject {
    private observers: { [event: string]: ObserverCallback[] } = {};

    addObserver(event: string, observer: ObserverCallback): void {
        if (!this.observers[event]) {
            this.observers[event] = [];
        }
        this.observers[event].push(observer);
    }

    removeObserver(event: string, observer: ObserverCallback): void {
        if (!this.observers[event]) return;

        const index = this.observers[event].indexOf(observer);
        if (index !== -1) {
            this.observers[event].splice(index, 1);
        }
    }

    notify(event: string, data: any): void {
        if (!this.observers[event]) return;

        for (const observer of this.observers[event]) {
            observer(event, data);
        }
    }
}



// 使用
class PlayerState extends Subject {
    city: ICityComponent;
    general: IGeneralComponent;
    map: IMapComponent;
    strategy: IStrategyComponent;
    chain: IChainComponent;
}

enum StateUpdatedEvent {
    City = "city",
    General = "general",
    Map = "map",
    Strategy = "strategy",
    Chain = "chain",
}



interface Strategy {
    runStep:()=>any;
}


class StrategyBuiding implements Strategy{

    playerState: PlayerState
    constructor(playerState: PlayerState){
        this.playerState = playerState
    }

    async runStep(){
        const city = this.playerState.city
        const strategy = this.playerState.strategy

        logger.info("current resource ",{gold:city.getGold(),resource:city.getResource(), facilityList: city.getFacilityList()} )


        const upgradePriority = [
            {facility: CityFacility.Fortress},
            {facility: CityFacility.Home,Count:3},
            {facility: CityFacility.TrainingCenter,Count:3},
            {facility: CityFacility.Store},

            {facility: CityFacility.MilitaryCenter},
            {facility: CityFacility.InfantryCamp},
            {facility: CityFacility.CavalryCamp},
            {facility: CityFacility.ArcherCamp},
            {facility: CityFacility.Hospital},
            {facility: CityFacility.Assembly},
            {facility: CityFacility.Wall},
        ]


        //do upgrade
        const facilityList : {[key in CityFacility]?: number[]} = city.getFacilityList()
        var upgradeFlag = false
        for(const upgradeItem of upgradePriority){
            const facility = upgradeItem.facility
            const count = upgradeItem.Count || 1

            for (let index = 0 ;index < count ; index++){
                if (city.checkUpgradeFacility(facility,index)){
                    city.doUpgradeFacility(facility,index,(res:ITransResult)=>{
                        logger.info("upgrade ",{facility,index,res})
                        upgradeFlag = true
                    })
                }else{
                    const needResouce = city.getFacilityUpgradeRequirement(facility,facilityList[facility][index]+1)
                    const currentResouce = city.getResource()
           //         logger.info(`can not upgrade ${facility}`,{needResouce,currentResouce})
                }
                if(upgradeFlag){
                    return
                }
            }
        }

        // use strategy
        if ((strategy.getStrategyPointInfo() as any).strategyPoint > 0){
            strategy.buySilver((result)=>{
                logger.info("buy silver ",{result})
            })
        }else{
           const strategyPointInfo = strategy.getStrategyPointInfo() as any
           console.log("strategyPointInfo: ", strategyPointInfo)
           if( strategyPointInfo.buyTimes <  strategyPointInfo.maxBuyTimes) {
            //buyTimesLastUpdate
                strategy.buyStrategyPoint((strategyPointInfo.maxBuyTimes -strategyPointInfo.buyTimes),(result)=>{
                    logger.info("buy strategyPoint ",{result})
                })
           }
        }
        // buy st
    }

}

class StrategyGeneral implements Strategy{

    playerState: PlayerState
    constructor(playerState: PlayerState){
        this.playerState = playerState
    }


    async runStep(){
        logger.info("StrategyGeneral runStep")
        const general = this.playerState.general

        //able general
        const ableStatus:any = general.getAbleStatus()
        if (ableStatus.able_count < ableStatus.max_able_count){
            let lastGeneralId =  -1
            const glist = general.getGeneralList()
            logger.info("glist ",{glist})
            for (const generalId in glist){
                if (!glist[generalId].able){
                    lastGeneralId = parseInt(generalId)
                    break
                }
            }
            if(lastGeneralId > 0){
                general.ableGeneral(lastGeneralId ,(res:ITransResult)=>{
                    logger.info("doAbleGeneral ",{res})
                })
            }
        }

        //upgrade general
        const glist = general.getGeneralList()

        for (const generalId in glist){
            if (glist[generalId].able){
                logger.info("general " + generalId, {general:glist[generalId]})
                if(general.checkUpgradeGeneral(parseInt(generalId))){
                    general.upgradeGeneral(parseInt(generalId),(res:ITransResult)=>{
                        logger.info("doUpgradeGeneral ",{res})
                    })
                }
            }
        }
    }
}

class StrategyTroop implements Strategy{

    playerState: PlayerState
    constructor(playerState: PlayerState){
        this.playerState = playerState
    }


    async runStep(){
        logger.info("StrategyTroop runStep",{unionId: Throne.instance().unionId,username : Throne.instance().username})
        const general = this.playerState.general
        const city = this.playerState.city
        const recruitState :any = city.getRecruitState()

        logger.info("recruitState ",{recruitState})

        if (recruitState.status == RecruitStatus.None){
            logger.info("startRecruitTroop ",recruitState.state)
            const facilityList : {[key in CityFacility]?: number[]} = city.getFacilityList()
            const fortressLevel = facilityList[CityFacility.Fortress][0] 
            const currentResouce = city.getResource()
            const currentTroop = (currentResouce[ResouceType.Troop] as any).value
            const currentSilver = (currentResouce[ResouceType.Silver] as any).value

            const targetTroop = fortressLevel * 100000
            if(currentTroop < targetTroop){

                const trainAmount = Math.min(targetTroop - currentTroop,  Math.floor(currentSilver/100)  )
                logger.info("startRecruitTroop ",{currentTroop,targetTroop,trainAmount})

                city.doRecruit(trainAmount,(res:ITransResult)=>{
                    logger.info("doRecruit ",{res})
                })
            }

        } else if (recruitState.status == RecruitStatus.Ready){
            logger.info("receiveTroop ")
            city.receiveTroop((res:ITransResult)=>{
                logger.info("receiveTroop ",{res})
            })

            const healInfo = city.getInjuredTroops()
            const currentResouce = city.getResource()

            //using gold 
            {
                if(city.getGold()>100){
                    const healAmount = Math.min(healInfo.value ,  Math.floor(  city.getGold()/0.3/10))
                    if (healAmount > 100){
                        logger.info("heal troop by gold ",{healInfo,gold:city.getGold()})

                        city.healTroopsStart("gold",healAmount,(res:ITransResult)=>{
                            logger.info("healTroopsStart by gold",{res,healAmount})
                        })
                        return

                    }
                }
            }

            const currentSilver = (currentResouce[ResouceType.Silver] as any).value
            const healAmount = Math.min(healInfo.value ,  Math.floor(currentSilver/100/10)  )
            logger.info("heal troop by silver ",{healInfo,currentSilver})
    
            if(healAmount > 0){
                city.healTroopsStart("silver",healAmount,(res:ITransResult)=>{
                    logger.info("healTroopsStart ",{res,healAmount})
                })
            }
        } 



      


    }
}





class StrategyGlory implements Strategy{
    playerState: PlayerState
    occupiedBlocks: {[key:string]:number} = {}
    attacktor:boolean
    
    constructor(playerState: PlayerState,tempalteType:TemplateType){
        this.playerState = playerState
        this.attacktor = tempalteType == TemplateType.PayedAttacktor || tempalteType == TemplateType.NonePayAttacktor
    }


    checkBetween(unionId : number, x_id: number, y_id: number){
        const xOffset = [ 0, 1, 1, 0, -1, -1]
        const yOffset = [ 2, 1, -1, -2, -1, 1]
        let re = false
        for(let i = 0; i < 6; i++){
            let tempX = x_id + xOffset[i]
            let tempY = y_id + yOffset[i]
            if(this.occupiedBlocks[`${tempX}^${tempY}`] == Throne.instance().unionId ){
                re = true
            }
        }
        return re
    }

    async runStep(){
        const {city,general,map} = this.playerState
        logger.info("StrategyGlory runStep ",{unionId: Throne.instance().unionId,username : Throne.instance().username,attacktor:this.attacktor})
        //pick general
        const glist = general.getGeneralList()
        let attackGeneralId = ""

        for (const generalId in glist){
            if (glist[generalId].able){
                if (glist[generalId].stamina > 0){
                    attackGeneralId = generalId
                }
            }
        }

        if( attackGeneralId == ""){
                logger.info("no general has energy ",{glist})

                return 
        }else{
            logger.info("general stamina ",{"general": attackGeneralId, "stamina":glist[attackGeneralId].stamina })
        }

        
        if (this.attacktor){
            //rank list

            const wrapGetAllBattleStatuses = async function(){
                return new Promise((resolve, reject) => {
                    general.getAllBattleStatuses((result)=>{
                        resolve(result);
                    })
                });
            }

            const battleStatuses = await wrapGetAllBattleStatuses() as any
            logger.info("battleStatuses ",{battleStatuses})
            const generalBattleInfo : any =  general.getGeneralBattleInfo(parseInt(attackGeneralId))
            const myPower = general.getAttackTroop() * (generalBattleInfo.sum[SkillType.Attack] + generalBattleInfo.sum[SkillType.Defense])

            battleStatuses.sort((a :any,b:any)=>{
                return a.silver > b.silver
            })
            logger.info("battleStatuses after sort",{battleStatuses})

            for(let i = 0; i < battleStatuses.length; i++){
                const bunit = battleStatuses[i]
                if (!bunit.isProtected){
                    const unitPower =  bunit.troop * (bunit.attack + bunit.defense)
                    if (myPower > unitPower * 1.5){
                        logger.info("start attack  player ",{bunit})
                        general.battle(parseInt(attackGeneralId),bunit.username,(res:ITransResult)=>{
                            logger.info("battle player result is ",{res})
                        })
                        return
                    }
                }
            }
        }



        //sync occuipied
        const belongsInfo = map.getBlocksBelongInfo() //{"-10^-10":{"attackEndTime":-1,"protectEndTime":-1,"unionId":3},
        let highestSilverInfo;
        for(const key in belongsInfo){
            this.occupiedBlocks[key] = belongsInfo[key].unionId
            if( Throne.instance().unionId ==  belongsInfo[key].unionId){
                logger.info("occupied " + key,belongsInfo[key])
            }else{
                const nowTs = Math.floor(Date.now()/1000)
                const [x,y] = key.split("^")

                const wrapGetMapBlockInfoPromise = async function(){
                    return new Promise((resolve, reject) => {
                        map.getBlockInfo(parseInt(x),parseInt(y),(result)=>{
                            resolve(result);
                        })
                    });
                }
                const mapBlockInfo = await wrapGetMapBlockInfoPromise() as MapGDS
          //      logger.info("mapBlockInfo ",{mapBlockInfo})
                //{"mapBlockInfo":{"area":3,"belong":{"unionId":3,"updateTime":1692934217},"buff_id":3002,"defense_list_len":1,"durability":4000,"gather_silver_speed":4000,"now_durability":4000,"parameter":1,"protect_time":0,"remainSilver":616000,"silver_total_number":1200000,"troops":[{"attack":5000,"count":2000,"defense":5000,"type":2}],"type":1,"victory_occupy_reward":[{"count":0,"name":"0","type":0}],"x_id":-10,"y_id":-2}}

                if (mapBlockInfo.type != 3){

                    if(this.checkBetween(Throne.instance().unionId, parseInt(x), parseInt(y)) && belongsInfo[key].protectEndTime < nowTs){
                        const wrapWithPromise = async function(){
                            return new Promise((resolve, reject) => {
                                map.getDefenseList(parseInt(x),parseInt(y),(result)=>{
                                    resolve(result);
                                })
                            });
                        }
                        const blockInfos :BlockDefenseInfo[]= await wrapWithPromise() as BlockDefenseInfo[]

                        const blockPower = blockInfos.reduce((sum,info)=>{return sum + (info.attack + info.defense )* info.troops},0)
                        const generalBattleInfo : any =  general.getGeneralBattleInfo(parseInt(attackGeneralId))
                        const myPower = general.getAttackTroop() * (generalBattleInfo.sum[SkillType.Attack] + generalBattleInfo.sum[SkillType.Defense])

                        logger.info("detect blockInfo ",{blockInfos,key,blockPower,generalBattleInfo,myPower} )

                        const currentResouce = city.getResource()
                        const currentTroop = (currentResouce[ResouceType.Troop] as any).value
                        if( (blockPower > 0 || mapBlockInfo["now_durability"]/ mapBlockInfo["durability"] > 0.1) && myPower >= blockPower*1.3){
                            logger.info("start attack " ,{key,durability:mapBlockInfo["now_durability"],blockPower,currentTroop} )
                            map.attackBlock(parseInt(x),parseInt(y),parseInt(attackGeneralId),(res:ITransResult)=>{
                                logger.info("attackBlock ",{res})
                            })
                            return

                        }

                        if (mapBlockInfo["belong"]["unionId"] == Throne.instance().unionId && mapBlockInfo["remainSilver"] && mapBlockInfo["remainSilver"] > mapBlockInfo.gather_silver_speed * 5) {
                            if(highestSilverInfo){
                                logger.info("check highestSilverInfo ",{highestSilverInfo,mapBlockInfo})
                            }
                            if(!highestSilverInfo || highestSilverInfo.gather_silver_speed < mapBlockInfo.gather_silver_speed){

                                highestSilverInfo = mapBlockInfo
                            }
                        }
                    }
                }
            }
        }
        if(highestSilverInfo){
            logger.info("start collect silver " ,{highestSilverInfo} )
            map.miningBlock(highestSilverInfo.x_id,highestSilverInfo.y_id,parseInt(attackGeneralId),(res:ITransResult)=>{
                logger.info("miningBlock res",{res})
            })
        }
    }

}



enum GuideCommandType {
    UpgradeBuilding = "upgradebuilding",
    RecruitGeneral = "recruitgeneral",
    DefenseGeneral = "defensegeneral",
    UpgradeGeneral = "upgradegeneral",
    UpgradeGeneralSkill = "upgradegeneralskill",
}

interface GuideCommand {
    cmd: GuideCommandType;
    arg1?: string;
    arg2?: string;
    arg3?: string;
}


class StrategyGuideBook implements Strategy{

    playerState: PlayerState
    guideCommandList: GuideCommand[] 
    guideCommandIndex: number
    guideStr:string




    constructor(playerState: PlayerState, guideBook: GuideCommand[] ){
        this.playerState = playerState
        this.guideCommandList = guideBook
        this.guideCommandIndex = 0

        logger.info("StrategyGuideBook init ",{guideCommandList:this.guideCommandList})
    }

    async runStep(){
        while(true){
            if(this.guideCommandIndex >= this.guideCommandList.length){
                logger.info("StrategyGuideBook runStep finish")
                return
            }


            /*
            if(this.guideCommandIndex ==0 ){
                const glist = this.playerState.general.getGeneralList()
                for(const key in glist){
                    if(glist[key].able){
                        this.playerState.general.disableGeneral(parseInt(key) ,(res:ITransResult)=>{
                        })
                    }
                }
            }
            */

            const command = this.guideCommandList[this.guideCommandIndex]
            const satisfied = await this.runGuideCommand(command)
            if(satisfied){
                logger.info("StrategyGuideBook runStep satisfied ",{command,step: this.guideCommandIndex,username : Throne.instance().username,unionId: Throne.instance().unionId})
                this.guideCommandIndex++
            }else{
                logger.info("StrategyGuideBook runStep not satisfed ",{command,step:this.guideCommandIndex,username : Throne.instance().username,unionId: Throne.instance().unionId})
                break
            }
        }

    }


    async runGuideCommand(cmd:GuideCommand): Promise<Boolean>{
        logger.info("runGuideCommand ",{cmd})
        const {city,general,strategy} = this.playerState
        logger.info("current resource ",{gold:city.getGold(),resource:city.getResource(), facilityList: city.getFacilityList()} )

        // use strategy
        if ((strategy.getStrategyPointInfo() as any).strategyPoint > 0){
            strategy.buySilver((result)=>{
                logger.info("buy silver ",{result})
            })
        }else{
            const strategyPointInfo = strategy.getStrategyPointInfo() as any
            logger.info("strategyPointInfo: ", {strategyPointInfo})
            if( strategyPointInfo.buyTimes <  strategyPointInfo.maxBuyTimes || strategyPointInfo.buyTimesLastUpdate < Math.floor(Date.now()/1000) - 3600*24) {
             //buyTimesLastUpdate
                 strategy.buyStrategyPoint((strategyPointInfo.maxBuyTimes -strategyPointInfo.buyTimes),(result)=>{
                     logger.info("buy strategyPoint ",{result})
                 })
            }
         }


        switch(cmd.cmd){
            case GuideCommandType.UpgradeBuilding:
                const facilityList : {[key in CityFacility]?: number[]} = city.getFacilityList()
                const facilityCnt =  (  cmd.arg1 == CityFacility.Home || cmd.arg1 == CityFacility.TrainingCenter ) ? 3 : 1
                const targetLevel = parseInt(cmd.arg2)

                for(let i = 0 ; i < facilityCnt ; i++){
                    const key : CityFacility = cmd.arg1 as CityFacility
                    if (facilityList[key][i] < targetLevel){
                        logger.info(`${key} ${i} not satisfied `, {targetLevel, current:facilityList[key][i] })
                        if (city.checkUpgradeFacility(key,i)){
                            city.doUpgradeFacility(key,i,(res:ITransResult)=>{
                                logger.info("upgrade ",{facility:cmd.arg1,index:i,res})
                            })
                        }
                        return false
                    }
                }
                return true //satisfied
                
            case GuideCommandType.RecruitGeneral:
                    //upgrade general
                const glist = general.getGeneralList()
                logger.info("Glist is ",{glist})
                const generalId = cmd.arg1
                if ( glist[generalId].able) {
                    return true
                }else{
                    logger.info(`general ${generalId} not able `, {general:glist[generalId]})
                    general.ableGeneral(parseInt(generalId) ,(res:ITransResult)=>{
                        logger.info("doAbleGeneral ",{res})
                        if (!res.result){
                            logger.info("able general faled ,so disable all to fix",{generalId})

                        }
                    })
                    return false
                }

            case GuideCommandType.DefenseGeneral:
                const defenseGeneralId = general.getDefenseGeneralId()
                logger.info("defenseGeneralId ",{defenseGeneralId})
                if(defenseGeneralId == parseInt(cmd.arg1)){
                    return true
                }else{
                    general.setDefenseGeneral(parseInt(cmd.arg1),(res:ITransResult)=>{
                        logger.info("setDefenseGeneral ",{res})
                    })
                    return true
                }
            case GuideCommandType.UpgradeGeneral:
                //upgrade general

                {
                    const glist = general.getGeneralList()
                    logger.info("Glist is ",{glist})
                    const generalId = cmd.arg1
                    if (glist[generalId].able){
                        logger.info("general " + generalId, {general:glist[generalId]})
                        if ( glist[generalId].level < parseInt(cmd.arg2)){
                            logger.info(`general ${cmd.arg1} not satisfied `, {targetLevel:cmd.arg2, current:glist[generalId].level })
                            if(general.checkUpgradeGeneral(parseInt(generalId))){
                                general.upgradeGeneral(parseInt(generalId),(res:ITransResult)=>{
                                    logger.info("doUpgradeGeneral ",{res})
                                })
                            }
                            return false
                        }
                    }
                    //if not able,dirty data so skip
                    return true
                }
            case GuideCommandType.UpgradeGeneralSkill:
                {
                    const gid = cmd.arg1
                    const skillId = parseInt(cmd.arg2)
                    const targetLevel = parseInt(cmd.arg3)
                    const glist = general.getGeneralList()
                    logger.info("check upgradeskill ",{g: glist[gid] })
                    if (general.checkGeneralSkillUpgrade(parseInt(gid),skillId )){

                        logger.info("general upgradeskill " ,{targetLevel,currSkillLevel:glist[gid].skilllevel[skillId],gid} )

                        if(glist[gid].skilllevel[skillId] >= targetLevel){
                            return true
                        }else{
                            general.upgradeGeneralSkill(parseInt(gid),skillId,(res:ITransResult)=>{
                                logger.info("upgradeGeneralSkill ",{res})
                            })
                            return false
                        }
                    }else{
                        //if not able,no gold so skip
                        return true
                    }
                }

            default:
                return true
//                if city.getGold()
        }

    }

}

class StrategyExecutor {
    private static instance: StrategyExecutor;

    playerState: PlayerState
    cronJobInterval: NodeJS.Timer
    strategyList: Strategy[]

    runFlag: boolean
    startedFlag: boolean


    // Private constructor so it can't be instantiated from outside
    private constructor() {
        // Initialization code
        this.strategyList = []
        this.playerState = new PlayerState()
    }

    public static getInstance(): StrategyExecutor {
        if (!StrategyExecutor.instance) {
            StrategyExecutor.instance = new StrategyExecutor();
        }
        return StrategyExecutor.instance;
    }



    public start(){
        if(this.startedFlag){
            return false
        }
        logger.info("StrategyExecutor start")
        this.startedFlag = true
        this.cronJobInterval = setInterval(async ()=>{
            if(this.runFlag){
                return
            }
            this.runFlag = true
            try{
                await this.runStep()
            }catch(e){
                logger.error("StrategyExecutor runStep error ",{e})
            }
            this.runFlag = false
        },30000)
        return true
    }

    public async runStep(){
        logger.info("StrategyExecutor Run step")
        for (const strategy of this.strategyList) {
            logger.info("StrategyExecutor Run strategy")
            await strategy.runStep()
        }


    }

    public addStrategy(strategy: Strategy){
        this.strategyList.push(strategy)
    }

}




class StrategyCord implements Strategy{

    playerState: PlayerState
    constructor(playerState: PlayerState){
        this.playerState = playerState
    }


    async runStep(){
        logger.info("StrategyCord runStep")
        const {city,general,map} = this.playerState

        const cordList = await general.getCodList()
        logger.info("codList is ",cordList)
        //codList is  {"codList":[{"blockInfo":{"x_id":-8,"y_id":-8},"codId":"block_-8_-8","createTime":1703427073,"creator":"0x24e05291ebff19eb7cc503fa8a6bb262d7ca2e37","generalId":3,"lastTime":3600,"members":[{"generalId":3,"joinTime":1703427073,"troops":500,"username":"0x24e05291ebff19eb7cc503fa8a6bb262d7ca2e37"}],"membersMap":{"0x24e05291ebff19eb7cc503fa8a6bb262d7ca2e37":{"generalId":3,"joinTime":1703427073,"troops":500,"username":"0x24e05291ebff19eb7cc503fa8a6bb262d7ca2e37"}},"troopNow":500,"troopTotal":1000,"unionId":3,"updateTime":1703427073}],"cods":{"block_-8_-8":{"blockInfo":{"x_id":-8,"y_id":-8},"codId":"block_-8_-8","createTime":1703427073,"creator":"0x24e05291ebff19eb7cc503fa8a6bb262d7ca2e37","generalId":3,"lastTime":3600,"members":[{"generalId":3,"joinTime":1703427073,"troops":500,"username":"0x24e05291ebff19eb7cc503fa8a6bb262d7ca2e37"}],"membersMap":{"0x24e05291ebff19eb7cc503fa8a6bb262d7ca2e37":{"generalId":3,"joinTime":1703427073,"troops":500,"username":"0x24e05291ebff19eb7cc503fa8a6bb262d7ca2e37"}},"troopNow":500,"troopTotal":1000,"unionId":3,"updateTime":1703427073}}
        // {"codList":[],"cods":{}}
        if(cordList && cordList.codList){
            const glist = general.getGeneralList()
            for(let i  in cordList.codList){
                if (cordList.codList[i].unionId == Throne.instance().unionId){
                    const x = cordList.codList[i].blockInfo.x_id
                    const y = cordList.codList[i].blockInfo.y_id

                    const wrapWithPromise = async function(){
                        return new Promise((resolve, reject) => {
                            map.getDefenseList(parseInt(x),parseInt(y),(result)=>{
                                resolve(result);
                            })
                        });
                    }
                    const blockInfos :BlockDefenseInfo[]= await wrapWithPromise() as BlockDefenseInfo[]
                    const blockPower = blockInfos.reduce((sum,info)=>{return sum + (info.attack + info.defense )* info.troops},0)
                    logger.info("check blockInfo ",{blockInfos,x,y,blockPower} )
                    if( cordList.codList[i].troopNow >= cordList.codList[i].troopTotal * 0.5 &&  cordList.codList[i].troopNow <= cordList.codList[i].troopTotal * 0.9 ) {
                        let attackGeneralId = ""
                        for (const generalId in glist){
                            if (glist[generalId].able){
                                if (glist[generalId].stamina > 0){
                                    attackGeneralId = generalId
                                }
                            }
                        }
                
                        if( attackGeneralId == ""){
                                logger.info("no general has energy ",{glist})
                                return 
                        }else{
                            logger.info("general stamina ",{"general": attackGeneralId, "stamina":glist[attackGeneralId].stamina })
                            general.joinCod(cordList.codList[i].codId,parseInt(attackGeneralId),(res:ITransResult)=>{
                                logger.info("join cord res is ",{ res,cord : cordList.codList[i] ,general: glist[attackGeneralId]})
                            })
                            return 
                        }

                    }
                }
            }
        }
    }
}



class StrategyAttack implements Strategy{

    playerState: PlayerState
    constructor(playerState: PlayerState){
        this.playerState = playerState
    }


    async runStep(){
        logger.info("StrategyAttack runStep")
        const general = this.playerState.general

        const cordList = await general.getCodList()
        // {"codList":[],"cods":{}}
    }
}


async function start(args:BotStartArgs){

    var playerState = StrategyExecutor.getInstance().playerState


    StrategyExecutor.getInstance().addStrategy(new StrategyGuideBook(playerState, args.guideBook))
//    StrategyExecutor.getInstance().addStrategy(new StrategyBuiding(playerState))
//   StrategyExecutor.getInstance().addStrategy(new StrategyGeneral(playerState))
    StrategyExecutor.getInstance().addStrategy(new StrategyTroop(playerState))
    StrategyExecutor.getInstance().addStrategy(new StrategyGlory(playerState,args.templateType))
    //StrategyExecutor.getInstance().addStrategy(new StrategyAttack(playerState))
    StrategyExecutor.getInstance().addStrategy(new StrategyCord(playerState))


    const loginInfo = {
        username: args.address,
        seasonId: args.seasonId,
        wsurl: args.wsUrl
    }



    playerState.addObserver(StateUpdatedEvent.City, (event,city:ICityComponent) => {



    })

   const res =  await Throne.instance().init(loginInfo)
   logger.info("login res is ",res , " login Info is ",loginInfo)
    Throne.instance().initComponent(ComponentType.City, (city:ICityComponent) => {
        playerState.city = city
        playerState.notify(StateUpdatedEvent.City, city)

       if( StrategyExecutor.getInstance().start()){
        logger.info("Login success:" ,{username : loginInfo.username })
       }

    });
    Throne.instance().initComponent(ComponentType.General, (general:IGeneralComponent) => {
        playerState.general = general
        playerState.notify(StateUpdatedEvent.General, general)
    });
    Throne.instance().initComponent(ComponentType.Map, (map:IMapComponent) => {
        playerState.map = map
        playerState.notify(StateUpdatedEvent.Map, map)



    });
    Throne.instance().initComponent(ComponentType.Strategy, (strategy:IStrategyComponent) => {
        playerState.strategy = strategy
        playerState.notify(StateUpdatedEvent.Strategy, strategy)
    });
    Throne.instance().initComponent(ComponentType.Chain, (chain:IChainComponent) => {
        playerState.chain = chain
        playerState.notify(StateUpdatedEvent.Chain, chain)

    });
   
   logger.info("res: ", res)


}

interface BotStartArgs {
    seasonId: string;
    privateKey: string;
    env: string;
    address?: string 
    wsUrl?: string 
    guideBook:  GuideCommand[] 
    templateType: TemplateType
}

async function startBot(args:BotStartArgs) {

//    const pk = decrypt("867fe85a3944f7c18741072825a8a5249f4111295664b0a662ff0e161a666a28b3507fa1d4a1c3378fc04e26a68a0e28c46df519f1cf468a1d5f272f70d50ba71db2a2c7f72131b0da6f0c02b55d1059")
 //   logger.info("pk: "+ pk)

    const {seasonId,privateKey,env} = args
    const address =   (getWalletAddressFromPrivateKey(privateKey)).toLocaleLowerCase()
    const response = await fetch(`https://app.leagueofthrones.com/web/login?address=${address}`);
    const data:any = await response.json();
    console.log(data.Message)
    const signature =  signPersonalMessage(privateKey, data.Message)
    args.address = address

    //wss://app.leagueofthrones.com/ws/
    args.wsUrl = (env == "test"? "ws://test.leagueofthrones.com/" : "wss://app.leagueofthrones.com/" )+ `ws/${address}/${seasonId}?sign=${signature}&message=${data.Message}`

    logger.info('startBot args ',args);
    await start(args)

}


async function testmain() {
    const args : BotStartArgs = {
        seasonId: "test-oasis-2023-08-09-1",
        privateKey: process.env.PRIVATE_KEY,
        env: "test",
        guideBook: initGuidBook()[TemplateType.PayedPeace],
        templateType:TemplateType.PayedPeace,
    }

    await startBot(args)
}





function loadTxtFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error("Error reading the file:", err);
        return null;
    }
}


function loadWallets() {
    const walletTxt = loadTxtFile("./src/BotLogic/BotJS/data/wallets.txt")
    const wallets = walletTxt.split("\n").map((wallet) => {
        const [address, privateKey] = wallet.split(",")
        return {
            address,
            privateKey
        }
    })
    return wallets
}


enum TemplateType {
    NonePayPeace = 1,
    NonePayAttacktor = 2,
    PayedPeace = 3,
    PayedAttacktor = 4,
}

function getTemplateIdByIndex(walletIndex:number) :TemplateType{
    walletIndex = walletIndex%40
    if( walletIndex < 20) {
        return TemplateType.NonePayAttacktor
    }else{
        return TemplateType.NonePayPeace
    }

    if( walletIndex < 4) {
        return TemplateType.PayedPeace
    } else if( walletIndex < 8) {
        return TemplateType.PayedAttacktor
    } else if (walletIndex < 14) {
        return TemplateType.NonePayPeace
    } else{
        return TemplateType.NonePayAttacktor
    }
}

async function main() {
    const targetWallets = loadWallets()
    const guideBookByTemplate = initGuidBook()
    const wallet = targetWallets[parseInt(process.env.WALLET_INDEX)]
    const seasonId = process.env.SEASON_ID
    const env = process.env.ENV || "prod"

    logger.info("start main ",{wallet,seasonId,env})

    const templateType = getTemplateIdByIndex(parseInt(process.env.WALLET_INDEX))
    const guideBook = guideBookByTemplate[templateType]

    const args : BotStartArgs = {
        seasonId: seasonId,
        privateKey: decrypt(wallet.privateKey),
        env: env,
        guideBook: guideBook,
        templateType:templateType,
    }
    startBot(args)
}

main()
