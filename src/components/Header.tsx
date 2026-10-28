import React, { useState, useEffect } from 'react';
import {
  Compass,
  RefreshCw,
  Download,
  Upload,
  Settings as SettingsIcon,
  Sun,
  Moon,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { MarketSummary, UserSettings } from '../types';
import { StoredLicenseSession, maskCpf } from '../utils/licenseValidator';

interface HeaderProps {
  summary: MarketSummary | null;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  onExportCSV: () => void;
  onOpenImportModal: () => void;
  onOpenSettingsModal: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenIndexModal?: (symbol: 'IBOV' | 'WINFUT') => void;
  licenseSession?: StoredLicenseSession | null;
  onLogoutLicense?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  onRefresh,
  isRefreshing,
  onExportCSV,
  onOpenImportModal,
  onOpenSettingsModal,
  settings,
  onUpdateSettings,
  theme,
  onToggleTheme,
  onOpenIndexModal,
  licenseSession,
  onLogoutLicense,
}) => {
  const [saoPauloTime, setSaoPauloTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setSaoPauloTime(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const ibov = summary?.ibov;
  const winfut = summary?.winfut;

  const isLight = theme === 'light';

  return (
    <header
      className={`border-b sticky top-0 z-40 backdrop-blur shadow-md transition-colors duration-200 ${
        isLight
          ? 'bg-white/95 border-slate-200 shadow-slate-200/50 text-slate-800'
          : 'bg-gradient-to-r from-slate-950 via-[#0B132B] to-slate-950 border-amber-500/20 shadow-black/40 text-slate-100'
      }`}
    >
      <div className="max-w-[1720px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-md shadow-amber-500/20 text-slate-950 font-bold border border-amber-400">
            <Compass className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xl font-extrabold tracking-tight ${
                  isLight
                    ? 'text-slate-900'
                    : 'bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent'
                }`}
              >
                FAROL TRADERS
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                  isLight
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                FAROL_TRADERS_FORCADOIBOVE
              </span>
            </div>
            <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Monitor Quantitativo de Força • IBOVESPA & WINFUT
            </p>
          </div>
        </div>

        {/* Live Index & Future Ticker Strip (Clickable to open chart) */}
        <div
          className={`flex items-center gap-2 md:gap-3 border rounded-lg px-2.5 py-1 shadow-inner transition-colors ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-slate-900/80 border-slate-800 text-slate-100'
          }`}
        >
          {/* IBOV Clickable Badge */}
          <button
            type="button"
            onClick={() => onOpenIndexModal && onOpenIndexModal('IBOV')}
            title="Clique para abrir o gráfico interativo do IBOVESPA (Yahoo Finance Oficial)"
            className={`flex items-center gap-2 pr-3 border-r transition-all rounded px-1.5 py-0.5 cursor-pointer group ${
              isLight
                ? 'border-slate-200 hover:bg-slate-200/80 hover:text-amber-800'
                : 'border-slate-800 hover:bg-slate-800 hover:text-amber-300'
            }`}
          >
            <span className={`text-xs font-semibold group-hover:underline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              IBOV
            </span>
            <span className={`font-mono-numbers text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {ibov?.price ? ibov.price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}
            </span>
            <span
              className={`font-mono-numbers text-xs font-semibold px-1.5 py-0.5 rounded ${
                (ibov?.changePercent ?? 0) >= 0
                  ? isLight
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isLight
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {(ibov?.changePercent ?? 0) >= 0 ? '+' : ''}
              {ibov?.changePercent ? ibov.changePercent.toFixed(2) : '0.00'}%
            </span>
            <span className="text-[10px] font-mono text-amber-500 opacity-60 group-hover:opacity-100">📊</span>
          </button>

          {/* WINFUT Clickable Badge */}
          <button
            type="button"
            onClick={() => onOpenIndexModal && onOpenIndexModal('WINFUT')}
            title="Clique para abrir o gráfico interativo do WINFUT (Mini Índice Futuro)"
            className={`flex items-center gap-2 pr-3 border-r transition-all rounded px-1.5 py-0.5 cursor-pointer group ${
              isLight
                ? 'border-slate-200 hover:bg-slate-200/80 hover:text-amber-800'
                : 'border-slate-800 hover:bg-slate-800 hover:text-amber-300'
            }`}
          >
            <div className="flex flex-col text-left">
              <span className={`text-xs font-semibold flex items-center gap-1 group-hover:underline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                WINFUT
                <span className={`text-[10px] font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  [{winfut?.contract || 'WIN'}]
                </span>
              </span>
            </div>
            <span className={`font-mono-numbers text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {winfut?.price ? winfut.price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}
            </span>
            <span
              className={`font-mono-numbers text-xs font-semibold px-1.5 py-0.5 rounded ${
                (winfut?.changePercent ?? 0) >= 0
                  ? isLight
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isLight
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {(winfut?.changePercent ?? 0) >= 0 ? '+' : ''}
              {winfut?.changePercent ? winfut.changePercent.toFixed(2) : '0.00'}%
            </span>
            <span className="text-[10px] font-mono text-amber-500 opacity-60 group-hover:opacity-100">📊</span>
          </button>

          {/* Basis */}
          <div className={`hidden lg:flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Base:</span>
            <span className={`font-mono font-medium ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
              {winfut?.basis !== null && winfut?.basis !== undefined
                ? `${winfut.basis >= 0 ? '+' : ''}${winfut.basis} pts`
                : '—'}
            </span>
          </div>
        </div>


        {/* Status, Clock, Theme Toggle & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Active License Badge */}
          {licenseSession && (
            <div
              className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1 text-xs shadow-sm ${
                isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex items-center gap-1">
                <span className="font-semibold hidden lg:inline">Licença:</span>
                <span className="font-mono font-bold">{maskCpf(licenseSession.idCliente)}</span>
                <span className="text-[11px] opacity-80">
                  [{licenseSession.mesValidade}/{licenseSession.anoValidade}]
                </span>
              </div>
              {onLogoutLicense && (
                <button
                  type="button"
                  onClick={onLogoutLicense}
                  title="Bloquear / Trocar Chave de Ativação"
                  className="ml-1 text-[11px] text-rose-500 hover:text-rose-400 hover:underline cursor-pointer flex items-center gap-0.5 border-l border-amber-500/20 pl-1.5"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              )}
            </div>
          )}

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
            }`}
            title={isLight ? 'Alternar para Tema Escuro' : 'Alternar para Tema Claro'}
            aria-label={isLight ? 'Alternar para Tema Escuro' : 'Alternar para Tema Claro'}
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Tema Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Tema Claro</span>
              </>
            )}
          </button>

          {/* Sao Paulo Clock */}
          <div className="hidden sm:flex flex-col items-end">
            <span className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              São Paulo (BRT)
            </span>
            <span className={`font-mono text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {saoPauloTime || '--:--:--'}
            </span>
          </div>

          {/* Auto Refresh selector */}
          <div
            className={`flex items-center gap-1.5 border rounded-md px-2 py-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Auto:</span>
            <select
              aria-label="Intervalo de atualização automática"
              value={settings.autoRefreshIntervalSeconds}
              onChange={(e) =>
                onUpdateSettings({ autoRefreshIntervalSeconds: Number(e.target.value) })
              }
              className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${
                isLight ? 'text-amber-700' : 'text-amber-400'
              }`}
            >
              <option value={0} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-slate-200'}>Manual</option>
              <option value={30} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-slate-200'}>30s</option>
              <option value={60} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-slate-200'}>60s</option>
              <option value={120} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-slate-200'}>2 min</option>
              <option value={300} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-slate-200'}>5 min</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-md shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            title="Atualizar dados e recalcular todos os indicadores"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>

          {/* Export CSV button */}
          <button
            onClick={onExportCSV}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Exportar planilha completa em CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Exportar CSV</span>
          </button>

          {/* Import CSV button */}
          <button
            onClick={onOpenImportModal}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Importar composição de carteira do Ibovespa (CSV)"
          >
            <Upload className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Carteira</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettingsModal}
            className={`p-1.5 rounded-md border transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-amber-600 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border-slate-700'
            }`}
            title="Configurações de pesos e parâmetros dos indicadores"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
