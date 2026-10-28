import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Calendar,
  Zap,
  BarChart2,
  Maximize2,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import * as echarts from 'echarts';
import { Candle, Timeframe } from '../types';

interface IndexDetails {
  symbol: 'IBOV' | 'WINFUT';
  name: string;
  tickerYahoo: string;
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  basis?: number;
  contract?: string;
  maturity?: string;
  timestamp: string;
  source: string;
  indicatorsByTimeframe: Record<
    Timeframe,
    {
      sma200: number | null;
      distancePercent: number | null;
      slopePercent: number | null;
      rsi14: number | null;
      trendState: string;
      score: number;
    }
  >;
}

interface MarketIndexModalProps {
  symbol: 'IBOV' | 'WINFUT';
  theme?: 'dark' | 'light';
  onClose: () => void;
}

export const MarketIndexModal: React.FC<MarketIndexModalProps> = ({
  symbol,
  theme = 'dark',
  onClose,
}) => {
  const isLight = theme === 'light';
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1d');
  const [details, setDetails] = useState<IndexDetails | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch index details and candles
  const fetchIndexData = async (tf: Timeframe = selectedTimeframe) => {
    try {
      setIsRefreshing(true);
      setError(null);

      const [detailsRes, candlesRes] = await Promise.all([
        fetch(`/api/market/index/${symbol}`),
        fetch(`/api/market/index/${symbol}/candles?timeframe=${tf}`),
      ]);

      if (!detailsRes.ok || !candlesRes.ok) {
        throw new Error('Falha ao comunicar com os servidores de cotação.');
      }

      const detailsData = await detailsRes.json();
      const candlesData = await candlesRes.json();

      if (detailsData.success) {
        setDetails(detailsData.data);
      }
      if (candlesData.success) {
        setCandles(candlesData.data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro ao carregar dados do Yahoo Finance: ${msg}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchIndexData(selectedTimeframe);
  }, [symbol, selectedTimeframe]);

  // Render ECharts Candlestick + MM200 + RSI chart
  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartContainerRef.current, isLight ? undefined : 'dark', {
        renderer: 'canvas',
      });
    }

    const chart = chartInstanceRef.current;

    // Prepare candlestick series: [open, close, lowest, highest]
    const dates = candles.map((c) => {
      const d = new Date(c.timestamp);
      if (selectedTimeframe === '1d') {
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      }
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    });

    const ohlcData = candles.map((c) => [c.open, c.close, c.low, c.high]);
    const volumes = candles.map((c, i) => [i, c.volume, c.close >= c.open ? 1 : -1]);

    // Calculate SMA200 on these candles for visual overlay
    const sma200Values: (number | null)[] = [];
    const period = Math.min(200, Math.max(20, Math.floor(candles.length / 2)));
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        sma200Values.push(null);
      } else {
        const slice = candles.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
        sma200Values.push(Number((sum / period).toFixed(2)));
      }
    }

    // Calculate RSI 14
    const rsiValues: (number | null)[] = [];
    const rsiPeriod = 14;
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        rsiValues.push(null);
        continue;
      }
      const change = candles[i].close - candles[i - 1].close;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      if (i < rsiPeriod) {
        avgGain += gain;
        avgLoss += loss;
        rsiValues.push(null);
      } else if (i === rsiPeriod) {
        avgGain = avgGain / rsiPeriod;
        avgLoss = avgLoss / rsiPeriod;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        rsiValues.push(Number(rsi.toFixed(1)));
      } else {
        avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
        avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        rsiValues.push(Number(rsi.toFixed(1)));
      }
    }

    const upColor = '#10b981'; // emerald-500
    const downColor = '#ef4444'; // rose-500
    const mmColor = '#f59e0b'; // amber-500
    const gridColor = isLight ? '#e2e8f0' : '#1e293b';
    const textColor = isLight ? '#475569' : '#94a3b8';

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        borderColor: isLight ? '#cbd5e1' : '#334155',
        textStyle: { color: isLight ? '#0f172a' : '#f8fafc', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const candleParam = params.find((p) => p.seriesName === 'Candles');
          const smaParam = params.find((p) => p.seriesName === 'MM200');
          const rsiParam = params.find((p) => p.seriesName === 'RSI 14');
          const volParam = params.find((p) => p.seriesName === 'Volume');

          let res = `<div style="font-weight: bold; margin-bottom: 4px;">${params[0].axisValue}</div>`;
          if (candleParam && candleParam.data) {
            const [o, c, l, h] = candleParam.data.slice(1);
            const isUp = c >= o;
            res += `
              <div style="display: grid; grid-template-columns: auto auto; gap: 4px; font-family: monospace;">
                <span>Abertura:</span> <b>${o?.toLocaleString('pt-BR')}</b>
                <span>Máxima:</span> <b>${h?.toLocaleString('pt-BR')}</b>
                <span>Mínima:</span> <b>${l?.toLocaleString('pt-BR')}</b>
                <span>Fechamento:</span> <b style="color: ${isUp ? upColor : downColor};">${c?.toLocaleString('pt-BR')}</b>
              </div>
            `;
          }
          if (smaParam && smaParam.data !== null && smaParam.data !== undefined) {
            res += `<div style="margin-top: 4px; color: ${mmColor}; font-family: monospace;">MM200: <b>${Number(smaParam.data).toLocaleString('pt-BR')}</b></div>`;
          }
          if (rsiParam && rsiParam.data !== null && rsiParam.data !== undefined) {
            res += `<div style="margin-top: 2px; color: #38bdf8; font-family: monospace;">RSI (14): <b>${rsiParam.data}</b></div>`;
          }
          if (volParam && volParam.data) {
            const v = volParam.data[1];
            res += `<div style="margin-top: 2px; color: #94a3b8; font-family: monospace;">Vol: <b>${Number(v).toLocaleString('pt-BR')}</b></div>`;
          }
          return res;
        },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
        label: { backgroundColor: '#334155' },
      },
      grid: [
        { left: 60, right: 30, top: 20, height: '52%' }, // Main candle chart
        { left: 60, right: 30, top: '74%', height: '18%' }, // RSI chart
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          gridIndex: 0,
          scale: true,
          boundaryGap: true,
          axisLine: { lineStyle: { color: gridColor } },
          axisLabel: { color: textColor, fontSize: 11 },
          splitLine: { show: false },
        },
        {
          type: 'category',
          data: dates,
          gridIndex: 1,
          scale: true,
          boundaryGap: true,
          axisLine: { lineStyle: { color: gridColor } },
          axisLabel: { color: textColor, fontSize: 11 },
          splitLine: { show: false },
        },
      ],
      yAxis: [
        {
          scale: true,
          gridIndex: 0,
          splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
          axisLabel: {
            color: textColor,
            fontSize: 11,
            formatter: (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
          },
        },
        {
          scale: false,
          gridIndex: 1,
          min: 0,
          max: 100,
          interval: 25,
          splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
          axisLabel: { color: textColor, fontSize: 10 },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: Math.max(0, 100 - (candles.length > 60 ? 50 : 100)),
          end: 100,
        },
      ],
      series: [
        {
          name: 'Candles',
          type: 'candlestick',
          data: ohlcData,
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: upColor,
            borderColor0: downColor,
          },
        },
        {
          name: 'MM200',
          type: 'line',
          data: sma200Values,
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: mmColor, width: 2.2 },
        },
        {
          name: 'RSI 14',
          type: 'line',
          data: rsiValues,
          xAxisIndex: 1,
          yAxisIndex: 1,
          showSymbol: false,
          lineStyle: { color: '#38bdf8', width: 1.8 },
          markLine: {
            symbol: 'none',
            data: [
              { yAxis: 70, lineStyle: { color: '#f43f5e', type: 'dashed' } },
              { yAxis: 30, lineStyle: { color: '#10b981', type: 'dashed' } },
              { yAxis: 50, lineStyle: { color: '#64748b', type: 'dotted' } },
            ],
          },
        },
      ],
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [candles, selectedTimeframe, isLight]);

  const activeInd = details?.indicatorsByTimeframe?.[selectedTimeframe];
  const isPositive = (details?.changePercent ?? 0) >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-5xl max-h-[95vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800 shadow-slate-900/20'
            : 'bg-slate-950 border-amber-500/30 text-slate-100 shadow-black/80'
        }`}
      >
        {/* Header Modal */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-gradient-to-r from-slate-900 via-[#0B1530] to-slate-900 border-amber-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border shadow-md ${
                symbol === 'IBOV'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                  : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
              }`}
            >
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">
                  {symbol === 'IBOV' ? 'IBOVESPA À VISTA' : 'MINI ÍNDICE FUTURO (WINFUT)'}
                </h2>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    isLight
                      ? 'bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {symbol === 'IBOV' ? '^BVSP' : details?.contract || 'WINZ26'}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Yahoo Finance Live
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {symbol === 'IBOV'
                  ? 'Índice de referência da B3 • Média ponderada das principais ações negociadas no Brasil'
                  : `Contrato Futuro BMF • Vencimento: ${details?.maturity || '16/12/2026'} • Spread de Carregamento DI`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchIndexData(selectedTimeframe)}
              disabled={isRefreshing}
              title="Atualizar cotações do Yahoo Finance"
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isLight
                  ? 'hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isLight
                  ? 'hover:bg-rose-100 hover:text-rose-700 text-slate-600 border-slate-300'
                  : 'hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Top Metric Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Price */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cotação Atual</span>
              <div className="font-mono text-xl font-black">
                {details?.currentPrice ? details.currentPrice.toLocaleString('pt-BR') : '—'}
              </div>
              <div
                className={`text-xs font-bold font-mono flex items-center gap-1 ${
                  isPositive ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isPositive ? '+' : ''}
                {details?.changePercent ? details.changePercent.toFixed(2) : '0.00'}%
              </div>
            </div>

            {/* MM200 Level */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>MM200 Período</span>
                <span className="text-[10px] font-mono text-amber-500 font-bold">Média</span>
              </div>
              <div className="font-mono text-lg font-bold text-amber-500">
                {activeInd?.sma200 ? activeInd.sma200.toLocaleString('pt-BR') : '—'}
              </div>
              <div className="text-[11px] font-mono">
                Distância:{' '}
                <span
                  className={`font-bold ${
                    (activeInd?.distancePercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {(activeInd?.distancePercent ?? 0) >= 0 ? '+' : ''}
                  {activeInd?.distancePercent ? activeInd.distancePercent.toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>

            {/* Slope MM200 */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Inclinação MM200</span>
              <div className="font-mono text-base font-bold">
                {activeInd?.slopePercent !== null && activeInd?.slopePercent !== undefined
                  ? `${activeInd.slopePercent >= 0 ? '+' : ''}${activeInd.slopePercent.toFixed(3)}%`
                  : '—'}
              </div>
              <span className="text-[11px] text-slate-400 truncate">
                {(activeInd?.slopePercent ?? 0) > 0.05
                  ? 'Ascendente (Alta)'
                  : (activeInd?.slopePercent ?? 0) < -0.05
                  ? 'Descendente (Baixa)'
                  : 'Lateralizada'}
              </span>
            </div>

            {/* RSI 14 */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>IFR (RSI 14)</span>
              <div className="font-mono text-lg font-bold text-cyan-400">
                {activeInd?.rsi14 ? activeInd.rsi14.toFixed(1) : '—'}
              </div>
              <span className="text-[11px] text-slate-400">
                {(activeInd?.rsi14 ?? 50) >= 70
                  ? 'Sobrecomprado (>70)'
                  : (activeInd?.rsi14 ?? 50) <= 30
                  ? 'Sobrevendido (<30)'
                  : 'Zona Neutra'}
              </span>
            </div>

            {/* Basis or Previous Close */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {symbol === 'WINFUT' ? 'Base vs Spot' : 'Fechamento Anterior'}
              </span>
              <div className="font-mono text-base font-bold text-slate-300">
                {symbol === 'WINFUT'
                  ? `${(details?.basis ?? 0) >= 0 ? '+' : ''}${details?.basis?.toLocaleString('pt-BR')} pts`
                  : details?.previousClose ? details.previousClose.toLocaleString('pt-BR') : '—'}
              </div>
              <span className="text-[10px] text-slate-400">
                {symbol === 'WINFUT' ? 'Carry spread DI' : 'Referência oficial'}
              </span>
            </div>

            {/* Farol Score */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Farol Score Ativo</span>
              <div
                className={`font-mono text-lg font-black ${
                  (activeInd?.score ?? 0) > 20
                    ? 'text-emerald-500'
                    : (activeInd?.score ?? 0) < -20
                    ? 'text-rose-500'
                    : 'text-amber-500'
                }`}
              >
                {(activeInd?.score ?? 0) > 0 ? `+${activeInd?.score}` : activeInd?.score ?? 0}
              </div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 truncate">
                {activeInd?.trendState || 'Calculando'}
              </span>
            </div>
          </div>

          {/* Timeframe selector & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-slate-900/60 border-slate-800">
              {(['5m', '15m', '60m', '1d'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTimeframe === tf
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-200'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {tf === '1d' ? 'Diário (1D)' : tf.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                MM200 (Média Móvel 200)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                IFR 14 (RSI)
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Dados Verificados Yahoo Finance
              </span>
            </div>
          </div>

          {/* Chart Display Area */}
          <div
            className={`border rounded-xl p-3 relative min-h-[460px] ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800'
            }`}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-xs font-semibold text-slate-400">
                  Carregando candles históricos e indicadores do Yahoo Finance...
                </span>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center">
                <div className="text-rose-500 font-bold text-sm">{error}</div>
                <button
                  onClick={() => fetchIndexData(selectedTimeframe)}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : (
              <div ref={chartContainerRef} className="w-full h-[460px]" />
            )}
          </div>

          {/* Technical Alignment Advice */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isLight
                ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                : 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border-amber-500/30 text-slate-200'
            }`}
          >
            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold uppercase tracking-wider text-amber-400">
                Diagnóstico Técnico Farol Traders ({selectedTimeframe.toUpperCase()}):
              </div>
              <p>
                {symbol === 'IBOV' ? 'O IBOVESPA à vista' : 'O WINFUT Futuro'} está operando{' '}
                <b>
                  {(activeInd?.distancePercent ?? 0) >= 0 ? 'ACIMA' : 'ABAIXO'} da Média Móvel de 200 períodos
                </b>{' '}
                ({activeInd?.distancePercent ? `${Math.abs(activeInd.distancePercent).toFixed(2)}%` : '0%'} de afastamento). A
                inclinação da média está{' '}
                <b>
                  {(activeInd?.slopePercent ?? 0) > 0.05
                    ? 'positiva (compradora)'
                    : (activeInd?.slopePercent ?? 0) < -0.05
                    ? 'negativa (vendedora)'
                    : 'neutra/lateral'}
                </b>
                , com IFR 14 em <b>{activeInd?.rsi14 ? activeInd.rsi14.toFixed(1) : '50.0'}</b>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div>
            Fonte de dados:{' '}
            <span className="font-mono font-medium text-amber-400">
              {details?.source || 'Yahoo Finance v8 Chart API'}
            </span>{' '}
            • Fuso: America/Sao_Paulo (BRT)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all cursor-pointer shadow-md"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
