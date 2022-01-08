interface ICoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  currValue: number;
  expValue: number;
  currAllocation: number;
  expAllocation: number;
}

interface IMarket {
  name: string;
  baseCurrency: string;
  quoteCurrency: string;
  quoteVolume24h: number;
  change1h: number;
  change24h: number;
  changeBod: number;
  highLeverageFeeExempt: boolean;
  minProvideSize: number;
  type: string;
  underlying: string;
  enabled: boolean;
  ask: number;
  bid: number;
  last: number;
  postOnly: boolean;
  price: number;
  priceIncrement: number;
  sizeIncrement: number;
  restricted: boolean;
  volumeUsd24h: number;
}

interface IBalance{
    coin:	string;
    free:	number;
    spotBorrow:	number;
    total:	number;
    usdValue:	number;
    availableWithoutBorrow:	number;
}

export { ICoin, IMarket, IBalance };
