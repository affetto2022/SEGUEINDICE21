import {
  Timeframe,
  TrendState,
  SlopeClassification,
  RSIClassification,
  AlignmentState,
  ScoreWeights,
  MultiperiodWeights,
} from '../types';

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  mm200Position: 0.20,
  mm200Slope: 0.20,
  distanceEvolution: 0.20,
  returnNormalized: 0.15,
  rsi: 0.10,
  directionalConsistency: 0.15,
};

export const DEFAULT_MULTIPERIOD_WEIGHTS: MultiperiodWeights = {
  daily: 0.40,
  h1: 0.30,
  m15: 0.20,
  m5: 0.10,
};

/**
 * Calculates Simple Moving Average (SMA) of 200 periods.
 * Strictly requires at least `period` (200) elements.
 */
export function calculateSMA(closes: number[], period = 200): number | null {
  if (!closes || closes.length < period) {
    return null;
  }
  const slice = closes.slice(closes.length - period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

/**
 * Calculates SMA at an offset of N candles ago.
 */
export function calculateSMAOffset(closes: number[], offset: number, period = 200): number | null {
  if (!closes || closes.length < period + offset) {
    return null;
  }
  const endIndex = closes.length - offset;
  const slice = closes.slice(endIndex - period, endIndex);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

/**
 * Calculates Wilder's Smoothed RSI over 14 periods.
 * Uses the standard Wilder smoothing technique.
 */
export function calculateRSI(closes: number[], period = 14): number | null {
  if (!closes || closes.length <= period) {
    return null;
  }

  const deltas: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    deltas.push(closes[i] - closes[i - 1]);
  }

  if (deltas.length < period) {
    return null;
  }

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    const delta = deltas[i];
    if (delta > 0) avgGain += delta;
    else avgLoss += Math.abs(delta);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < deltas.length; i++) {
    const delta = deltas[i];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) {
    return 100;
  }
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return Math.min(100, Math.max(0, Number(rsi.toFixed(2))));
}

/**
 * Percentage distance from SMA200: ((Close / SMA200) - 1) * 100
 */
export function calculateDistancePercent(price: number, sma200: number | null): number | null {
  if (sma200 === null || sma200 <= 0 || price <= 0) {
    return null;
  }
  const dist = ((price / sma200) - 1) * 100;
  return Number(dist.toFixed(2));
}

/**
 * SMA200 slope over N candles: ((SMA_now / SMA_prevN) - 1) * 100
 */
export function calculateSlopePercent(smaCurrent: number | null, smaPrevN: number | null): number | null {
  if (smaCurrent === null || smaPrevN === null || smaPrevN <= 0) {
    return null;
  }
  const slope = ((smaCurrent / smaPrevN) - 1) * 100;
  return Number(slope.toFixed(3));
}

/**
 * Classifies slope as ASCENDENTE, DESCENDENTE, or HORIZONTAL based on timeframe threshold.
 */
export function classifySlope(slope: number | null, timeframe: Timeframe): SlopeClassification {
  if (slope === null) return 'DADOS INSUFICIENTES';
  
  const threshold = timeframe === '5m' ? 0.02 : timeframe === '15m' ? 0.04 : timeframe === '60m' ? 0.08 : 0.15;
  if (slope > threshold) return 'ASCENDENTE';
  if (slope < -threshold) return 'DESCENDENTE';
  return 'HORIZONTAL';
}

/**
 * Distance evolution delta: currentDistance - prevDistance
 */
export function calculateDistanceEvolutionDelta(
  currentDist: number | null,
  prevDist: number | null
): number | null {
  if (currentDist === null || prevDist === null) {
    return null;
  }
  return Number((currentDist - prevDist).toFixed(2));
}

/**
 * Classifies RSI value
 */
export function classifyRSI(rsi: number | null): RSIClassification {
  if (rsi === null) return 'DADOS INSUFICIENTES';
  if (rsi > 70) return 'SOBRECOMPRA';
  if (rsi >= 60) return 'COMPRA_ELEVADA';
  if (rsi >= 40) return 'NEUTRO';
  if (rsi >= 30) return 'VENDA_ELEVADA';
  return 'SOBREVENDA';
}

/**
 * Classifies trend state based on Section 8.4 rules:
 * - ALTA FORTE: Preço acima MM200, inclinação positiva e distância positiva estável ou crescente.
 * - ALTA PERDENDO FORÇA: Preço acima MM200, mas distância diminuindo de maneira relevante.
 * - ALTA EM ACELERAÇÃO: Preço acima MM200, inclinação positiva e aumento consistente da distância positiva.
 * - BAIXA FORTE: Preço abaixo MM200, inclinação negativa e distância negativa estável ou aumentando em módulo.
 * - BAIXA PERDENDO FORÇA: Preço abaixo MM200, mas distância negativa diminuindo em módulo.
 * - BAIXA EM ACELERAÇÃO: Preço abaixo MM200, inclinação negativa e aumento consistente da distância negativa em módulo.
 * - NEUTRO: Preço próximo da MM200 ou ausência de direção consistente.
 * - TRANSIÇÃO: Combinação contraditória entre preço, inclinação e mudança de distância.
 * - DADOS INSUFICIENTES: Histórico insuficiente.
 */
export function classifyTrendState(
  price: number | null,
  sma200: number | null,
  distancePercent: number | null,
  slopePercent: number | null,
  distanceDelta: number | null
): TrendState {
  if (price === null || sma200 === null || distancePercent === null || slopePercent === null) {
    return 'DADOS INSUFICIENTES';
  }

  const isNear = Math.abs(distancePercent) < 0.25;
  if (isNear && Math.abs(slopePercent) < 0.05) {
    return 'NEUTRO';
  }

  const isAbove = distancePercent > 0;
  const isBelow = distancePercent < 0;
  const delta = distanceDelta ?? 0;

  if (isAbove) {
    if (slopePercent > 0.02 && delta > 0.40) {
      return 'ALTA EM ACELERAÇÃO';
    }
    if (delta < -0.30) {
      return 'ALTA PERDENDO FORÇA';
    }
    if (slopePercent >= -0.02 && delta >= -0.30) {
      return 'ALTA FORTE';
    }
    return 'TRANSIÇÃO';
  }

  if (isBelow) {
    if (slopePercent < -0.02 && delta < -0.40) {
      return 'BAIXA EM ACELERAÇÃO';
    }
    if (delta > 0.30) {
      return 'BAIXA PERDENDO FORÇA';
    }
    if (slopePercent <= 0.02 && delta <= 0.30) {
      return 'BAIXA FORTE';
    }
    return 'TRANSIÇÃO';
  }

  return 'NEUTRO';
}

/**
 * Farol Strength Score (-100 to +100).
 */
export function calculateFarolStrengthScore(params: {
  price: number | null;
  sma200: number | null;
  distancePercent: number | null;
  slopePercent: number | null;
  distanceDelta: number | null;
  candleReturn: number | null;
  rsi: number | null;
  closesRecent?: number[];
  weights?: ScoreWeights;
}): { score: number | null; coverage: number } {
  const {
    price,
    sma200,
    distancePercent,
    slopePercent,
    distanceDelta,
    candleReturn,
    rsi,
    closesRecent = [],
    weights = DEFAULT_SCORE_WEIGHTS,
  } = params;

  let totalValidWeight = 0;
  let weightedScoreSum = 0;

  // 1. Position vs MM200
  if (distancePercent !== null && price !== null && sma200 !== null) {
    const normalizedPos = Math.max(-100, Math.min(100, distancePercent * 10));
    weightedScoreSum += normalizedPos * weights.mm200Position;
    totalValidWeight += weights.mm200Position;
  }

  // 2. Slope of MM200
  if (slopePercent !== null) {
    const normalizedSlope = Math.max(-100, Math.min(100, slopePercent * 200));
    weightedScoreSum += normalizedSlope * weights.mm200Slope;
    totalValidWeight += weights.mm200Slope;
  }

  // 3. Evolution of distance (Delta)
  if (distanceDelta !== null) {
    const normalizedDelta = Math.max(-100, Math.min(100, distanceDelta * 50));
    weightedScoreSum += normalizedDelta * weights.distanceEvolution;
    totalValidWeight += weights.distanceEvolution;
  }

  // 4. Return normalized
  if (candleReturn !== null) {
    const normalizedReturn = Math.max(-100, Math.min(100, candleReturn * 33.33));
    weightedScoreSum += normalizedReturn * weights.returnNormalized;
    totalValidWeight += weights.returnNormalized;
  }

  // 5. RSI contextual
  if (rsi !== null) {
    let rsiScore = (rsi - 50) * 2;
    if (rsi > 85) rsiScore = 70;
    if (rsi < 15) rsiScore = -70;
    weightedScoreSum += Math.max(-100, Math.min(100, rsiScore)) * weights.rsi;
    totalValidWeight += weights.rsi;
  }

  // 6. Directional consistency
  if (closesRecent.length >= 3) {
    let upMoves = 0;
    for (let i = 1; i < closesRecent.length; i++) {
      if (closesRecent[i] >= closesRecent[i - 1]) upMoves++;
    }
    const ratio = upMoves / (closesRecent.length - 1);
    const dirScore = (ratio - 0.5) * 200;
    weightedScoreSum += dirScore * weights.directionalConsistency;
    totalValidWeight += weights.directionalConsistency;
  }

  if (totalValidWeight < 0.50) {
    return { score: null, coverage: totalValidWeight };
  }

  const finalScore = Math.max(-100, Math.min(100, Math.round(weightedScoreSum / totalValidWeight)));
  return {
    score: finalScore,
    coverage: Number(totalValidWeight.toFixed(2)),
  };
}

/**
 * Multi-period consolidated score (Diário 40%, 60m 30%, 15m 20%, 5m 10%)
 */
export function calculateMultiperiodConsolidatedScore(
  scores: Record<Timeframe, number | null>,
  weights: MultiperiodWeights = DEFAULT_MULTIPERIOD_WEIGHTS
): { score: number | null; alignment: AlignmentState; coverage: number } {
  const periodKeys: { tf: Timeframe; weight: number }[] = [
    { tf: '1d', weight: weights.daily },
    { tf: '60m', weight: weights.h1 },
    { tf: '15m', weight: weights.m15 },
    { tf: '5m', weight: weights.m5 },
  ];

  let validWeightSum = 0;
  let weightedScoreSum = 0;
  let positivePeriods = 0;
  let negativePeriods = 0;
  let validPeriodsCount = 0;

  for (const { tf, weight } of periodKeys) {
    const s = scores[tf];
    if (s !== null) {
      validPeriodsCount++;
      validWeightSum += weight;
      weightedScoreSum += s * weight;
      if (s > 15) positivePeriods++;
      else if (s < -15) negativePeriods++;
    }
  }

  if (validPeriodsCount < 2 || validWeightSum < 0.5) {
    return {
      score: null,
      alignment: 'DADOS INSUFICIENTES',
      coverage: validWeightSum,
    };
  }

  const consolidatedScore = Math.round(weightedScoreSum / validWeightSum);

  const dailyScore = scores['1d'];
  const m5Score = scores['5m'];
  const m15Score = scores['15m'];

  let alignment: AlignmentState = 'CONFLITO MULTIPERÍODO';

  if (positivePeriods >= validPeriodsCount - 1 && consolidatedScore > 20) {
    alignment = 'ALINHAMENTO COMPRADOR';
  } else if (negativePeriods >= validPeriodsCount - 1 && consolidatedScore < -20) {
    alignment = 'ALINHAMENTO VENDEDOR';
  } else if (dailyScore !== null && ((dailyScore > 25 && m5Score !== null && m5Score < -25) || (dailyScore < -25 && m5Score !== null && m5Score > 25))) {
    if ((m15Score !== null && m15Score < -20 && dailyScore > 25) || (m15Score !== null && m15Score > 20 && dailyScore < -25)) {
      alignment = 'REVERSÃO EM OBSERVAÇÃO';
    } else {
      alignment = 'CONFLITO MULTIPERÍODO';
    }
  }

  return {
    score: consolidatedScore,
    alignment,
    coverage: Number(validWeightSum.toFixed(2)),
  };
}

/**
 * Estimated contribution: (weightPercent * returnPercent) / 100
 */
export function calculateEstimatedContribution(
  weightPercent: number,
  returnPercent: number | null
): number | null {
  if (returnPercent === null || isNaN(returnPercent) || weightPercent <= 0) {
    return null;
  }
  const contrib = (weightPercent * returnPercent) / 100;
  return Number(contrib.toFixed(3));
}

/**
 * Evaluates WINFUT confirmation vs the Ibovespa weighted basket
 */
export function evaluateMarketConfirmation(
  winfutChange: number | null,
  basketScore: number | null
): string {
  if (winfutChange === null || basketScore === null) {
    return 'Aguardando dados de mercado para confirmação';
  }

  if (winfutChange > 0.10 && basketScore > 20) {
    return 'WINFUT sobe e cesta fortalece (Confirmação Compradora)';
  }
  if (winfutChange > 0.10 && basketScore < -10) {
    return 'WINFUT sobe e cesta enfraquece (Divergência de Alta)';
  }
  if (winfutChange < -0.10 && basketScore < -20) {
    return 'WINFUT cai e cesta enfraquece (Confirmação Vendedora)';
  }
  if (winfutChange < -0.10 && basketScore > 10) {
    return 'WINFUT cai e cesta fortalece (Divergência de Baixa)';
  }
  return 'Mercado sem alinhamento claro (Lateral / Neutro)';
}
