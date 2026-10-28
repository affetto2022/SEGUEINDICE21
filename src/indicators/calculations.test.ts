import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSMA,
  calculateSMAOffset,
  calculateRSI,
  calculateDistancePercent,
  calculateSlopePercent,
  classifySlope,
  calculateDistanceEvolutionDelta,
  classifyRSI,
  classifyTrendState,
  calculateFarolStrengthScore,
  calculateMultiperiodConsolidatedScore,
  calculateEstimatedContribution,
  evaluateMarketConfirmation,
} from './calculations';

test('1. SMA200 calculation: requires at least 200 candles', () => {
  const shortSeries = Array.from({ length: 199 }, (_, i) => 10 + i * 0.1);
  assert.equal(calculateSMA(shortSeries, 200), null);

  const constantSeries = Array.from({ length: 200 }, () => 50);
  assert.equal(calculateSMA(constantSeries, 200), 50);

  const series205 = [...Array.from({ length: 5 }, () => 100), ...Array.from({ length: 200 }, () => 30)];
  assert.equal(calculateSMA(series205, 200), 30);
});

test('2. SMA offset calculation: checks N candles ago', () => {
  const series = Array.from({ length: 210 }, (_, i) => i + 1);
  const currentSma = calculateSMA(series, 200);
  const offset5Sma = calculateSMAOffset(series, 5, 200);
  assert.ok(currentSma !== null);
  assert.ok(offset5Sma !== null);
  assert.ok(currentSma > offset5Sma);
});

test('3. RSI 14 calculation: Wilder smoothed implementation', () => {
  assert.equal(calculateRSI([10, 11, 12], 14), null);

  const allGains = Array.from({ length: 30 }, (_, i) => 10 + i * 2);
  assert.equal(calculateRSI(allGains, 14), 100);

  const alternating: number[] = [50];
  for (let i = 1; i <= 40; i++) {
    alternating.push(i % 2 === 0 ? 52 : 48);
  }
  const rsi = calculateRSI(alternating, 14);
  assert.ok(rsi !== null);
  assert.ok(rsi >= 40 && rsi <= 60);
});

test('4. RSI classification', () => {
  assert.equal(classifyRSI(75), 'SOBRECOMPRA');
  assert.equal(classifyRSI(65), 'COMPRA_ELEVADA');
  assert.equal(classifyRSI(50), 'NEUTRO');
  assert.equal(classifyRSI(35), 'VENDA_ELEVADA');
  assert.equal(classifyRSI(25), 'SOBREVENDA');
  assert.equal(classifyRSI(null), 'DADOS INSUFICIENTES');
});

test('5. Distance percent calculation from SMA200', () => {
  assert.equal(calculateDistancePercent(110, 100), 10);
  assert.equal(calculateDistancePercent(90, 100), -10);
  assert.equal(calculateDistancePercent(90, null), null);
});

test('6. Slope percent and classification', () => {
  assert.equal(calculateSlopePercent(102, 100), 2.0);
  assert.equal(calculateSlopePercent(98, 100), -2.0);
  assert.equal(classifySlope(0.10, '5m'), 'ASCENDENTE');
  assert.equal(classifySlope(-0.10, '5m'), 'DESCENDENTE');
  assert.equal(classifySlope(0.01, '5m'), 'HORIZONTAL');
});

test('7. Distance evolution delta', () => {
  assert.equal(calculateDistanceEvolutionDelta(5.0, 2.0), 3.0);
  assert.equal(calculateDistanceEvolutionDelta(-4.0, -2.0), -2.0);
  assert.equal(calculateDistanceEvolutionDelta(null, 2.0), null);
});

test('8. Trend classification states', () => {
  assert.equal(classifyTrendState(35, 30, 16.67, 0.05, 0.10), 'ALTA FORTE');
  assert.equal(classifyTrendState(35, 30, 16.67, 0.05, 0.80), 'ALTA EM ACELERAÇÃO');
  assert.equal(classifyTrendState(35, 30, 16.67, 0.01, -0.60), 'ALTA PERDENDO FORÇA');
  assert.equal(classifyTrendState(25, 30, -16.67, -0.05, -0.10), 'BAIXA FORTE');
  assert.equal(classifyTrendState(25, 30, -16.67, -0.05, -0.80), 'BAIXA EM ACELERAÇÃO');
  assert.equal(classifyTrendState(25, 30, -16.67, -0.01, 0.60), 'BAIXA PERDENDO FORÇA');
  assert.equal(classifyTrendState(30.05, 30, 0.16, 0.01, 0.0), 'NEUTRO');
  assert.equal(classifyTrendState(30, null, null, null, null), 'DADOS INSUFICIENTES');
});

test('9. Farol Strength Score (-100 to +100)', () => {
  const bullish = calculateFarolStrengthScore({
    price: 45,
    sma200: 40,
    distancePercent: 12.5,
    slopePercent: 0.35,
    distanceDelta: 0.8,
    candleReturn: 2.5,
    rsi: 68,
    closesRecent: [42, 42.5, 43.5, 44, 45],
  });
  assert.ok(bullish.score !== null);
  assert.ok(bullish.score >= 60 && bullish.score <= 100);
  assert.ok(bullish.coverage >= 0.8);

  const bearish = calculateFarolStrengthScore({
    price: 32,
    sma200: 40,
    distancePercent: -20,
    slopePercent: -0.40,
    distanceDelta: -1.2,
    candleReturn: -3.0,
    rsi: 28,
    closesRecent: [36, 35, 34, 33, 32],
  });
  assert.ok(bearish.score !== null);
  assert.ok(bearish.score <= -60 && bearish.score >= -100);

  const insufficient = calculateFarolStrengthScore({
    price: 40,
    sma200: null,
    distancePercent: null,
    slopePercent: null,
    distanceDelta: null,
    candleReturn: 0.5,
    rsi: null,
  });
  assert.equal(insufficient.score, null);
});

test('10. Multi-period consolidated score and alignment', () => {
  const bullishMulti = calculateMultiperiodConsolidatedScore({
    '1d': 80,
    '60m': 75,
    '15m': 65,
    '5m': 70,
  });
  assert.ok(bullishMulti.score !== null && bullishMulti.score > 60);
  assert.equal(bullishMulti.alignment, 'ALINHAMENTO COMPRADOR');

  const conflict = calculateMultiperiodConsolidatedScore({
    '1d': 70,
    '60m': 50,
    '15m': -35,
    '5m': -45,
  });
  assert.ok(conflict.score !== null);
  assert.ok(
    conflict.alignment === 'CONFLITO MULTIPERÍODO' ||
    conflict.alignment === 'REVERSÃO EM OBSERVAÇÃO'
  );
});

test('11. Estimated index contribution calculation', () => {
  assert.equal(calculateEstimatedContribution(10, 2), 0.20);
  assert.equal(calculateEstimatedContribution(12.5, -1.4), -0.175);
  assert.equal(calculateEstimatedContribution(10, null), null);
});

test('12. Market confirmation status evaluation', () => {
  assert.match(
    evaluateMarketConfirmation(0.85, 45),
    /WINFUT sobe e cesta fortalece/
  );
  assert.match(
    evaluateMarketConfirmation(0.55, -25),
    /WINFUT sobe e cesta enfraquece/
  );
  assert.match(
    evaluateMarketConfirmation(-0.90, -40),
    /WINFUT cai e cesta enfraquece/
  );
});
