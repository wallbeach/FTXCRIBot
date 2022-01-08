import cron from 'node-cron';
import express from 'express';
import { Account } from './Account.js';
import { Config } from './Config.js';
import { Database } from './Database.js';

const config    = new Config();

async function rebalance(){

    const account   = new Account();

    // Get all wanted instruments that are also tradable on exchange
    await account.calcIndexInstruments();

    await account.calcAllocation();

    //await account.logInfo();

    //console.log(`\u001b[1;36m [Info]\tSell Overperformers`);
    await account.sellOverperformers();

    let surplus = account.getSurplus();

    if (surplus > 0){
        //console.log(`\u001b[1;36m [Info]\tBuy Underperformers [${surplus}]`);
        await account.buyUnderperformers();
    }

    // if there still money left to invest set treshold to 0 to buy all pairs under expected allocation
    surplus = account.getSurplus();
    if (surplus > 1){
        //console.log(`\u001b[1;36m [Info]\tBuy Underperformers (without treshold) [${surplus}]`);
        await account.buyUnderperformers(0);
    }

}

async function dca(){

    const account   = new Account();

    // Get all wanted instruments that are also tradable on crypto.com exchange
    await account.calcIndexInstruments();

    await account.calcAllocation();

  //  await account.savePortfolio();

    await account.sellOutOfIndex();

    await account.logInfo();
    
    let surplus = config.dcaValue;

    account.setSurplus(surplus);
    if (surplus <= account._usdValue){
        // first buy all underperformers and ignore treshold
        if (surplus > 1){
           // console.log(`\u001b[1;36m [Info]\tBuy Underperformers (without treshold) [${surplus} USD]`);
            await account.buyUnderperformers(0);
        }

        surplus = account.getSurplus();

        if (surplus > 1){
            //console.log(`\u001b[1;36m [Info]\tAdd Money [${surplus} USD]`);

            await account.addMoney(surplus);
        }
    }
}

async function showInfo(){

    const account   = new Account();
    await account.calcIndexInstruments();
    await account.calcAllocation();

    await account.logInfo();
}



async function startTrading() {

 //   await Database.open();

    // Startup
    await showInfo();

    const app = express();

    cron.schedule(`*/5 * * * *`, function() {
        rebalance();
    });

    cron.schedule(`30 13 * * *`, function() {
        dca();
    });

    app.listen(3005);

}

startTrading();