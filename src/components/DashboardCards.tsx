import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Gauge,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { MarketSummary } from '../types';

interface DashboardCardsProps {
  summary: MarketSummary | null;
  theme?: 'dark' | 'light';
  onOpenIndexModal?: (symbol: 'IBOV' | 'WINFUT') => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ summary, theme = 'dark', onOpenIndexModal }) => {
  const isLight = theme === 'light';

  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`h-24 rounded-xl border ${
              isLight ? 'bg-slate-200/60 border-slate-300' : 'bg-slate-900/60 border-slate-800'
            }`}
          />
        ))}
      </div>
    );
  }

  const score = summary.aggregateMarketScore;
  const isPositiveScore = score > 0;
  const isNeutralScore = Math.abs(score) <= 15;

  const scoreBadgeColor =
    score >= 60
      ? 'from-emerald-600 to-emerald-700 text-white'
      : score >= 20
      ? isLight
        ? 'from-emerald-500 to-emerald-600 text-white'
        : 'from-emerald-500/80 to-emerald-600/80 text-emerald-100'
      : score <= -60
      ? 'from-rose-600 to-rose-700 text-white'
      : score <= -20
      ? isLight
        ? 'from-rose-500 to-rose-600 text-white'
        : 'from-rose-500/80 to-rose-600/80 text-rose-100'
      : isLight
      ? 'from-slate-200 to-slate-300 text-slate-800'
      : 'from-slate-700 to-slate-800 text-slate-200';

  return (
    <div className="space-y-3 mb-5">
      {/* Confirmation Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border rounded-xl px-4 py-2.5 shadow-sm transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50 border-amber-300 shadow-slate-200/60'
            : 'bg-gradient-to-r from-slate-900 via-[#0B1530] to-slate-900 border-amber-500/30'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Zap className={`w-5 h-5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <div>
            <span
              className={`text-xs uppercase font-bold tracking-wider ${
                isLight ? 'text-amber-800' : 'text-amber-400'
              }`}
            >
              Diagnóstico de Alinhamento:
            </span>
            <p className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {summary.confirmationStatus}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Cobertura:</span>
            <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {summary.validAssetsCount}/{summary.totalAssetsCount} ({summary.validAssetsCoverage}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <span>Última Checagem:</span>
            <span className={`font-mono font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {new Date(summary.lastSuccessUpdate).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Score Ponderado */}
        <div
          className={`border rounded-xl p-3 shadow-sm transition-all flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-800'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Farol Score Mercado
            </span>
            <Gauge className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          </div>
          <div className="flex items-baseline justify-between">
            <div className={`px-2.5 py-0.5 rounded-lg bg-gradient-to-r ${scoreBadgeColor} font-mono text-xl font-black shadow`}>
              {score > 0 ? `+${score}` : score}
            </div>
            <span className={`text-[10px] font-semibold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isNeutralScore ? 'Neutro' : isPositiveScore ? 'Comprador' : 'Vendedor'}
            </span>
          </div>
          <div className={`mt-2 text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {summary.marketAlignment}
          </div>
        </div>

        {/* Card 2: Amplitude MM200 Diária */}
        <div
          className={`border rounded-xl p-3 shadow-sm transition-all flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-800'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Acima da MM200 Diária
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold text-emerald-600">
              {summary.percentAboveMM200Daily}%
            </span>
            <span className="text-xs text-rose-500 font-mono font-medium">
              {summary.percentBelowMM200Daily}% abaixo
            </span>
          </div>
          <div className={`mt-2 w-full h-1.5 rounded-full overflow-hidden flex ${isLight ? 'bg-rose-100' : 'bg-rose-950'}`}>
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${summary.percentAboveMM200Daily}%` }}
            />
          </div>
        </div>

        {/* Card 3: Força Compradora vs Vendedora */}
        <div
          className={`border rounded-xl p-3 shadow-sm transition-all flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-800'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Força Compradora
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">&gt;+20 pts</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold text-emerald-600">
              {summary.countBullStrength}{' '}
              <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ações</span>
            </span>
            <div className="text-right">
              <span className="text-xs text-rose-500 font-mono font-bold">
                {summary.countBearStrength}
              </span>
              <span className={`text-[10px] ml-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>vendedoras</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] flex justify-between">
            <span className="text-emerald-600 font-medium">Alta Consistente</span>
            <span className="text-rose-600 font-medium">Baixa Consistente</span>
          </div>
        </div>

        {/* Card 4: IFR Extremos */}
        <div
          className={`border rounded-xl p-3 shadow-sm transition-all flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-800'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              IFR 14 Extremos
            </span>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>70 / 30</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className={`font-mono text-xl font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                {summary.countOverbought}
              </span>
              <span className={`text-[10px] ml-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sobrecompra</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-lg font-bold text-cyan-600">
                {summary.countOversold}
              </span>
              <span className={`text-[10px] ml-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sobrevenda</span>
            </div>
          </div>
          <div className={`mt-2 text-[10px] flex justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>IFR &gt; 70</span>
            <span>IFR &lt; 30</span>
          </div>
        </div>

        {/* Card 5: IBOVESPA Detalhe (Clickable to open chart) */}
        <button
          type="button"
          onClick={() => onOpenIndexModal && onOpenIndexModal('IBOV')}
          title="Clique para abrir o gráfico do IBOVESPA (Yahoo Finance Oficial)"
          className={`border rounded-xl p-3 shadow-sm transition-all flex flex-col justify-between text-left cursor-pointer group hover:scale-[1.02] active:scale-[0.99] ${
            isLight
              ? 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md text-slate-800'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1 w-full">
            <span className={`font-medium group-hover:text-amber-500 transition-colors ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              IBOVESPA À Vista
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-1">
              ^BVSP 📊
            </span>
          </div>
          <div className="flex items-baseline justify-between w-full">
            <span className={`font-mono text-lg font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {summary.ibov.price ? summary.ibov.price.toLocaleString('pt-BR') : '—'}
            </span>
            <span
              className={`font-mono text-xs font-bold ${
                (summary.ibov.changePercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(summary.ibov.changePercent ?? 0) >= 0 ? '+' : ''}
              {summary.ibov.changePercent?.toFixed(2)}%
            </span>
          </div>
          <div className="mt-2 text-[10px] flex items-center justify-between w-full text-slate-400">
            <span className="truncate max-w-[130px]">{summary.ibov.source}</span>
            <span className="text-amber-500 font-semibold group-hover:underline">Ver Gráfico &rarr;</span>
          </div>
        </button>

        {/* Card 6: WINFUT Detalhe (Clickable to open chart) */}
        <button
          type="button"
          onClick={() => onOpenIndexModal && onOpenIndexModal('WINFUT')}
          title="Clique para abrir o gráfico do WINFUT (Mini Índice Futuro)"
          className={`border rounded-xl p-3 shadow-sm transition-all flex flex-col justify-between text-left cursor-pointer group hover:scale-[1.02] active:scale-[0.99] ${
            isLight
              ? 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md text-slate-800'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1 w-full">
            <span className={`font-medium group-hover:text-amber-500 transition-colors ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Mini Índice Futuro
            </span>
            <span className={`text-[10px] font-mono font-bold text-amber-500 flex items-center gap-1`}>
              {summary.winfut.contract} 📊
            </span>
          </div>
          <div className="flex items-baseline justify-between w-full">
            <span className={`font-mono text-lg font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {summary.winfut.price ? summary.winfut.price.toLocaleString('pt-BR') : '—'}
            </span>
            <span
              className={`font-mono text-xs font-bold ${
                (summary.winfut.changePercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(summary.winfut.changePercent ?? 0) >= 0 ? '+' : ''}
              {summary.winfut.changePercent?.toFixed(2)}%
            </span>
          </div>
          <div className={`mt-2 text-[10px] flex justify-between items-center w-full ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Base: {summary.winfut.basis !== null ? `${summary.winfut.basis >= 0 ? '+' : ''}${summary.winfut.basis} pts` : ''}</span>
            <span className="text-amber-500 font-semibold group-hover:underline">Ver Gráfico &rarr;</span>
          </div>
        </button>
      </div>
    </div>
  );
};

