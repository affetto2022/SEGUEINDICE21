import React, { useState } from 'react';
import { UserSettings } from '../types';
import { X, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  DEFAULT_SCORE_WEIGHTS,
  DEFAULT_MULTIPERIOD_WEIGHTS,
} from '../indicators/calculations';

interface SettingsModalProps {
  settings: UserSettings;
  onSave: (newSettings: Partial<UserSettings>) => void;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [localSettings, setLocalSettings] = useState<UserSettings>(
    JSON.parse(JSON.stringify(settings))
  );

  const scoreSum = Math.round(
    (localSettings.scoreWeights.mm200Position +
      localSettings.scoreWeights.mm200Slope +
      localSettings.scoreWeights.distanceEvolution +
      localSettings.scoreWeights.returnNormalized +
      localSettings.scoreWeights.rsi +
      localSettings.scoreWeights.directionalConsistency) *
      100
  );

  const multiSum = Math.round(
    (localSettings.multiperiodWeights.daily +
      localSettings.multiperiodWeights.h1 +
      localSettings.multiperiodWeights.m15 +
      localSettings.multiperiodWeights.m5) *
      100
  );

  const handleResetDefaults = () => {
    setLocalSettings({
      ...localSettings,
      scoreWeights: { ...DEFAULT_SCORE_WEIGHTS },
      multiperiodWeights: { ...DEFAULT_MULTIPERIOD_WEIGHTS },
      slopePeriodN: 5,
    });
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-950 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0B132B] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sliders className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Parâmetros e Pesos dos Indicadores
            </h3>
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

        {/* Body */}
        <div className={`p-5 space-y-6 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          {/* Section 1: Farol Strength Score Weights */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold uppercase tracking-wider ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                1. Pesos do Farol Strength Score (Soma: {scoreSum}%)
              </span>
              <span
                className={`font-mono font-bold ${
                  scoreSum === 100 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {scoreSum === 100 ? '✓ 100% Válido' : '⚠ Ajuste para 100%'}
              </span>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Posição em Relação à MM200 ({Math.round(localSettings.scoreWeights.mm200Position * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={localSettings.scoreWeights.mm200Position * 100}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      scoreWeights: {
                        ...localSettings.scoreWeights,
                        mm200Position: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Inclinação da MM200 ({Math.round(localSettings.scoreWeights.mm200Slope * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={localSettings.scoreWeights.mm200Slope * 100}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      scoreWeights: {
                        ...localSettings.scoreWeights,
                        mm200Slope: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Evolução da Distância / Delta ({Math.round(localSettings.scoreWeights.distanceEvolution * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={localSettings.scoreWeights.distanceEvolution * 100}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      scoreWeights: {
                        ...localSettings.scoreWeights,
                        distanceEvolution: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Retorno Normalizado ({Math.round(localSettings.scoreWeights.returnNormalized * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={localSettings.scoreWeights.returnNormalized * 100}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      scoreWeights: {
                        ...localSettings.scoreWeights,
                        returnNormalized: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  IFR 14 Contextual ({Math.round(localSettings.scoreWeights.rsi * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={localSettings.scoreWeights.rsi * 100}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      scoreWeights: {
                        ...localSettings.scoreWeights,
                        rsi: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Consistência Direcional ({Math.round(localSettings.scoreWeights.directionalConsistency * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={localSettings.scoreWeights.directionalConsistency * 100}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      scoreWeights: {
                        ...localSettings.scoreWeights,
                        directionalConsistency: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Multiperiod Weights */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold uppercase tracking-wider ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                2. Pesos da Consolidação Multiperíodo (Soma: {multiSum}%)
              </span>
              <span
                className={`font-mono font-bold ${
                  multiSum === 100 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {multiSum === 100 ? '✓ 100% Válido' : '⚠ Ajuste para 100%'}
              </span>
            </div>

            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Diário ({Math.round(localSettings.multiperiodWeights.daily * 100)}%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(localSettings.multiperiodWeights.daily * 100)}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      multiperiodWeights: {
                        ...localSettings.multiperiodWeights,
                        daily: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className={`w-full border rounded px-2 py-1 font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-100'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  60m ({Math.round(localSettings.multiperiodWeights.h1 * 100)}%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(localSettings.multiperiodWeights.h1 * 100)}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      multiperiodWeights: {
                        ...localSettings.multiperiodWeights,
                        h1: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className={`w-full border rounded px-2 py-1 font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-100'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  15m ({Math.round(localSettings.multiperiodWeights.m15 * 100)}%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(localSettings.multiperiodWeights.m15 * 100)}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      multiperiodWeights: {
                        ...localSettings.multiperiodWeights,
                        m15: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className={`w-full border rounded px-2 py-1 font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-100'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  5m ({Math.round(localSettings.multiperiodWeights.m5 * 100)}%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(localSettings.multiperiodWeights.m5 * 100)}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      multiperiodWeights: {
                        ...localSettings.multiperiodWeights,
                        m5: Number(e.target.value) / 100,
                      },
                    })
                  }
                  className={`w-full border rounded px-2 py-1 font-mono ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-100'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Calculation Parameters */}
          <div>
            <span className={`font-bold uppercase tracking-wider block mb-2 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              3. Parâmetros de Cálculo da Inclinação
            </span>
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div>
                <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Janela N de Candles para Inclinação da MM200
                </span>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Calcula a variação percentual entre a MM200 atual e a MM200 de N candles anteriores.
                </p>
              </div>
              <input
                type="number"
                min="1"
                max="20"
                value={localSettings.slopePeriodN}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    slopePeriodN: Math.max(1, parseInt(e.target.value, 10) || 5),
                  })
                }
                className={`w-20 border rounded px-3 py-1 text-center font-mono font-bold ${
                  isLight ? 'bg-white border-slate-300 text-amber-700' : 'bg-slate-950 border-slate-800 text-amber-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={handleResetDefaults}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar e Recalcular</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
