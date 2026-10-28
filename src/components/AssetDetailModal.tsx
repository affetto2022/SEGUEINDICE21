import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  AssetMetrics,
  Candle,
  MarketSummary,
  Timeframe,
} from '../types';
import {
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';

interface AssetDetailModalProps {
  asset: AssetMetrics | null;
  summary: MarketSummary | null;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  summary,
  onClose,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [candles, setCandles] = useState<Candle[]>([]);
  const [activeTf, setActiveTf] = useState<Timeframe>('1d');
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(false);

  useEffect(() => {
    if (!asset) return;
    let isCancelled = false;

    const fetchCandles = async () => {
      setIsLoadingCandles(true);
      try {
        const res = await fetch(`/api/assets/${asset.ticker}/candles?timeframe=${activeTf}`);
        const data = await res.json();
        if (!isCancelled && data.success) {
          setCandles(data.data);
        }
      } catch (err) {
        console.error('Erro ao buscar candles:', err);
      } finally {
        if (!isCancelled) setIsLoadingCandles(false);
      }
    };

    fetchCandles();
    return () => {
      isCancelled = true;
    };
  }, [asset?.ticker, activeTf]);

  if (!asset) return null;

  const currentInd = asset.indicatorsByTimeframe[activeTf] || asset.indicatorsByTimeframe['1d'];
  const dailyInd = asset.indicatorsByTimeframe['1d'];
  const h1Ind = asset.indicatorsByTimeframe['60m'];
  const m15Ind = asset.indicatorsByTimeframe['15m'];
  const m5Ind = asset.indicatorsByTimeframe['5m'];

  const technicalSummary = useMemo(() => {
    const isAboveMM200 = (dailyInd?.distancePercent ?? 0) >= 0;
    const distText = dailyInd?.distancePercent !== null ? `${dailyInd.distancePercent > 0 ? '+' : ''}${dailyInd.distancePercent.toFixed(2)}%` : 'indisponível';
    const slopeText = dailyInd?.slopeClassification ?? 'indefinida';
    const multiAlignment = asset.multiperiodAlignment;
    const scoreVal = asset.multiperiodScore ?? dailyInd?.score ?? 0;

    const strengthText =
      scoreVal >= 60
        ? 'forte tração compradora'
        : scoreVal >= 20
        ? 'tração compradora moderada'
        : scoreVal <= -60
        ? 'forte pressão vendedora'
        : scoreVal <= -20
        ? 'pressão vendedora moderada'
        : 'indecisão/lateralidade';

    let rsiNote = '';
    if (dailyInd?.rsi14 && dailyInd.rsi14 >= 70) {
      rsiNote = ' O IFR diário acima de 70 aponta zona de sobrecompra.';
    } else if (dailyInd?.rsi14 && dailyInd.rsi14 <= 30) {
      rsiNote = ' O IFR diário abaixo de 30 aponta zona de sobrevenda.';
    }

    let deltaNote = '';
    if (dailyInd?.distanceEvolutionDelta !== null) {
      if (dailyInd.distanceEvolutionDelta > 0.4) {
        deltaNote = ' A distância em relação à média está em aceleração positiva.';
      } else if (dailyInd.distanceEvolutionDelta < -0.4) {
        deltaNote = ' A distância em relação à média apresenta contração relevante.';
      }
    }

    return `O ativo ${asset.ticker} está ${isAboveMM200 ? 'acima' : 'abaixo'} da MM200 diária (${distText}), com inclinação ${slopeText}. No modelo consolidado Farol Traders, apresenta ${strengthText} (Score: ${scoreVal > 0 ? '+' : ''}${scoreVal}), sinalizando estado de ${multiAlignment}.${deltaNote}${rsiNote}`;
  }, [asset, dailyInd]);

  const chartOption = useMemo(() => {
    if (!candles || candles.length === 0) return {};

    const dates = candles.map((c) =>
      new Date(c.timestamp).toLocaleDateString('pt-BR', {
        month: '2-digit',
        day: '2-digit',
        hour: activeTf !== '1d' ? '2-digit' : undefined,
        minute: activeTf !== '1d' ? '2-digit' : undefined,
      })
    );

    const values = candles.map((c) => [c.open, c.close, c.low, c.high]);

    const sma200Values: (number | string)[] = [];
    const closes = candles.map((c) => c.close);
    for (let i = 0; i < closes.length; i++) {
      if (i < 199) {
        sma200Values.push('-');
      } else {
        const slice = closes.slice(i - 199, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        sma200Values.push(Number((sum / 200).toFixed(2)));
      }
    }

    return {
      backgroundColor: 'transparent',
      animation: false,
      legend: {
        data: ['Candlesticks', 'MM200'],
        textStyle: { color: isLight ? '#334155' : '#CBD5E1', fontSize: 11 },
        top: 0,
      },
      grid: { left: 55, right: 25, top: 35, bottom: 45 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: isLight ? '#FFFFFF' : '#0B132B',
        borderColor: '#F59E0B',
        textStyle: { color: isLight ? '#1E293B' : '#F8FAFC' },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: isLight ? '#CBD5E1' : '#334155' } },
        axisLabel: { color: isLight ? '#64748B' : '#94A3B8', fontSize: 10 },
      },
      yAxis: {
        scale: true,
        axisLine: { lineStyle: { color: isLight ? '#CBD5E1' : '#334155' } },
        splitLine: { lineStyle: { color: isLight ? '#E2E8F0' : '#1E293B', type: 'dashed' } },
        axisLabel: { color: isLight ? '#64748B' : '#94A3B8' },
      },
      series: [
        {
          name: 'Candlesticks',
          type: 'candlestick',
          data: values,
          itemStyle: {
            color: '#10B981',
            color0: '#F43F5E',
            borderColor: '#059669',
            borderColor0: '#E11D48',
          },
        },
        {
          name: 'MM200',
          type: 'line',
          data: sma200Values,
          smooth: true,
          lineStyle: { color: '#F59E0B', width: 2.2 },
          itemStyle: { color: '#F59E0B' },
          symbol: 'none',
        },
      ],
    };
  }, [candles, activeTf, isLight]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`border rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-950 border-amber-500/30 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0B132B] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-extrabold font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  {asset.ticker}
                </h2>
                <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {asset.name}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  Peso no Ibov: {asset.weight.toFixed(2)}%
                </span>
              </div>
              <p className={`text-xs flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Preço: R$ {asset.currentPrice?.toFixed(2) ?? '—'}</span>
                <span>•</span>
                <span className={(asset.dailyReturn ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  Retorno Dia: {(asset.dailyReturn ?? 0) >= 0 ? '+' : ''}{asset.dailyReturn?.toFixed(2)}%
                </span>
                <span>•</span>
                <span>Contribuição Estimada: {asset.estimatedContribution !== null ? `${asset.estimatedContribution > 0 ? '+' : ''}${asset.estimatedContribution.toFixed(3)} pts` : '—'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Rigorous Technical Summary Card */}
          <div
            className={`p-3.5 border rounded-xl flex items-start gap-3 ${
              isLight
                ? 'bg-amber-50/60 border-amber-300 text-slate-800'
                : 'bg-gradient-to-r from-slate-900 to-[#0F1C3F] border-amber-500/20 text-slate-200'
            }`}
          >
            <Zap className={`w-5 h-5 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                Diagnóstico Quantitativo Farol Traders
              </h4>
              <p className="text-xs leading-relaxed font-medium">
                {technicalSummary}
              </p>
            </div>
          </div>

          {/* Timeframe Selector & Chart */}
          <div
            className={`border rounded-xl p-4 transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Periodicidade dos Candles:
                </span>
                <div className={`flex border rounded-lg p-0.5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  {(['5m', '15m', '60m', '1d'] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setActiveTf(tf)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        activeTf === tf
                          ? 'bg-amber-500 text-slate-950'
                          : isLight
                          ? 'text-slate-600 hover:text-amber-700'
                          : 'text-slate-300 hover:text-amber-400'
                      }`}
                    >
                      {tf === '1d' ? 'Diário' : tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>MM200: </span>
                  <span className={`font-mono font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                    {currentInd?.sma200 ? `R$ ${currentInd.sma200.toFixed(2)}` : 'Histórico Insuf.'}
                  </span>
                </div>
                <div>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Dist: </span>
                  <span className={`font-mono font-bold ${(currentInd?.distancePercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentInd?.distancePercent !== null ? `${currentInd.distancePercent > 0 ? '+' : ''}${currentInd.distancePercent.toFixed(2)}%` : '—'}
                  </span>
                </div>
                <div>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>IFR 14: </span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {currentInd?.rsi14 ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full h-[320px]">
              {isLoadingCandles ? (
                <div className={`h-full flex items-center justify-center text-xs animate-pulse ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Carregando série de candles e MM200...
                </div>
              ) : (
                <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} notMerge={true} />
              )}
            </div>
          </div>

          {/* 4 Timeframes Side-by-Side Comparison */}
          <div>
            <h4 className={`text-xs uppercase font-bold tracking-wider mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Força Técnica nas 4 Periodicidades
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { title: 'Diário (40% Peso)', ind: dailyInd, tf: '1d' },
                { title: '60 Minutos (30% Peso)', ind: h1Ind, tf: '60m' },
                { title: '15 Minutos (20% Peso)', ind: m15Ind, tf: '15m' },
                { title: '5 Minutos (10% Peso)', ind: m5Ind, tf: '5m' },
              ].map(({ title, ind }) => {
                const s = ind?.score ?? 0;
                return (
                  <div
                    key={title}
                    className={`border rounded-xl p-3 flex flex-col justify-between transition-colors ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {title}
                    </span>
                    <div className="my-2 flex items-baseline justify-between">
                      <span
                        className={`text-lg font-black font-mono px-2 py-0.5 rounded ${
                          s >= 20
                            ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'
                            : s <= -20
                            ? isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-400'
                            : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {s > 0 ? `+${s}` : s}
                      </span>
                      <span className={`text-[10px] uppercase font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {ind?.trendState || '—'}
                      </span>
                    </div>
                    <div className={`text-[10px] flex justify-between border-t pt-1.5 ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-400'}`}>
                      <span>Dist: {ind?.distancePercent !== null ? `${ind.distancePercent > 0 ? '+' : ''}${ind.distancePercent.toFixed(1)}%` : '—'}</span>
                      <span>IFR: {ind?.rsi14 ?? '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Index and Future Comparison Details */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border rounded-xl p-3.5 transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div>
              <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Comparação com IBOVESPA:</span>
              <p className={`mt-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Variação do Ativo: <b className={(asset.dailyReturn ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{asset.dailyReturn}%</b> vs IBOV: <b>{summary?.ibov.changePercent}%</b>
                <span className={`block text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {(asset.dailyReturn ?? 0) > (summary?.ibov.changePercent ?? 0)
                    ? 'O ativo está com força relativa superior ao Ibovespa.'
                    : 'O ativo está performando abaixo da média do índice à vista.'}
                </span>
              </p>
            </div>
            <div>
              <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Contribuição Estimada para o Índice:</span>
              <p className={`mt-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Impacto no dia: <b className={(asset.estimatedContribution ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{asset.estimatedContribution} pontos percentuais</b>
                <span className={`block text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cálculo aproximado: Peso ({asset.weight.toFixed(2)}%) × Retorno ({asset.dailyReturn}%) / 100.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
