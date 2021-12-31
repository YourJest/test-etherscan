import axios from 'axios';

let lastBlockNum : number;
let prevLastBlockNum = 0;
let transactions = [];
let transactionsCache = [];
let walletValues = new Map();
let blocksToRequest = undefined;

const requestLimit = 5;
const ethPow = Math.pow(10, -18);
const weiPow = Math.pow(10, 18);
const apiKey = '5HT7R1HG289JWM6K949DDK6F9GKF7GA5CK';

//Get last block of etherscan transactions. If it is different, update transactions.
export async function getLastBlock(){
    await axios.get('https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=' + apiKey).then(response => {
      prevLastBlockNum = lastBlockNum;
      let lastBlockStr = response.data.result;
      lastBlockNum = Number(lastBlockStr);
      //On init blocksToRequest are undefined, so we need to request all the transactions
      if(blocksToRequest === undefined){
        blocksToRequest = 100;
      }else{
        blocksToRequest = lastBlockNum - prevLastBlockNum;
      }
      //If we have new blocks, then we need to update transactions and then update wallets 
      if(blocksToRequest > 0){
        if (transactionsCache.length > 0) {
          transactions = [...transactionsCache];
          //console.log(blocksToRequest);
          transactionsCache.splice(0, blocksToRequest);
          updateWalletValues();
        }
        console.log("new block: " + lastBlockNum + " | prev: " + prevLastBlockNum);
        //Timeout is just to be sure that we don't fail with request limit.
        setTimeout(() => getBlocksTransactions(lastBlockNum), 1100);
      }else{
        //No new blocks, waiting for new
        blocksToRequest = 0;
        setTimeout(() => getLastBlock(), 1100);
      }
    })
}
  
//Recurrently requesting block transactions until all blocksToRequest will be processed. 
function getBlocksTransactions(block : number){
    let reqUrl = [];
    let requestCounter = 0;
    if(blocksToRequest < requestLimit){
      requestCounter = blocksToRequest;
    }else {
      requestCounter = requestLimit;
    }
    //Preparing urls to send
    for(let i = block; i > block - requestCounter; i--){
      let hexBlock = "0x" + i.toString(16);
      let np = 'https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=' + hexBlock + '&boolean=true&apiKey=' + apiKey;
      reqUrl.push(np);
    }
    //Using axios.all to request all urls at the same time
    axios.all(reqUrl.map((r)=> axios.get(r))).then(response => {
      for(let i = 0; i < requestCounter; i++){
        transactionsCache.push(response[i].data.result.transactions);
      }
      blocksToRequest -= requestCounter;
      block -= requestCounter;
      if(blocksToRequest > 0){
        setTimeout(() => getBlocksTransactions(block), 1100);
      }else{
        //We have all transactions, wait for new blocks;
        setTimeout(() => getLastBlock(), 1100);
      }
    })
}

//Go through all transactions and find sum of all values of wallet
export function updateWalletValues(){
    walletValues.clear();
    //console.log(transactions.length);
    for(let i = 0; i < transactions.length; i++){
      for(let j = 0; j < transactions[i].length; j++) {
        let walletFrom = transactions[i][j].from;
        let walletTo = transactions[i][j].to;
        if(!walletValues.has(walletFrom)){
          walletValues.set(walletFrom, weiToEth(transactions[i][j].value));
        }else{
          walletValues.set(walletFrom, walletValues.get(walletFrom) + weiToEth(transactions[i][j].value));
        }
        if(!walletValues.has(walletTo)){
          walletValues.set(walletTo, weiToEth(transactions[i][j].value));
        }else{
          walletValues.set(walletTo, walletValues.get(walletTo) + weiToEth(transactions[i][j].value));
        }
      }
    }
}
  
//Return walletValues converted to array
export function getWallets() : any[]{
    if(walletValues.size > 0){
        return [{
            status : 'success',
            result : {
                wallets : [...walletValues]
            }
        }];
    }else{
        return [{
            status : 'error',
            result : {
                info : 'Wallets are still loading, try again later'
            }
        }]
    }
}
  
//Find highest value
export function getHighestValue() : any[]{
  if(walletValues.size > 0){
        //Converting map to array to use array functions
        //Key(Wallet address) is in the first element, value is in the second
        let walletToArray = [...walletValues] 
        //Get object with the highest value
        let maxWallet = walletToArray.reduce((max, wallet) => (max[1] > wallet[1] ? max : wallet));
        return [{
            status: 'success',
            result: {
                wallet : maxWallet[0],
                weiValue : ethToWeiHexStr(maxWallet[1]),
                ethValue : maxWallet[1]}
        }];
    }else{
        return [{
            status : 'error',
            result : {
                info : 'Wallets are still loading, try again later'
            }
        }]
    }
    
}

//Return all transactions if they are fully loaded
export function getTransactions() : any[]{
    if(transactions.length > 0){
        return [{
            status : 'success',
            result : {transactions : transactions}
        }];
    }else{
        return[{
            status : 'error',
            result : {
                info : 'Transactions are still loading, try again later'
            }
        }]
    }
}

//Convert wei to eth. Just for more readable result and easier calculations
function weiToEth(wei : string) : number{
    return Number(wei) * ethPow;
}

//Convert eth to wei string
function ethToWeiHexStr(eth : number) : string{
    return '0x' + (eth * weiPow).toString(16);
}