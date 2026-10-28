import React, { useState, useMemo } from 'react';
import {
  AssetMetrics,
  Timeframe,
  TrendState,
} from '../types';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Eye,
} from 'lucide-react';

interface AssetsTableProps {
  assets: AssetMetrics[];
  selectedTimeframe: Timeframe | 'multi';
  onSelectTimeframe: (tf: Timeframe | 'multi') => void;
  onSelectAsset: (ticker: string) => void;
  theme?: 'dark' | 'light';
}

type SortField =
  | 'ranking'
  | 'ticker'
  | 'name'
  | 'price'
  | 'dailyReturn'
  | 'weight'
  | 'distance'
  | 'slope'
  | 'rsi'
  | 'score1d'
  | 'score60m'
  | 'score15m'
  | 'score5m'
  | 'multiperiodScore'
  | 'estimatedContribution';

export const AssetsTable: React.FC<AssetsTableProps> = ({
  assets,
  selectedTimeframe,
  onSelectTimeframe,
  onSelectAsset,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrend, setFilterTrend] = useState<string>('ALL');
  const [filterScoreRange, setFilterScoreRange] = useState<string>('ALL');
  const [filterRsiRange, setFilterRsiRange] = useState<string>('ALL');
  const [filterContribution, setFilterContribution] = useState<string>('ALL');
  const [minWeight, setMinWeight] = useState<number>(0);

  const [sortField, setSortField] = useState<SortField>('weight');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const tfKey: Timeframe = selectedTimeframe === 'multi' ? '1d' : selectedTimeframe;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const processedAssets = useMemo(() => {
    return assets
      .filter((a) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !a.ticker.toLowerCase().includes(q) &&
            !a.name.toLowerCase().includes(q)
          ) {
            return false;
          }
        }

        if (a.weight < minWeight) return false;

        const ind = a.indicatorsByTimeframe[tfKey] || a.indicatorsByTimeframe['1d'];

        if (filterTrend !== 'ALL') {
          if (ind?.trendState !== filterTrend) return false;
        }

        const score = selectedTimeframe === 'multi' ? a.multiperiodScore : ind?.score;
        if (filterScoreRange === 'BULL_STRONG' && (score === null || score < 60)) return false;
        if (filterScoreRange === 'BULL_MODERATE' && (score === null || score < 20 || score >= 60)) return false;
        if (filterScoreRange === 'NEUTRAL' && (score === null || Math.abs(score) >= 20)) return false;
        if (filterScoreRange === 'BEAR_MODERATE' && (score === null || score > -20 || score <= -60)) return false;
        if (filterScoreRange === 'BEAR_STRONG' && (score === null || score > -60)) return false;

        if (filterRsiRange === 'OVERBOUGHT' && (ind?.rsi14 === null || ind.rsi14 < 70)) return false;
        if (filterRsiRange === 'OVERSOLD' && (ind?.rsi14 === null || ind.rsi14 > 30)) return false;

        if (filterContribution === 'POSITIVE' && (a.estimatedContribution === null || a.estimatedContribution <= 0)) return false;
        if (filterContribution === 'NEGATIVE' && (a.estimatedContribution === null || a.estimatedContribution >= 0)) return false;

        return true;
      })
      .sort((a, b) => {
        const indA = a.indicatorsByTimeframe[tfKey] || a.indicatorsByTimeframe['1d'];
        const indB = b.indicatorsByTimeframe[tfKey] || b.indicatorsByTimeframe['1d'];

        let valA: any = 0;
        let valB: any = 0;

        switch (sortField) {
          case 'ticker':
            valA = a.ticker;
            valB = b.ticker;
            break;
          case 'name':
            valA = a.name;
            valB = b.name;
            break;
          case 'price':
            valA = a.currentPrice ?? 0;
            valB = b.currentPrice ?? 0;
            break;
          case 'dailyReturn':
            valA = a.dailyReturn ?? 0;
            valB = b.dailyReturn ?? 0;
            break;
          case 'weight':
            valA = a.weight;
            valB = b.weight;
            break;
          case 'distance':
            valA = indA?.distancePercent ?? -999;
            valB = indB?.distancePercent ?? -999;
            break;
          case 'slope':
            valA = indA?.slopePercent ?? -999;
            valB = indB?.slopePercent ?? -999;
            break;
          case 'rsi':
            valA = indA?.rsi14 ?? -999;
            valB = indB?.rsi14 ?? -999;
            break;
          case 'score1d':
            valA = a.indicatorsByTimeframe['1d']?.score ?? -999;
            valB = b.indicatorsByTimeframe['1d']?.score ?? -999;
            break;
          case 'score60m':
            valA = a.indicatorsByTimeframe['60m']?.score ?? -999;
            valB = b.indicatorsByTimeframe['60m']?.score ?? -999;
            break;
          case 'score15m':
            valA = a.indicatorsByTimeframe['15m']?.score ?? -999;
            valB = b.indicatorsByTimeframe['15m']?.score ?? -999;
            break;
          case 'score5m':
            valA = a.indicatorsByTimeframe['5m']?.score ?? -999;
            valB = b.indicatorsByTimeframe['5m']?.score ?? -999;
            break;
          case 'multiperiodScore':
            valA = a.multiperiodScore ?? -999;
            valB = b.multiperiodScore ?? -999;
            break;
          case 'estimatedContribution':
            valA = a.estimatedContribution ?? -999;
            valB = b.estimatedContribution ?? -999;
            break;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    assets,
    tfKey,
    selectedTimeframe,
    searchQuery,
    minWeight,
    filterTrend,
    filterScoreRange,
    filterRsiRange,
    filterContribution,
    sortField,
    sortDirection,
  ]);

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-amber-500 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-500 ml-1 inline" />
    );
  };

  const renderScorePill = (score: number | null) => {
    if (score === null) return <span className="text-slate-400 text-xs">—</span>;
    const isBull = score >= 20;
    const isBear = score <= -20;
    const bg = isBull
      ? isLight
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : isBear
      ? isLight
        ? 'bg-rose-100 text-rose-800 border-rose-300'
        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      : isLight
      ? 'bg-slate-100 text-slate-700 border-slate-300'
      : 'bg-slate-800 text-slate-300 border-slate-700';

    return (
      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${bg}`}>
        {score > 0 ? `+${score}` : score}
      </span>
    );
  };

  const renderTrendBadge = (trend: TrendState) => {
    let color = isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700';
    if (trend === 'ALTA EM ACELERAÇÃO') {
      color = isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold';
    } else if (trend === 'ALTA FORTE') {
      color = isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    } else if (trend === 'ALTA PERDENDO FORÇA') {
      color = isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    } else if (trend === 'BAIXA EM ACELERAÇÃO') {
      color = isLight ? 'bg-rose-100 text-rose-800 border-rose-400 font-bold' : 'bg-rose-600/25 text-rose-300 border-rose-500/50 font-bold';
    } else if (trend === 'BAIXA FORTE') {
      color = isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    } else if (trend === 'BAIXA PERDENDO FORÇA') {
      color = isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    } else if (trend === 'TRANSIÇÃO') {
      color = isLight ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    }

    return (
      <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${color}`}>
        {trend}
      </span>
    );
  };

  return (
    <div
      className={`border rounded-xl shadow-md overflow-hidden transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}
    >
      {/* Top Filter & Timeframe Strip */}
      <div className={`p-4 border-b space-y-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Timeframe selector */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Periodicidade:
            </span>
            <div className={`flex border rounded-lg p-0.5 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              {(
                [
                  { key: '5m', label: '5 Min' },
                  { key: '15m', label: '15 Min' },
                  { key: '60m', label: '60 Min' },
                  { key: '1d', label: 'Diário' },
                  { key: 'multi', label: 'Multiperíodo (4x)' },
                ] as { key: Timeframe | 'multi'; label: string }[]
              ).map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => onSelectTimeframe(tf.key)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    selectedTimeframe === tf.key
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-amber-700'
                      : 'text-slate-300 hover:text-amber-400'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Buscar por ticker ou empresa (ex: PETR4)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-amber-500'
              }`}
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className={`flex flex-wrap items-center gap-2.5 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Filtros:</span>
          </div>

          {/* Trend Filter */}
          <select
            aria-label="Filtrar por tendência técnica"
            value={filterTrend}
            onChange={(e) => setFilterTrend(e.target.value)}
            className={`border rounded-md px-2 py-1 text-xs focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500'
            }`}
          >
            <option value="ALL">Todas as Tendências</option>
            <option value="ALTA EM ACELERAÇÃO">Alta em Aceleração</option>
            <option value="ALTA FORTE">Alta Forte</option>
            <option value="ALTA PERDENDO FORÇA">Alta Perdendo Força</option>
            <option value="BAIXA EM ACELERAÇÃO">Baixa em Aceleração</option>
            <option value="BAIXA FORTE">Baixa Forte</option>
            <option value="BAIXA PERDENDO FORÇA">Baixa Perdendo Força</option>
            <option value="TRANSIÇÃO">Transição</option>
            <option value="NEUTRO">Neutro</option>
          </select>

          {/* Score Filter */}
          <select
            aria-label="Filtrar por faixa de Farol Score"
            value={filterScoreRange}
            onChange={(e) => setFilterScoreRange(e.target.value)}
            className={`border rounded-md px-2 py-1 text-xs focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500'
            }`}
          >
            <option value="ALL">Todos os Scores</option>
            <option value="BULL_STRONG">Comprador Forte (&ge; +60)</option>
            <option value="BULL_MODERATE">Comprador Moderado (+20 a +59)</option>
            <option value="NEUTRAL">Neutro (-19 a +19)</option>
            <option value="BEAR_MODERATE">Vendedor Moderado (-20 a -59)</option>
            <option value="BEAR_STRONG">Vendedor Forte (&le; -60)</option>
          </select>

          {/* RSI Filter */}
          <select
            aria-label="Filtrar por IFR 14"
            value={filterRsiRange}
            onChange={(e) => setFilterRsiRange(e.target.value)}
            className={`border rounded-md px-2 py-1 text-xs focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500'
            }`}
          >
            <option value="ALL">Todos os IFRs</option>
            <option value="OVERBOUGHT">Sobrecompra (IFR &gt; 70)</option>
            <option value="OVERSOLD">Sobrevenda (IFR &lt; 30)</option>
          </select>

          {/* Contribution Filter */}
          <select
            aria-label="Filtrar por contribuição estimada"
            value={filterContribution}
            onChange={(e) => setFilterContribution(e.target.value)}
            className={`border rounded-md px-2 py-1 text-xs focus:outline-none cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500'
            }`}
          >
            <option value="ALL">Todas as Contribuições</option>
            <option value="POSITIVE">Contribuição Positiva (+)</option>
            <option value="NEGATIVE">Contribuição Negativa (-)</option>
          </select>

          {/* Min Weight Filter */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Peso Mínimo:</span>
            <select
              aria-label="Filtrar por peso mínimo na carteira"
              value={minWeight}
              onChange={(e) => setMinWeight(Number(e.target.value))}
              className={`border rounded-md px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-amber-700 focus:border-amber-500'
                  : 'bg-slate-950 border-slate-800 text-amber-400 focus:border-amber-500'
              }`}
            >
              <option value={0}>Todos (&gt; 0%)</option>
              <option value={0.5}>&ge; 0.5%</option>
              <option value={1.0}>&ge; 1.0%</option>
              <option value={2.0}>&ge; 2.0%</option>
              <option value={3.0}>&ge; 3.0% (Blue Chips)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead
            className={`uppercase font-semibold text-[11px] sticky top-0 z-20 shadow-sm border-b transition-colors ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-[#0B132B] text-slate-400 border-slate-800'
            }`}
          >
            <tr>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('weight')}>
                Rank {renderSortArrow('weight')}
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('ticker')}>
                Ativo {renderSortArrow('ticker')}
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('price')}>
                Preço {renderSortArrow('price')}
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('dailyReturn')}>
                Retorno Dia {renderSortArrow('dailyReturn')}
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('weight')}>
                Peso (%) {renderSortArrow('weight')}
              </th>

              {selectedTimeframe !== 'multi' ? (
                <>
                  <th className="py-2.5 px-3">MM200</th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('distance')}>
                    Dist. MM200 (%) {renderSortArrow('distance')}
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('slope')}>
                    Inclinação {renderSortArrow('slope')}
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('rsi')}>
                    IFR 14 {renderSortArrow('rsi')}
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('score1d')}>
                    Farol Score {renderSortArrow('score1d')}
                  </th>
                  <th className="py-2.5 px-3">Tendência</th>
                </>
              ) : (
                <>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('score1d')}>
                    Score 1D (40%) {renderSortArrow('score1d')}
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('score60m')}>
                    Score 60M (30%) {renderSortArrow('score60m')}
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('score15m')}>
                    Score 15M (20%) {renderSortArrow('score15m')}
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('score5m')}>
                    Score 5M (10%) {renderSortArrow('score5m')}
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('multiperiodScore')}>
                    Score Consolidado {renderSortArrow('multiperiodScore')}
                  </th>
                  <th className="py-2.5 px-3">Alinhamento</th>
                </>
              )}

              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('estimatedContribution')}>
                Contrib. Estimada {renderSortArrow('estimatedContribution')}
              </th>
              <th className="py-2.5 px-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-medium ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
            {processedAssets.map((asset, index) => {
              const ind = asset.indicatorsByTimeframe[tfKey] || asset.indicatorsByTimeframe['1d'];
              const d = asset.indicatorsByTimeframe['1d'];
              const h = asset.indicatorsByTimeframe['60m'];
              const m15 = asset.indicatorsByTimeframe['15m'];
              const m5 = asset.indicatorsByTimeframe['5m'];

              const isPositiveReturn = (asset.dailyReturn ?? 0) >= 0;
              const isPositiveContrib = (asset.estimatedContribution ?? 0) >= 0;

              return (
                <tr
                  key={asset.ticker}
                  onClick={() => onSelectAsset(asset.ticker)}
                  className={`transition cursor-pointer group ${
                    isLight ? 'hover:bg-amber-50/50' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <td className={`py-2 px-3 font-mono text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    #{index + 1}
                  </td>

                  <td className="py-2 px-3">
                    <div className="flex flex-col">
                      <span className={`font-bold font-mono text-xs ${isLight ? 'text-amber-700 group-hover:text-amber-800' : 'text-amber-400 group-hover:text-amber-300'}`}>
                        {asset.ticker}
                      </span>
                      <span className={`text-[10px] truncate max-w-[130px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {asset.name}
                      </span>
                    </div>
                  </td>

                  <td className={`py-2 px-3 font-mono-numbers ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    R$ {asset.currentPrice ? asset.currentPrice.toFixed(2) : '—'}
                  </td>

                  <td className="py-2 px-3 font-mono-numbers">
                    <span
                      className={`font-semibold ${
                        isPositiveReturn ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {asset.dailyReturn !== null ? `${isPositiveReturn ? '+' : ''}${asset.dailyReturn.toFixed(2)}%` : '—'}
                    </span>
                  </td>

                  <td className={`py-2 px-3 font-mono-numbers ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <div className="flex items-center gap-1.5">
                      <span>{asset.weight.toFixed(2)}%</span>
                      <div className={`w-12 h-1 rounded-full overflow-hidden hidden sm:block ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                        <div
                          className="bg-amber-500 h-full"
                          style={{ width: `${Math.min(100, asset.weight * 7)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {selectedTimeframe !== 'multi' ? (
                    <>
                      <td className={`py-2 px-3 font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {ind?.sma200 ? ind.sma200.toFixed(2) : 'Histórico Insuf.'}
                      </td>

                      <td className="py-2 px-3 font-mono-numbers">
                        {ind?.distancePercent !== null ? (
                          <span
                            className={ind.distancePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}
                          >
                            {ind.distancePercent > 0 ? '+' : ''}
                            {ind.distancePercent.toFixed(2)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            ind?.slopeClassification === 'ASCENDENTE'
                              ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/10 text-emerald-400'
                              : ind?.slopeClassification === 'DESCENDENTE'
                              ? isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/10 text-rose-400'
                              : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ind?.slopeClassification || '—'}
                          {ind?.slopePercent !== null ? ` (${ind.slopePercent > 0 ? '+' : ''}${ind.slopePercent.toFixed(2)}%)` : ''}
                        </span>
                      </td>

                      <td className="py-2 px-3 font-mono-numbers">
                        <span
                          className={
                            (ind?.rsi14 ?? 50) > 70
                              ? 'text-amber-600 font-bold'
                              : (ind?.rsi14 ?? 50) < 30
                              ? 'text-cyan-600 font-bold'
                              : isLight ? 'text-slate-700' : 'text-slate-300'
                          }
                        >
                          {ind?.rsi14 !== null ? ind.rsi14.toFixed(1) : '—'}
                        </span>
                      </td>

                      <td className="py-2 px-3">
                        {renderScorePill(ind?.score ?? null)}
                      </td>

                      <td className="py-2 px-3">
                        {renderTrendBadge(ind?.trendState || 'NEUTRO')}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3">{renderScorePill(d?.score ?? null)}</td>
                      <td className="py-2 px-3">{renderScorePill(h?.score ?? null)}</td>
                      <td className="py-2 px-3">{renderScorePill(m15?.score ?? null)}</td>
                      <td className="py-2 px-3">{renderScorePill(m5?.score ?? null)}</td>
                      <td className="py-2 px-3">{renderScorePill(asset.multiperiodScore)}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                          {asset.multiperiodAlignment}
                        </span>
                      </td>
                    </>
                  )}

                  <td className="py-2 px-3 font-mono-numbers">
                    <span
                      className={`font-bold ${
                        isPositiveContrib ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {asset.estimatedContribution !== null
                        ? `${isPositiveContrib ? '+' : ''}${asset.estimatedContribution.toFixed(3)} pts`
                        : '—'}
                    </span>
                  </td>

                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAsset(asset.ticker);
                      }}
                      className={`p-1 rounded transition cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-600'
                          : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300'
                      }`}
                      title="Ver gráficos e análise detalhada"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className={`p-3 border-t flex flex-wrap items-center justify-between text-xs transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
      }`}>
        <div>
          Exibindo <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{processedAssets.length}</span> de{' '}
          <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{assets.length}</span> ativos do Ibovespa
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> &gt;+20 pts Comprador
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;-20 pts Vendedor
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> Neutro
          </span>
        </div>
      </div>
    </div>
  );
};
