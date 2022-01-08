import { NumericLiteral } from "typescript";
import { Database } from "./Database.js";
import { IBalance } from "./Interface.js";

class Portfolio {
    constructor() {}

    public async saveBalance(balance: IBalance) {
        await Database.execute({
            command: `
                INSERT INTO "Balance" (
                    "coin",
                    "timestamp",
                    "free",
                    "total",
                    "usdvalue"
                ) VALUES (
                    $coin,
                    $timestamp,
                    $free,
                    $total,
                    $usdvalue
                )`,
            params: {
                $coin:         balance.coin,
                $timestamp:    Date.now().toLocaleString(),
                $free:         balance.free,
                $total:        balance.total,
                $usdvalue:     balance.usdValue
            }
        });
    }

    public async savePortfolio(usdValue: number, btcprice: number) {
        await Database.execute({
            command: `
                INSERT INTO "Balance" (
                    "timestamp",
                    "usdvalue",
                    "btcprice"
                ) VALUES (
                    $timestamp,
                    $usdvalue,
                    $btcprice
                )`,
            params: {
                $timestamp:    Date.now().toLocaleString(),
                $usdvalue:     usdValue,
                $btcprice:     btcprice
            }
        });
    }   


}

const _Portfolio = new Portfolio();
export { _Portfolio as Portfolio }