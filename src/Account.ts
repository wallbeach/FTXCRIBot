import { Config } from './Config.js';
import { CryptoService } from './CryptoService.js';
import { ICoin, IMarket, IBalance } from "./Interface";
import { Portfolio } from './Portfolio.js';


const config = new Config();
const svc = new CryptoService();

export class Account {
    _indexInstruments:   ICoin[];
    _coinsMK: ICoin[] | undefined;  
    _inclCoins:  string[];
    _exclCoins:  string[];

    market: IMarket[] | undefined;
    balance: IBalance[] | undefined;

    _rebalTreshold: number;

    _surplus: number;
    _usdValue: number;
    _dcaAmount: number;
    _totalValue: number;

    constructor(){
        this._indexInstruments  = [];
        this._coinsMK           = [];

        this.market             = [];
        this.balance            = [];

        this._inclCoins         = config.inclCoins;
        this._exclCoins         = config.exclCoins;
        this._rebalTreshold     = config.rebalTreshold;
        this._surplus           = 0;
        this._usdValue          = 0;
        this._dcaAmount         = 0;
        this._totalValue        = 0;
    }

    public getDcaAmount(): number {
        return this._dcaAmount;
    }

    public setDcaAmount(dcaAmount: number): void {
        this._dcaAmount = dcaAmount;
    }

    public getSurplus(): number {
        return this._surplus;
    }

    public setSurplus(surplus: number): void {
        this._surplus = surplus;
    }

    public async calcIndexInstruments() {
        // 1. Get Coins by market cap
        this._coinsMK = await svc.getCoinMK(`usd`, 100);

        for (const c in this._coinsMK){
            this._coinsMK[c].symbol = this._coinsMK[c].symbol.toUpperCase();
        }

        this.market = await svc.getMarkets();

        const mcFrom = config.mcFrom;
        let mcTo = config.mcTo;


        if (this._coinsMK && this.market) {

            // Add Coins manually included as long as they are available on exchange
            for (const c of config.inclCoins) {
                if(this.market.some(m => m.baseCurrency === c)){        // Check if coin is avalable at exchange
                    let coinIndex = this._coinsMK.findIndex(obj => obj.symbol.toUpperCase() == c.toUpperCase());  // get Coin by market cap as it's not allways in order
                    const coin = this._coinsMK[coinIndex];
                    coin.symbol = coin.symbol.toUpperCase();
                    this._indexInstruments.push(coin);

                    mcTo -= 1;
                }
            }

            for(let i = 1; i < 100; i++){       
                let coinIndex = this._coinsMK.findIndex(obj => obj.market_cap_rank == i);  // get Coin by market cap as it's not allways in order
                const coin = this._coinsMK[coinIndex];
                if(!this._indexInstruments.includes(coin) && !this._exclCoins.includes(coin.symbol)){
                    if (coin.market_cap_rank >= mcFrom && coin.market_cap_rank <= mcTo){
                        if(this.market.some(m => m.baseCurrency === coin.symbol)){        // Check if coin is avalable at crypto.com exchange
                            coin.symbol = coin.symbol.toUpperCase();
                            this._indexInstruments.push(coin);
                        }else{
                            mcTo += 1;
                        }    
                    }else{
                        break;
                    }
                }else{
                    mcTo += 1;
                }
    
            }
        }
    }

    public async calcAllocation(){
        this.balance = await svc.getBalance();

        for (const b in this.balance){
            this.balance[b].coin = this.balance[b].coin.toUpperCase();
            if(this.balance[b].coin == 'USD'){
                this._usdValue = this.balance[b].usdValue;
            }else{
                this._totalValue += this.balance[b].usdValue;
            }            
        }

        if (this.balance && this._indexInstruments) {

            for (const i of this._indexInstruments) {
                
                let balanceIndex = this.balance.findIndex(obj => obj.coin === i.symbol);
                i.currAllocation = 0;
                i.currValue      = 0;
                if(balanceIndex != -1){
                    i.currAllocation  = Math.round(this.balance[balanceIndex].usdValue / this._totalValue * 100*1000)/1000;
                    i.currValue       = Math.round(this.balance[balanceIndex].usdValue*1000)/1000;
                }
                
                i.expAllocation   = Math.round(100/(this._indexInstruments.length) *1000)/1000;
                i.expValue        = Math.round(this._totalValue / 100 * i.expAllocation *1000)/1000;
            }
        }    
    }

