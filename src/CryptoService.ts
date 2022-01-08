import crypto from "crypto-js";
import axios from "axios";
import { ICoin, IMarket, IBalance } from "./Interface";
import { Config } from './Config.js';
import { NewOrderReq, RestClient } from "ftx-api";

const config = new Config();

const restClientOptions = { subAccountName: config.subAccountName };
const client = new RestClient(config.key, config.secret, restClientOptions);

export class CryptoService {

    public async getCoinMK(vs_currency: string, count: number): Promise<ICoin[] | undefined> {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&order=market_cap_desc&per_page=${count}&page=1&sparkline=false`
            
        ).catch((error) => {
            console.log(error);
        })

        if (response){
            return response.data;
        }

    }

    public async getMarkets(): Promise<IMarket[] | undefined> {
        const response = await client.getMarkets().catch((error) => {
            console.log(error);
        })
        if (response){
            return response.result;
        }
    }

    public async getBalance(): Promise<IBalance[] | undefined> {
        const response = await client.getBalances().catch((error) => {
            console.log(error);
        })
        if (response){
            return response.result;
        }
    }

    public async ftxMarketSellOrder(market: string, size: number) {
        try {
            let resp = await client.placeOrder({
              market,
              side: "sell",
              price: null,
              type: "market",
              size: size,
            });
      
            if (resp) {
              if (resp.success) {
                //console.log(`[MARKET ${market}] SELL order: ${size}`);
                return true;
              }else{
                console.warn(`[ALERT] Market sell order not successful ${resp.body.error}`);
                return false;
              }
            } else {
              console.warn(`[ALERT] Market sell order not successful`);
              return false;
            }
          } catch (err) {
            console.warn(`[ALERT] Market sell order not successful ${err.body.error}`);
            return false;
          }
    }
    public async ftxMarketBuyOrder(market: string, size: number) {
        try {
            let resp = await client.placeOrder({
              market,
              side: "buy",
              price: null,
              type: "market",
              size: size,
            });
      
            if (resp) {
              if (resp.success) {
                //console.log(`[MARKET ${market}] BUY order: ${size}`);
                return true;
              }else{
                console.warn(`[ALERT] Market buy order not successful ${resp.body.error}`);
                return false;
              }
            } else {
              console.warn(`[ALERT] Market buy order not successful`);
              return false;
            }
          } catch (err) {
            console.warn(`[ALERT] Market buy order not successful ${err.body.error}`);
            return false;
          }
    }    
}