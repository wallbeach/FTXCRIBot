export class Config {

        key = "";
        secret = "";
        subAccountName = "";

        basCurrency        = "USD";
        exclCoins          = ["SHIB", "BNB", "USDT", "USDC", "BUSD", "DAI", "UST", "LUSD", "PAX", "TUSD", "FEI"];  // Stable coins to hold value on the exchange
        inclCoins          = ["CRO"];  // coins to include in list even if they are out of the market cap range

        rebalTreshold      = 5;        // Percent

        mcFrom             = 1;        // Market cap rank starting    
        mcTo               = 5;       // Market cap rank ending

        dcaValue           = 25;    

}