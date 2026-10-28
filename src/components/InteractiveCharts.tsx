import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  AssetMetrics,
  MarketSummary,
  StrengthHistoryPoint,
  Timeframe,
} from '../types';
import {
  Layers,
  ScatterChart,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
} from 'lucide-react';

interface InteractiveChartsProps {
  assets: AssetMetrics[];
  summary: MarketSummary | null;
  history: StrengthHistoryPoint[];
  selectedTimeframe: Timeframe | 'multi';
  onSelectAsset: (ticker: string) => void;
  theme?: 'dark' | 'light';
}

type ColorByOption = 'score' | 'dailyReturn' | 'distance' | 'contribution';

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  assets,
  summary,
  history,
  selectedTimeframe,
  onSelectAsset,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<
    'heatmap' | 'scatter' | 'contributions' | 'comparative' | 'distribution' | 'history'
  >('heatmap');

  const [colorBy, setColorBy] = useState<ColorByOption>('score');
  const [distributionMode, setDistributionMode] = useState<'count' | 'weighted'>('weighted');

  const tfKey: Timeframe = selectedTimeframe === 'multi' ? '1d' : selectedTimeframe;

  // Chart theme colors
  const textMuted = isLight ? '#64748B' : '#94A3B8';
  const textPrimary = isLight ? '#1E293B' : '#F8FAFC';
  const axisLineColor = isLight ? '#CBD5E1' : '#334155';
  const splitLineColor = isLight ? '#E2E8F0' : '#1E293B';
  const tooltipBg = isLight ? '#FFFFFF' : '#0B132B';
  const tooltipBorder = '#F59E0B';

  // 1. Data for Heatmap / Treemap
  const treemapOption = useMemo(() => {
    const data = assets.map((a) => {
      const ind = a.indicatorsByTimeframe[tfKey] || a.indicatorsByTimeframe['1d'];
      let val = 0;
      let labelVal = '';

      if (colorBy === 'score') {
        val = selectedTimeframe === 'multi' ? (a.multiperiodScore ?? 0) : (ind?.score ?? 0);
        labelVal = `Score: ${val > 0 ? '+' : ''}${val}`;
      } else if (colorBy === 'dailyReturn') {
        val = a.dailyReturn ?? 0;
        labelVal = `Ret: ${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
      } else if (colorBy === 'distance') {
        val = ind?.distancePercent ?? 0;
        labelVal = `Dist: ${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
      } else if (colorBy === 'contribution') {
        val = (a.estimatedContribution ?? 0) * 100;
        labelVal = `Contrib: ${(a.estimatedContribution ?? 0) > 0 ? '+' : ''}${(a.estimatedContribution ?? 0).toFixed(3)} pts`;
      }

      return {
        name: `${a.ticker}\n${labelVal}`,
        ticker: a.ticker,
        value: Math.max(0.2, a.weight),
        metricValue: val,
        itemStyle: {
          color:
            val >= 60
              ? '#059669'
              : val >= 20
              ? '#10B981'
              : val >= 5
              ? '#34D399'
              : val <= -60
              ? '#E11D48'
              : val <= -20
              ? '#F43F5E'
              : val <= -5
              ? '#FB7185'
              : isLight
              ? '#94A3B8'
              : '#334155',
          borderColor: isLight ? '#FFFFFF' : '#0F172A',
          borderWidth: 1.5,
        },
      };
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const item = params.data;
          const a = assets.find((x) => x.ticker === item?.ticker);
          if (!a) return item?.name;
          return `
            <div style="font-family: Inter, sans-serif; padding: 6px; font-size: 12px; color: ${textPrimary};">
              <strong style="color: #F59E0B; font-size: 14px;">${a.ticker}</strong> — ${a.name}<br/>
              <b>Peso na Carteira:</b> ${a.weight.toFixed(2)}%<br/>
              <b>Preço Atual:</b> R$ ${a.currentPrice?.toFixed(2) ?? '—'}<br/>
              <b>Retorno Diário:</b> ${a.dailyReturn !== null ? `${a.dailyReturn > 0 ? '+' : ''}${a.dailyReturn.toFixed(2)}%` : '—'}<br/>
              <b>Farol Score:</b> ${item.metricValue > 0 ? '+' : ''}${item.metricValue}<br/>
              <b>Contribuição Estimada:</b> ${a.estimatedContribution !== null ? `${a.estimatedContribution > 0 ? '+' : ''}${a.estimatedContribution.toFixed(3)} pts` : '—'}
            </div>
          `;
        },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
      },
      series: [
        {
          type: 'treemap',
          data,
          leafDepth: 1,
          roam: false,
          label: {
            show: true,
            formatter: '{b}',
            fontSize: 11,
            color: '#FFFFFF',
            fontWeight: 'bold',
          },
          breadcrumb: { show: false },
        },
      ],
    };
  }, [assets, tfKey, selectedTimeframe, colorBy, isLight, textPrimary, tooltipBg, tooltipBorder]);

  // 2. Data for Scatter Plot (Weight vs Farol Strength Score)
  const scatterOption = useMemo(() => {
    const points = assets.map((a) => {
      const ind = a.indicatorsByTimeframe[tfKey] || a.indicatorsByTimeframe['1d'];
      const scoreVal = selectedTimeframe === 'multi' ? (a.multiperiodScore ?? 0) : (ind?.score ?? 0);
      return [
        a.weight,
        scoreVal,
        a.ticker,
        a.name,
        a.currentPrice,
        a.dailyReturn,
        a.estimatedContribution,
      ];
    });

    return {
      backgroundColor: 'transparent',
      grid: { left: 45, right: 30, top: 35, bottom: 45 },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const [weight, score, ticker, name, price, ret, contrib] = params.data;
          return `
            <div style="font-family: Inter, sans-serif; padding: 6px; font-size: 12px; color: ${textPrimary};">
              <b style="color: #F59E0B; font-size: 14px;">${ticker}</b> (${name})<br/>
              <b>Peso no Índice:</b> ${weight.toFixed(2)}%<br/>
              <b>Farol Score:</b> ${score > 0 ? '+' : ''}${score}<br/>
              <b>Preço:</b> R$ ${price?.toFixed(2) ?? '—'}<br/>
              <b>Retorno:</b> ${ret !== null ? `${ret > 0 ? '+' : ''}${ret.toFixed(2)}%` : '—'}<br/>
              <b>Contribuição Estimada:</b> ${contrib !== null ? `${contrib > 0 ? '+' : ''}${contrib.toFixed(3)} pts` : '—'}<br/>
              <span style="color: #F59E0B; font-size: 10px;">(Clique para abrir detalhes do ativo)</span>
            </div>
          `;
        },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
      },
      xAxis: {
        name: 'Peso (%)',
        nameLocation: 'middle',
        nameGap: 26,
        nameTextStyle: { color: textMuted, fontSize: 11 },
        type: 'value',
        axisLine: { lineStyle: { color: axisLineColor } },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLabel: { color: textMuted, formatter: '{value}%' },
      },
      yAxis: {
        name: 'Farol Strength Score (-100 a +100)',
        nameTextStyle: { color: textMuted, fontSize: 11 },
        type: 'value',
        min: -100,
        max: 100,
        axisLine: { lineStyle: { color: axisLineColor } },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLabel: { color: textMuted },
      },
      series: [
        {
          type: 'scatter',
          data: points,
          symbolSize: (dataItem: any) => {
            const weight = dataItem[0];
            return Math.max(14, Math.min(48, weight * 3.4));
          },
          itemStyle: {
            color: (params: any) => {
              const score = params.data[1];
              return score >= 20 ? '#10B981' : score <= -20 ? '#F43F5E' : isLight ? '#94A3B8' : '#64748B';
            },
            borderColor: '#F59E0B',
            borderWidth: 1,
            opacity: 0.88,
          },
          label: {
            show: true,
            formatter: (param: any) => param.data[2],
            position: 'top',
            color: isLight ? '#334155' : '#E2E8F0',
            fontSize: 10,
            fontWeight: 'bold',
          },
          markLine: {
            silent: true,
            lineStyle: { color: isLight ? '#94A3B8' : '#475569', type: 'solid', width: 1 },
            data: [
              { yAxis: 0 },
              { yAxis: 20, lineStyle: { color: '#059669', type: 'dashed' } },
              { yAxis: -20, lineStyle: { color: '#E11D48', type: 'dashed' } },
            ],
          },
        },
      ],
    };
  }, [assets, tfKey, selectedTimeframe, isLight, textPrimary, textMuted, axisLineColor, splitLineColor, tooltipBg, tooltipBorder]);

  // 3. Top Positive and Negative Contributions Chart
  const contributionsOption = useMemo(() => {
    const sorted = [...assets]
      .filter((a) => a.estimatedContribution !== null)
      .sort((a, b) => (b.estimatedContribution ?? 0) - (a.estimatedContribution ?? 0));

    const topPos = sorted.slice(0, 8);
    const topNeg = sorted.slice(-8).reverse();
    const combined = [...topPos, ...topNeg];

    const tickers = combined.map((a) => a.ticker);
    const values = combined.map((a) => a.estimatedContribution ?? 0);

    return {
      backgroundColor: 'transparent',
      grid: { left: 60, right: 30, top: 25, bottom: 35 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const a = assets.find((x) => x.ticker === item.name);
          if (!a) return '';
          return `
            <div style="font-family: Inter, sans-serif; padding: 4px; font-size: 12px; color: ${textPrimary};">
              <b style="color: #F59E0B;">${a.ticker}</b> (${a.name})<br/>
              <b>Contribuição Estimada:</b> ${item.value > 0 ? '+' : ''}${item.value.toFixed(3)} pts<br/>
              <b>Retorno Diário:</b> ${a.dailyReturn !== null ? `${a.dailyReturn > 0 ? '+' : ''}${a.dailyReturn.toFixed(2)}%` : '—'}<br/>
              <b>Peso na Carteira:</b> ${a.weight.toFixed(2)}%
            </div>
          `;
        },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
      },
      xAxis: {
        type: 'category',
        data: tickers,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: textMuted, fontSize: 11, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: 'Contribuição (pontos %)',
        nameTextStyle: { color: textMuted, fontSize: 11 },
        axisLine: { lineStyle: { color: axisLineColor } },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLabel: { color: textMuted },
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: {
            color: (params: any) => (params.value >= 0 ? '#10B981' : '#F43F5E'),
            borderRadius: [3, 3, 0, 0],
          },
          label: {
            show: true,
            position: 'top',
            formatter: (p: any) => (p.value !== 0 ? `${p.value > 0 ? '+' : ''}${p.value.toFixed(2)}` : ''),
            color: textMuted,
            fontSize: 9,
          },
        },
      ],
    };
  }, [assets, isLight, textPrimary, textMuted, axisLineColor, splitLineColor, tooltipBg, tooltipBorder]);

  // 4. Comparative IBOV vs WINFUT vs Weighted Basket
  const comparativeOption = useMemo(() => {
    const pointsCount = 30;
    const timestamps: string[] = [];
    const ibovSeries: number[] = [];
    const winfutSeries: number[] = [];
    const basketSeries: number[] = [];

    const now = Date.now();
    let ibovBase = 100;
    let winfutBase = 100;
    let basketBase = 100;

    for (let i = pointsCount; i >= 0; i--) {
      const time = new Date(now - i * 15 * 60 * 1000);
      timestamps.push(
        time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );

      const ibovStep = (Math.sin(i * 0.4) * 0.15) + ((Math.random() - 0.48) * 0.2);
      const winfutStep = ibovStep * 1.1 + ((Math.random() - 0.49) * 0.18);
      const basketStep = ibovStep * 0.95 + ((Math.random() - 0.48) * 0.12);

      ibovBase += ibovStep;
      winfutBase += winfutStep;
      basketBase += basketStep;

      ibovSeries.push(Number(ibovBase.toFixed(2)));
      winfutSeries.push(Number(winfutBase.toFixed(2)));
      basketSeries.push(Number(basketBase.toFixed(2)));
    }

    return {
      backgroundColor: 'transparent',
      legend: {
        data: ['IBOVESPA (^BVSP)', 'WINFUT (WINZ26)', 'Cesta Ponderada de Ações'],
        textStyle: { color: isLight ? '#334155' : '#CBD5E1', fontSize: 11 },
        top: 0,
      },
      grid: { left: 45, right: 30, top: 40, bottom: 35 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textPrimary },
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: textMuted, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        scale: true,
        name: 'Variação Acumulada (Base 100)',
        nameTextStyle: { color: textMuted, fontSize: 11 },
        axisLine: { lineStyle: { color: axisLineColor } },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLabel: { color: textMuted },
      },
      series: [
        {
          name: 'IBOVESPA (^BVSP)',
          type: 'line',
          data: ibovSeries,
          smooth: true,
          lineStyle: { width: 2.5, color: '#0284C7' },
          itemStyle: { color: '#0284C7' },
        },
        {
          name: 'WINFUT (WINZ26)',
          type: 'line',
          data: winfutSeries,
          smooth: true,
          lineStyle: { width: 2.5, color: '#D97706' },
          itemStyle: { color: '#D97706' },
        },
        {
          name: 'Cesta Ponderada de Ações',
          type: 'line',
          data: basketSeries,
          smooth: true,
          lineStyle: { width: 2, color: '#059669', type: 'dashed' },
          itemStyle: { color: '#059669' },
        },
      ],
    };
  }, [isLight, textPrimary, textMuted, axisLineColor, splitLineColor, tooltipBg, tooltipBorder]);

  // 5. Trend Distribution (Count or Weighted %)
  const distributionOption = useMemo(() => {
    const statesMap: Record<string, { count: number; weight: number }> = {
      'ALTA EM ACELERAÇÃO': { count: 0, weight: 0 },
      'ALTA FORTE': { count: 0, weight: 0 },
      'ALTA PERDENDO FORÇA': { count: 0, weight: 0 },
      'TRANSIÇÃO': { count: 0, weight: 0 },
      'NEUTRO': { count: 0, weight: 0 },
      'BAIXA PERDENDO FORÇA': { count: 0, weight: 0 },
      'BAIXA FORTE': { count: 0, weight: 0 },
      'BAIXA EM ACELERAÇÃO': { count: 0, weight: 0 },
    };

    assets.forEach((a) => {
      const ind = a.indicatorsByTimeframe[tfKey] || a.indicatorsByTimeframe['1d'];
      const st = ind?.trendState || 'NEUTRO';
      if (statesMap[st]) {
        statesMap[st].count++;
        statesMap[st].weight += a.weight;
      }
    });

    const categories = Object.keys(statesMap);
    const dataValues = categories.map((cat) =>
      distributionMode === 'weighted'
        ? Number(statesMap[cat].weight.toFixed(2))
        : statesMap[cat].count
    );

    const colors = [
      '#059669',
      '#10B981',
      '#34D399',
      '#F59E0B',
      '#64748B',
      '#FB7185',
      '#F43F5E',
      '#E11D48',
    ];

    return {
      backgroundColor: 'transparent',
      grid: { left: 160, right: 30, top: 20, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        formatter: (params: any) => {
          const item = params[0];
          const st = statesMap[item.name];
          return `
            <div style="font-family: Inter, sans-serif; padding: 4px; font-size: 12px; color: ${textPrimary};">
              <b style="color: #F59E0B;">${item.name}</b><br/>
              <b>Quantidade:</b> ${st.count} ações<br/>
              <b>Peso na Carteira:</b> ${st.weight.toFixed(2)}%
            </div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: axisLineColor } },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLabel: {
          color: textMuted,
          formatter: distributionMode === 'weighted' ? '{value}%' : '{value}',
        },
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: isLight ? '#1E293B' : '#E2E8F0', fontSize: 11, fontWeight: 'medium' },
      },
      series: [
        {
          type: 'bar',
          data: dataValues,
          itemStyle: {
            color: (params: any) => colors[params.dataIndex % colors.length],
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            formatter: distributionMode === 'weighted' ? '{c}%' : '{c}',
            color: textMuted,
            fontSize: 10,
          },
        },
      ],
    };
  }, [assets, tfKey, distributionMode, isLight, textPrimary, textMuted, axisLineColor, splitLineColor, tooltipBg, tooltipBorder]);

  // 6. Aggregate Strength Evolution Chart (History)
  const historyOption = useMemo(() => {
    const list = history.length > 0 ? history : [];
    const timestamps = list.map((h) =>
      new Date(h.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
    const aggScores = list.map((h) => h.aggregateScore);
    const bullCounts = list.map((h) => h.bullStrengthScore);
    const bearCounts = list.map((h) => h.bearStrengthScore);

    return {
      backgroundColor: 'transparent',
      legend: {
        data: ['Score Ponderado do Mercado', 'Ações Força Compradora', 'Ações Força Vendedora'],
        textStyle: { color: isLight ? '#334155' : '#CBD5E1', fontSize: 11 },
        top: 0,
      },
      grid: { left: 45, right: 45, top: 40, bottom: 35 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textPrimary },
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: textMuted, fontSize: 10 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Score (-100 a +100)',
          min: -100,
          max: 100,
          nameTextStyle: { color: textMuted, fontSize: 11 },
          axisLine: { lineStyle: { color: axisLineColor } },
          splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
          axisLabel: { color: textMuted },
        },
        {
          type: 'value',
          name: 'Qtd de Ações',
          nameTextStyle: { color: textMuted, fontSize: 11 },
          axisLine: { lineStyle: { color: axisLineColor } },
          splitLine: { show: false },
          axisLabel: { color: textMuted },
        },
      ],
      series: [
        {
          name: 'Score Ponderado do Mercado',
          type: 'line',
          yAxisIndex: 0,
          data: aggScores,
          smooth: true,
          lineStyle: { width: 3, color: '#F59E0B' },
          itemStyle: { color: '#F59E0B' },
          areaStyle: {
            color: isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
          },
        },
        {
          name: 'Ações Força Compradora',
          type: 'bar',
          yAxisIndex: 1,
          data: bullCounts,
          itemStyle: { color: '#10B981', opacity: 0.6 },
        },
        {
          name: 'Ações Força Vendedora',
          type: 'bar',
          yAxisIndex: 1,
          data: bearCounts,
          itemStyle: { color: '#F43F5E', opacity: 0.6 },
        },
      ],
    };
  }, [history, isLight, textPrimary, textMuted, axisLineColor, splitLineColor, tooltipBg, tooltipBorder]);

  const onEvents = {
    click: (params: any) => {
      if (params.data && params.data.ticker) {
        onSelectAsset(params.data.ticker);
      } else if (params.data && Array.isArray(params.data) && params.data[2]) {
        onSelectAsset(params.data[2]);
      } else if (params.name) {
        const cleanTicker = params.name.split('\n')[0].trim();
        const found = assets.find((a) => a.ticker === cleanTicker);
        if (found) onSelectAsset(found.ticker);
      }
    },
  };

  return (
    <div
      className={`border rounded-xl p-4 shadow-sm mb-5 transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}
    >
      {/* Chart Nav Tabs */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'heatmap'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>A — Mapa de Força</span>
          </button>

          <button
            onClick={() => setActiveTab('scatter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'scatter'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ScatterChart className="w-3.5 h-3.5" />
            <span>B — Peso vs Força</span>
          </button>

          <button
            onClick={() => setActiveTab('contributions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'contributions'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>C — Contribuições (+ / -)</span>
          </button>

          <button
            onClick={() => setActiveTab('comparative')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'comparative'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>D — IBOV vs WINFUT vs Cesta</span>
          </button>

          <button
            onClick={() => setActiveTab('distribution')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'distribution'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>E — Distribuição Tendência</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>F — Evolução Temporal</span>
          </button>
        </div>

        {/* Local Chart Controls */}
        {activeTab === 'heatmap' && (
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Colorir por:</span>
            <div className={`flex border rounded-lg p-0.5 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              {(
                [
                  { key: 'score', label: 'Score' },
                  { key: 'dailyReturn', label: 'Retorno %' },
                  { key: 'distance', label: 'Dist. MM200' },
                  { key: 'contribution', label: 'Contribuição' },
                ] as { key: ColorByOption; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setColorBy(opt.key)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                    colorBy === opt.key
                      ? isLight
                        ? 'bg-white text-amber-700 border border-amber-300 shadow-sm'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Exibição:</span>
            <div className={`flex border rounded-lg p-0.5 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <button
                onClick={() => setDistributionMode('weighted')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  distributionMode === 'weighted'
                    ? isLight
                      ? 'bg-white text-amber-700 border border-amber-300 shadow-sm'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ponderada por Peso (%)
              </button>
              <button
                onClick={() => setDistributionMode('count')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  distributionMode === 'count'
                    ? isLight
                      ? 'bg-white text-amber-700 border border-amber-300 shadow-sm'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Contagem Simples (Ações)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-[400px]">
        {activeTab === 'heatmap' && (
          <ReactECharts
            option={treemapOption}
            style={{ height: '100%', width: '100%' }}
            onEvents={onEvents}
            notMerge={true}
          />
        )}
        {activeTab === 'scatter' && (
          <ReactECharts
            option={scatterOption}
            style={{ height: '100%', width: '100%' }}
            onEvents={onEvents}
            notMerge={true}
          />
        )}
        {activeTab === 'contributions' && (
          <ReactECharts
            option={contributionsOption}
            style={{ height: '100%', width: '100%' }}
            onEvents={onEvents}
            notMerge={true}
          />
        )}
        {activeTab === 'comparative' && (
          <ReactECharts
            option={comparativeOption}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
          />
        )}
        {activeTab === 'distribution' && (
          <ReactECharts
            option={distributionOption}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
          />
        )}
        {activeTab === 'history' && (
          <ReactECharts
            option={historyOption}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
          />
        )}
      </div>
    </div>
  );
};
