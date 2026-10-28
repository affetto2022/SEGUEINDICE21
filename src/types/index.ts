export type Timeframe = '5m' | '15m' | '60m' | '1d';

export type TrendState =
  | 'ALTA FORTE'
  | 'ALTA PERDENDO FORÇA'
  | 'ALTA EM ACELERAÇÃO'
  | 'BAIXA FORTE'
  | 'BAIXA PERDENDO FORÇA'
  | 'BAIXA EM ACELERAÇÃO'
  | 'NEUTRO'
  | 'TRANSIÇÃO'
  | 'DADOS INSUFICIENTES';

export type SlopeClassification =
  | 'ASCENDENTE'
  | 'DESCENDENTE'
  | 'HORIZONTAL'
  | 'DADOS INSUFICIENTES';

export type RSIClassification =
  | 'SOBRECOMPRA'       // > 70
  | 'COMPRA_ELEVADA'    // 60 - 70
  | 'NEUTRO'            // 40 - 60
  | 'VENDA_ELEVADA'     // 30 - 40
  | 'SOBREVENDA'        // < 30
  | 'DADOS INSUFICIENTES';

export type AlignmentState =
  | 'ALINHAMENTO COMPRADOR'
  | 'ALINHAMENTO VENDEDOR'
  | 'CONFLITO MULTIPERÍODO'
  | 'REVERSÃO EM OBSERVAÇÃO'
  | 'DADOS INSUFICIENTES';

export interface Candle {
  symbol: string;
  timeframe: Timeframe;
  timestamp: string; // ISO format or Sao Paulo date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  is_closed: boolean;
  source: string;
  fetched_at: string;
}

export interface TimeframeIndicators {
  sma200: number | null;
  distancePercent: number | null;
  slopePercent: number | null;
  slopeClassification: SlopeClassification;
  distanceEvolutionDelta: number | null;
  trendState: TrendState;
  rsi14: number | null;
  rsiClassification: RSIClassification;
  candleReturn: number | null;
  score: number | null; // -100 to +100
  scoreCoverage: number; // 0.0 to 1.0
  candleCount: number;
  hasSufficientHistory: boolean;
  lastCandleTimestamp: string | null;
}

export interface AssetMetrics {
  ticker: string;
  name: string;
  weight: number; // percentage in Ibov, e.g. 12.35
  currentPrice: number | null;
  previousClose: number | null;
  dailyReturn: number | null; // percentage e.g. +1.45%
  estimatedContribution: number | null; // weight * dailyReturn / 100
  intradiaryPressure: number | null;
  indicatorsByTimeframe: Record<Timeframe, TimeframeIndicators>;
  multiperiodScore: number | null;
  multiperiodAlignment: AlignmentState;
  lastUpdate: string;
  dataStatus: 'VALID' | 'DELAYED' | 'UNAVAILABLE';
  source: string;
  isWatchlistOnly?: boolean;
}

export interface IndexCompositionItem {
  ticker: string;
  name: string;
  weight: number;
  sector?: string;
}

export interface IndexComposition {
  referenceDate: string;
  validFrom: string;
  validTo: string;
  source: string;
  totalWeight: number;
  assetCount: number;
  assets: IndexCompositionItem[];
}

export interface MarketSummary {
  ibov: {
    ticker: string;
    price: number | null;
    changePercent: number | null;
    timestamp: string | null;
    source: string;
    status: 'VALID' | 'DELAYED' | 'UNAVAILABLE';
  };
  winfut: {
    ticker: string;
    contract: string;
    maturity: string;
    price: number | null;
    changePercent: number | null;
    basis: number | null; // WINFUT - IBOV points
    timestamp: string | null;
    source: string;
    status: 'VALID' | 'DELAYED' | 'UNAVAILABLE';
  };
  percentAboveMM200Daily: number;
  percentBelowMM200Daily: number;
  countBullStrength: number;
  countBearStrength: number;
  countOverbought: number;
  countOversold: number;
  aggregateMarketScore: number;
  marketAlignment: AlignmentState;
  validAssetsCoverage: number; // percentage, e.g. 98.8%
  validAssetsCount: number;
  totalAssetsCount: number;
  lastSuccessUpdate: string;
  confirmationStatus: string;
}

export interface ScoreWeights {
  mm200Position: number;        // default 20%
  mm200Slope: number;           // default 20%
  distanceEvolution: number;    // default 20%
  returnNormalized: number;     // default 15%
  rsi: number;                  // default 10%
  directionalConsistency: number; // default 15%
}

export interface MultiperiodWeights {
  daily: number; // 40%
  h1: number;    // 30%
  m15: number;   // 20%
  m5: number;    // 10%
}

export interface UserSettings {
  autoRefreshIntervalSeconds: number; // 0, 60, 120, 300
  defaultTimeframe: Timeframe | 'multi';
  scoreWeights: ScoreWeights;
  multiperiodWeights: MultiperiodWeights;
  slopePeriodN: number; // default 5 candles
  activeProvider: 'yahoo_free' | 'b3_official' | 'custom_csv' | 'mock_resilience';
}

export interface StrengthHistoryPoint {
  timestamp: string;
  aggregateScore: number;
  bullStrengthScore: number;
  bearStrengthScore: number;
  ibovReturn: number;
  winfutReturn: number;
}
