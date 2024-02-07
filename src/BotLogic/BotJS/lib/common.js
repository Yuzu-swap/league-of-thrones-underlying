

const contractCaches = {}
function getContractIns(web3,abi,address) {
    if(!contractCaches[address]) {
        contractCaches[address] = new web3.eth.Contract(abi, address)
    }
    return contractCaches[address]
}
function getContractInsByType(web3,abi,address,type) {
    type = type||""
    if(!contractCaches[address+type]) {
        contractCaches[address+type] = new web3.eth.Contract(abi, address)
    }
    return contractCaches[address+type]
}

async function handlePairLog(zooPairsInfo,address,log) {
    const {topics,args} = log
    switch(log.topics){
        case "Swap":
            {
                const {sender,amount0In,amount1In,amount0Out,amount1Out} = args
               // console.log("handlePair log address  ",address ," amount0In,amount1In,amount0Out,amoun1Out ",amount0In,amount1In,amount0Out,amount1Out)
                const pairInfo = zooPairsInfo[address]


//                console.log("address is ",address, " trande0Amount ",JSBI.add( JSBI.BigInt(pairInfo.token0.tradeAmount) ,  JSBI.add( JSBI.BigInt(amount0In),JSBI.BigInt(amount0Out))).toString(10).toString() )
 //               console.log("address is ",address, " trande1Amount ",JSBI.add( JSBI.BigInt(pairInfo.token1.tradeAmount) ,  JSBI.add( JSBI.BigInt(amount1In),JSBI.BigInt(amount1Out))).toString(10).toString())
                pairInfo.token0.tradeAmount = JSBI.add( JSBI.BigInt(pairInfo.token0.tradeAmount) ,  JSBI.add( JSBI.BigInt(amount0In),JSBI.BigInt(amount0Out))).toString(10)
                pairInfo.token1.tradeAmount = JSBI.add( JSBI.BigInt(pairInfo.token1.tradeAmount) ,  JSBI.add( JSBI.BigInt(amount1In),JSBI.BigInt(amount1Out))).toString(10)
            }
            break
    }
}



class Wallet {
    constructor(privateKey,web3){
        this.web3 = web3
        this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey)
        this.gasPrice = "1000000000"
        this.gasLimit = this.web3.utils.toHex(2000000)
    }

    async syncNonce() {
        const nonce  =  await this.web3.eth.getTransactionCount(this.account.address)
       // if( !this.nonce || this.nonce < nonce) {
            console.log("sync nonce %d from blockchain",nonce)
            this.nonce = nonce
       // }
    }

    async asyncExecute(){

    }

    async transfer(to,value){
        const tx = {
            nonce: this.nonce,
            gasPrice: this.gasPrice,
            gasLimit:  this.gasLimit,
            value: value || '0x00',
            to: to,
        }
        this.nonce += 1
        const signedTx = await this.account.signTransaction(tx)
        const res = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        if (!res.status) {
            throw res
        } else {
            return res
        }
    }

    /*
    async executeBatch(methods){
        let startNonce =  this.nonce
        const trans = []
        const defaultGasLimit = this.gasPrice
        const gasPrice = this.gasPrice
        const account = this.account.address
        const jobs = methods.map(  method => async function() {
            let gasLimit = ""
            try{
                gasLimit  = await method.estimateGas({from : account})
            }catch(err){
                console.log("estimateGas  ",method," ,args:",  method.arguments  , " error ",err)
            }
            const myNonce = startNonce
            startNonce+=1

            const tx =  {
                nonce: nonce-1,
                gasPrice: gasPrice,
                gasLimit: gasLimit|| defaultGasLimit,
                value: value || '0x00',
                to : method._parent._address,
                data: method.encodeABI()
            }
            const signedTx = await this.account.signTransaction(tx)
            trans.push(signedTx)
        })
        await parallel(jobs,5)
    }
    */
    async execute(method,value){
//        console.log(" execute ", method._parent._address,(method.arguments))
        try{

            this.nonce += 1
            const nonce = this.nonce

            let gasLimit = ""
            try{
                gasLimit  = await method.estimateGas({from : this.account.address,value:value})
            }catch(err){
                console.log("estimateGas  ",method," ,args:",  method.arguments  , " error ",err)
            }


            const tx =  {
                nonce: nonce-1,
                gasPrice: this.gasPrice,
                gasLimit: gasLimit|| this.gasLimit,
                value: value || '0x00',
                to : method._parent._address,
                data: method.encodeABI()
            }
            console.log("Execute nonce is ",tx.nonce-1)
            const signedTx = await this.account.signTransaction(tx)
            const res =await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            if(!res.status) {
                throw res
            }else{
                return res
            }
        }catch(err){
            console.log("wallet execute transaction error ",err, " re sync nonce")
            await this.syncNonce()
        }
    }

}

exports.handlePairLog = handlePairLog
exports.getContractIns = getContractIns
exports.getContractInsByType = getContractInsByType
exports.Wallet = Wallet
