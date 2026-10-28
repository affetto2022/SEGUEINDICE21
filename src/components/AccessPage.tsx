import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Calendar,
  UserCheck,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calculator,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import {
  CHID_INDICADOR_PADRAO,
  CHAVE_SECRETA,
  calculateActivationKey,
  validateLicense,
  formatCpf,
  sanitizeCpf,
  saveLicenseSession,
  LicenseInput,
  LicenseValidationResult,
} from '../utils/licenseValidator';

interface AccessPageProps {
  onAccessGranted: (licenseData: LicenseInput) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AccessPage: React.FC<AccessPageProps> = ({
  onAccessGranted,
  theme,
  onToggleTheme,
}) => {
  // Campos obrigatórios conforme especificação do usuário:
  // ID_Cliente(COLOQUE AQUI O SEU CPF)
  // MesValidade(9) , "Mês de Validade (1-12)");
  // AnoValidade(2026) , "Ano de Validade (AAAA)");
  // ChaveAtivacao(111112248148),  "Sua Chave de Ativação");
  // ID_Indicador("FRPBJCVF"); "Nome do indicador"
  const [idCliente, setIdCliente] = useState<string>('12345678901');
  const [mesValidade, setMesValidade] = useState<number>(() => {
    // Definir como mês atual ou próximo para conveniência
    const now = new Date();
    return Math.min(12, now.getMonth() + 2);
  });
  const [anoValidade, setAnoValidade] = useState<number>(() => {
    const now = new Date();
    return Math.max(2026, now.getFullYear());
  });
  const [chaveAtivacao, setChaveAtivacao] = useState<string>('');
  const [idIndicador, setIdIndicador] = useState<string>(CHID_INDICADOR_PADRAO);

  const [validationResult, setValidationResult] = useState<LicenseValidationResult | null>(null);
  const [showAdminGenerator, setShowAdminGenerator] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const isLight = theme === 'light';

  // Chave calculada dinamicamente para o gerador e auxílio
  let liveCalculatedKey = '';
  try {
    if (sanitizeCpf(idCliente).length >= 11) {
      liveCalculatedKey = calculateActivationKey(idCliente, mesValidade, anoValidade);
    }
  } catch {
    liveCalculatedKey = '';
  }

  // Preencher chave automaticamente pelo gerador
  const handleApplyCalculatedKey = () => {
    if (liveCalculatedKey) {
      setChaveAtivacao(liveCalculatedKey);
      setValidationResult(null);
    }
  };

  // Carregar exemplo exato da especificação do usuário
  const handleLoadUserSpecExample = () => {
    setIdCliente('12345678901');
    setMesValidade(9);
    setAnoValidade(2026);
    setChaveAtivacao('111112248148');
    setIdIndicador(CHID_INDICADOR_PADRAO);
    setValidationResult(null);
  };

  // Carregar exemplo de licença ativa vigente (ex: 2027)
  const handleLoadActiveLicenseExample = () => {
    const cpf = '12345678901';
    const mes = 12;
    const ano = 2027;
    const chave = calculateActivationKey(cpf, mes, ano);
    setIdCliente(cpf);
    setMesValidade(mes);
    setAnoValidade(ano);
    setChaveAtivacao(chave);
    setIdIndicador(CHID_INDICADOR_PADRAO);
    setValidationResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const licenseInput: LicenseInput = {
      idCliente,
      mesValidade,
      anoValidade,
      chaveAtivacao,
      idIndicador,
    };

    const result = validateLicense(licenseInput, new Date());
    setValidationResult(result);

    if (result.isValid) {
      // Salva a sessão no localStorage
      saveLicenseSession(licenseInput);
      // Pequeno delay para exibir animação de sucesso
      setTimeout(() => {
        onAccessGranted(licenseInput);
      }, 700);
    }
  };

  const handleCopyKey = () => {
    if (liveCalculatedKey) {
      navigator.clipboard.writeText(liveCalculatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-200 ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#030712] text-slate-100'
      }`}
    >
      {/* Top Bar with Theme Toggle */}
      <header
        className={`border-b px-4 py-3 flex items-center justify-between max-w-[1720px] w-full mx-auto ${
          isLight ? 'border-slate-200 bg-white/80' : 'border-amber-500/20 bg-slate-950/60'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/30">
            <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <span
              className={`font-black text-sm tracking-wider ${
                isLight
                  ? 'text-slate-900'
                  : 'bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent'
              }`}
            >
              FAROL TRADERS
            </span>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
              FAROL_TRADERS_FORCADOIBOVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shadow-sm ${
              isLight
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30'
            }`}
            title={isLight ? 'Alternar para Tema Escuro' : 'Alternar para Tema Claro'}
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
        </div>
      </header>

      {/* Main Content: Access Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="max-w-xl w-full">
          {/* Card Container */}
          <div
            className={`rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl transition-all ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-slate-300/40'
                : 'bg-slate-900/90 border-amber-500/30 shadow-black/70'
            }`}
          >
            {/* Header of Form */}
            <div
              className={`p-6 border-b text-center relative overflow-hidden ${
                isLight
                  ? 'bg-gradient-to-b from-amber-50/70 to-white border-slate-100'
                  : 'bg-gradient-to-b from-amber-500/10 via-slate-900/40 to-transparent border-slate-800'
              }`}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 mb-3 border border-amber-300">
                <Lock className="w-7 h-7 stroke-[2.2]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                PÁGINA DE ACESSO DO INDICADOR
              </h1>
              <p className={`text-xs mt-1 max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Insira suas credenciais de ativação para liberar o Terminal Quantitativo Farol Traders (Código:{' '}
                <span className="font-mono font-bold text-amber-500">{CHID_INDICADOR_PADRAO}</span>).
              </p>

              {/* Quick Fill Shortcuts */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleLoadActiveLicenseExample}
                  className={`px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1 transition cursor-pointer ${
                    isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/40'
                  }`}
                  title="Carregar licença válida e ativa para testar acesso imediato"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Preencher Licença Vigente (2027)
                </button>
                <button
                  type="button"
                  onClick={handleLoadUserSpecExample}
                  className={`px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1 transition cursor-pointer ${
                    isLight
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                  }`}
                  title="Carregar exemplo da fórmula fornecido na especificação (9/2026)"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Exemplo da Especificação (9/2026)
                </button>
              </div>
            </div>

            {/* Validation Feedback Banner */}
            {validationResult && (
              <div
                className={`p-4 border-b text-xs flex items-start gap-3 transition-all ${
                  validationResult.isValid
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                    : isLight
                    ? 'bg-rose-50 text-rose-900 border-rose-200'
                    : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                }`}
              >
                {validationResult.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-sm">
                    {validationResult.isValid ? 'Acesso Liberado!' : 'Acesso Não Autorizado'}
                  </div>
                  <div className="mt-0.5">{validationResult.mensagem}</div>
                  {validationResult.detalhes && !validationResult.isValid && (
                    <div className="mt-2 pt-2 border-t border-rose-500/20 text-[11px] font-mono space-y-0.5 opacity-90">
                      <div>
                        Chave Recebida:{' '}
                        <span className="font-bold">{validationResult.detalhes.chaveAtivacaoRecebida || '(vazia)'}</span>
                      </div>
                      <div>
                        Chave Calculada:{' '}
                        <span className="font-bold text-amber-500">{validationResult.detalhes.chaveAtivacaoEsperada}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Campo 1: ID_Cliente(COLOQUE AQUI O SEU CPF) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    ID_Cliente (COLOQUE AQUI O SEU CPF)
                  </span>
                  {idCliente && (
                    <span className="text-[11px] font-mono font-medium opacity-70">
                      Formatado: {formatCpf(idCliente)}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={idCliente}
                  onChange={(e) => {
                    setIdCliente(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder="COLOQUE AQUI O SEU CPF (ex: 12345678901)"
                  className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:bg-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Informe os 11 dígitos do seu CPF (pontos e traços são removidos automaticamente).
                </span>
              </div>

              {/* Grid 2 colunas: MesValidade e AnoValidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Campo 2: MesValidade(1-12) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    MesValidade (1-12)
                  </label>
                  <select
                    value={mesValidade}
                    onChange={(e) => {
                      setMesValidade(Number(e.target.value));
                      setValidationResult(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-800/80 border-slate-700 text-slate-100'
                    }`}
                  >
                    <option value={1}>01 - Janeiro</option>
                    <option value={2}>02 - Fevereiro</option>
                    <option value={3}>03 - Março</option>
                    <option value={4}>04 - Abril</option>
                    <option value={5}>05 - Maio</option>
                    <option value={6}>06 - Junho</option>
                    <option value={7}>07 - Julho</option>
                    <option value={8}>08 - Agosto</option>
                    <option value={9}>09 - Setembro</option>
                    <option value={10}>10 - Outubro</option>
                    <option value={11}>11 - Novembro</option>
                    <option value={12}>12 - Dezembro</option>
                  </select>
                </div>

                {/* Campo 3: AnoValidade(AAAA) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    AnoValidade (AAAA)
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2035}
                    value={anoValidade}
                    onChange={(e) => {
                      setAnoValidade(Number(e.target.value));
                      setValidationResult(null);
                    }}
                    placeholder="Ano (AAAA)"
                    className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                        : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:bg-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Campo 4: ChaveAtivacao */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    ChaveAtivacao (Sua Chave de Ativação)
                  </span>
                  {liveCalculatedKey && (
                    <button
                      type="button"
                      onClick={handleApplyCalculatedKey}
                      className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Inserir Chave Calculada
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={chaveAtivacao}
                  onChange={(e) => {
                    setChaveAtivacao(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder="Ex: 111112248148"
                  className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-sm tracking-wide transition focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:bg-slate-800'
                  }`}
                />
              </div>

              {/* Campo 5: ID_Indicador */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    ID_Indicador (Nome do indicador)
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    Código Oficial
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={idIndicador}
                    onChange={(e) => {
                      setIdIndicador(e.target.value);
                      setValidationResult(null);
                    }}
                    placeholder="Nome do indicador (ex: FRPBJCVF)"
                    className={`w-full px-3.5 py-2.5 rounded-lg border font-mono font-bold text-sm tracking-widest transition focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-amber-700 focus:bg-white'
                        : 'bg-slate-800/80 border-slate-700 text-amber-400 focus:bg-slate-800'
                    }`}
                  />
                  {idIndicador !== CHID_INDICADOR_PADRAO && (
                    <button
                      type="button"
                      onClick={() => setIdIndicador(CHID_INDICADOR_PADRAO)}
                      className="absolute right-2.5 top-2.5 text-[10px] text-amber-500 underline cursor-pointer"
                    >
                      Restaurar Padrão
                    </button>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
                >
                  <span>Validar e Acessar Terminal</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>

            {/* Toggle Admin Key Calculator Accordion */}
            <div
              className={`border-t px-6 py-3.5 text-xs transition-colors ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdminGenerator(!showAdminGenerator)}
                  className="flex items-center gap-1.5 font-bold text-amber-500 hover:text-amber-400 transition cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>
                    {showAdminGenerator
                      ? 'Ocultar Calculadora da Fórmula'
                      : 'Ver Fórmula & Gerador de Chave Instantâneo'}
                  </span>
                </button>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5" />
                  <span>Chave Secreta: {CHAVE_SECRETA.toString()}</span>
                </div>
              </div>

              {/* Accordion Content */}
              {showAdminGenerator && (
                <div
                  className={`mt-3 p-3.5 rounded-xl border text-xs space-y-2.5 ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-amber-500 mb-1 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" />
                      Regra de Validação do Indicador:
                    </div>
                    <code
                      className={`block p-2 rounded text-[11px] font-mono whitespace-pre-wrap ${
                        isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-300'
                      }`}
                    >
                      {`CHID_Indicador1 := "FRPBJCVF";
CHAVE_SECRETA := 220714;
ChaveCalculada := (ID_Cliente * MesValidade) + (AnoValidade * 17) + (MesValidade * 3) + (CHAVE_SECRETA * 5);
DataFinalValidade := LastDayOfMonth(AnoValidade, MesValidade);
AcessoLiberado := (ChaveCalculada = ChaveAtivacao) e (CurrentDate <= DataFinalValidade) e (ID_Indicador = CHID_Indicador1);`}
                    </code>
                  </div>

                  {liveCalculatedKey ? (
                    <div
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                        isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">
                          Chave Gerada para CPF {formatCpf(idCliente)} ({mesValidade}/{anoValidade}):
                        </div>
                        <div className="font-mono text-sm font-black text-amber-500 tracking-wider">
                          {liveCalculatedKey}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyCalculatedKey}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition cursor-pointer"
                        >
                          Usar Chave
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[11px]">
                      Preencha um CPF válido no campo acima para gerar a chave de ativação correspondente.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-4 text-center text-xs text-slate-500">
            Farol Traders Pro • Sistema de Proteção e Licenciamento de Algoritmos • Fuso: America/Sao_Paulo (BRT)
          </div>
        </div>
      </main>

      {/* Bottom Info */}
      <footer
        className={`py-3 px-4 text-center text-[11px] border-t ${
          isLight ? 'border-slate-200 text-slate-500 bg-white' : 'border-slate-900 text-slate-600 bg-slate-950'
        }`}
      >
        Farol Traders Quant Terminal — Todos os direitos reservados.
      </footer>
    </div>
  );
};
