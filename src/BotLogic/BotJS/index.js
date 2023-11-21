const ThroneAbi = require("./data/throne.json").abi
const fetch = require('node-fetch');
const Web3 = require('web3')
const fs = require('fs');
const {getContractIns,Wallet} = require('./lib/common')
const {decrypt} = require('./lib/walletmgr')

function loadTxtFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error("Error reading the file:", err);
        return null;
    }
}


function loadWallets() {
    const walletTxt = loadTxtFile("./data/wallets.txt")
    const wallets = walletTxt.split("\n").map((wallet) => {
        const [address, privateKey] = wallet.split(",")
        return {
            address,
            privateKey
        }
    })
    return wallets
}
//load txt file


const web3 = new Web3('https://bsc-dataseed1.binance.org/')
const ContractAddr = "0x6A56428C6e727D08297aDAC6F03e2d7b5F38914A"
const lot = getContractIns(web3,ThroneAbi,ContractAddr)

async function bscTransfer(execute,topN) {
  //  const seasonId = "prod-bsc-2023-08-14-1"
 //   const getNftaddrs = await lot.methods.getNFTAddresses(seasonId).call()
//    console.log("nftaddrs",getNftaddrs)

    const wallet = new Wallet(process.env.PRIVATE_KEY,web3)
    wallet.gasPrice =    3000000000 //3 gwei
    console.log("wallet",wallet.account.address)
    await wallet.syncNonce()


    const targetWallets = loadWallets()
    console.log("targetWallets",targetWallets)

    for(let i = 1 ;i< topN ;i++){
        const toAddr = targetWallets[i].address
        if(execute){
            const res = await wallet.transfer(toAddr, web3.utils.toWei("0.06", "ether"))
            console.log("transfer to ",toAddr,res)
        }else{
            console.log("transfer to ",toAddr)
        }
    }
}

//bscTransfer(true)
async function signUp(seasonId,execute,topN){

    const targetWallets = loadWallets()
//    console.log("targetWallets",targetWallets)
    for(let i = 0 ;i< topN ;i++){
        const {address,privateKey} = targetWallets[i]
        const pk =  decrypt(privateKey)

        const wallet = new Wallet(pk,web3)
        wallet.gasPrice =    3000000000 //3 gwei
        console.log("\nwallet",wallet.account.address)
        await wallet.syncNonce()
        // signUpGame(string memory seasonId,uint256 unionId, uint256 ntf1TokenId, uint256 ntf2TokenId)
        if(execute){
            const res = await wallet.execute(lot.methods.signUpGame(seasonId,0,0,0))
            console.log("signUp",address,res)
        }else{
            console.log("signUp",address)
        }
    }
}


async function recahrge(seasonId,execute,topN){
    const targetWallets = loadWallets()
    for(let i = 1 ;i< topN ;i++){
        const {address,privateKey} = targetWallets[i]
        const pk =  decrypt(privateKey)

        const wallet = new Wallet(pk,web3)
        wallet.gasPrice =   3000000000 //3 gwei

        console.log("\nwallet",wallet.account.address)
        await wallet.syncNonce()
        // signUpGame(string memory seasonId,uint256 unionId, uint256 ntf1TokenId, uint256 ntf2TokenId)
        if(execute){
            const rechargeId = 18
            const rechargeAmount ="40000000000000000"
            const res = await wallet.execute(lot.methods.recharge(seasonId,rechargeId,rechargeAmount),rechargeAmount)
            console.log("recahrge",address,res)
        }else{
            console.log("recahrge",address)
        }
    }
}

signUp("prod-bsc-2023-11-4-1-1",true,20)
//recahrge("prod-bsc-2023-08-31-1",true,4)
//bscTransfer(true,4)