    public async sellOutOfIndex(){
        //4. Sell Coins which are not in the list

        if(this.balance){
            for (const b of this.balance){
                let coinIndex   = this._indexInstruments.findIndex(obj => obj.symbol == b.coin);

                if (coinIndex == -1 && b.usdValue >= 1 && b.coin != 'USD'){
                    console.log(`\u001b[1;33m [INDEX]\t${b.coin} fell out of index, sell position`);
                    
                    await svc.ftxMarketSellOrder(`${b.coin}/USD`,b.free);
                    this._surplus += b.usdValue;
                }
            }
        } 
    }

    async sellOverperformers() {
        if(this._indexInstruments){
            for (const i of this._indexInstruments) {

                if(i.currAllocation > i.expAllocation*(1 + this._rebalTreshold/100)){
                    let sellValue       = i.currValue - i.expValue;
                    let sellQuantity    = sellValue / i.current_price;
                    console.log(`[REBALANCE ${i.symbol}]\tSELL ${sellQuantity}\tat a price of ${i.current_price}\tTotal ${sellValue.toFixed(3)} USD]`);

                    let success = await svc.ftxMarketSellOrder(`${i.symbol}/USD`,sellQuantity);
                    if (success){
                        this._surplus += i.current_price * sellQuantity;
                    }
                }
            }
        }    
    }

    async buyUnderperformers(rebalTreshold?: number) {

        let buyValue = 0;
        let treshold = this._rebalTreshold;
        if(rebalTreshold != undefined){
            treshold = rebalTreshold;
        }

        if(this._indexInstruments){
            for (const i of this._indexInstruments) {

                if(i.currAllocation < i.expAllocation*(1 - treshold/100)){
                    let buyValue       = i.expValue - i.currValue;
                    if(this._surplus < buyValue){
                        buyValue = this._surplus;
                    }
                    let buyQuantity    = buyValue / i.current_price;
                    console.log(`[REBALANCE ${i.symbol}]\tBUY ${buyQuantity}\tat a price of ${i.current_price}\tTotal ${buyValue.toFixed(3)} USD]`);

                   let success = await svc.ftxMarketBuyOrder(`${i.symbol}/USD`,buyQuantity);
                   if(success){
                    this._surplus = this._surplus - buyValue;
                   }
                }

                if(this._surplus == 0){
                    //console.log(`[REBALANCE]\twas stopped because money limit was reached`);
                    return;
                }
            }
        }
    }

    async addMoney(dcaAmount: number){
        if(this._indexInstruments){
            for (const i of this._indexInstruments) {

                let buyValue       = dcaAmount / this._indexInstruments.length;
                let buyQuantity    = buyValue / i.current_price;

                console.log(`[DCA ${i.symbol}]\tBUY ${buyQuantity}\tat a price of ${i.current_price}\t[${(i.current_price * buyQuantity).toFixed(3)} USD]`)
                
                await svc.ftxMarketBuyOrder(`${i.symbol}/USD`,buyQuantity);
                
            }
        }
    
    }


    async logInfo() {
        if (this._indexInstruments) {
            
            console.log(`\u001b[1;36m[Info]\tTotal invested \t${this._totalValue} USD`);
            console.log(`\u001b[1;36m[Info]\tUSDT left \t${this._usdValue} USD`);

            for (const i in this._indexInstruments) {
                console.log(`[${this._indexInstruments[i].symbol}] \tRank ${this._indexInstruments[i].market_cap_rank}\tCurrent Allocation ${this._indexInstruments[i].currAllocation}%\t[${this._indexInstruments[i].currValue} USD]\texpected Allocation ${this._indexInstruments[i].expAllocation}%\t[${this._indexInstruments[i].expValue} USD]`);
            }
        }
    }

    async savePortfolio(){
        this.balance = await svc.getBalance();

        for (const b of this.balance){   
            Portfolio.saveBalance(b);
        }
  
        let index = this._indexInstruments.findIndex(obj => obj.symbol === "BTC");
        Portfolio.savePortfolio(this._totalValue, this._indexInstruments[index].current_price);

    }

}