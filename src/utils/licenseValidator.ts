/**
 * Validador e Gerador de Licença do Indicador Farol Traders
 *
 * Fórmula oficial solicitada pelo usuário:
 * CHID_Indicador1 := "FRPBJCVF";
 * CHAVE_SECRETA := 220714;
 * ChaveCalculada := (ID_Cliente * MesValidade) + (AnoValidade * 17) + (MesValidade * 3) + (CHAVE_SECRETA * 5);
 * DataFinalValidade := calcDate(Eldate(AnoValidade,MesValidade,1),LastDayOfMonth(MesValidade));
 * AcessoLiberado := (ChaveCalculada = ChaveAtivacao) e (CurrentDate <= DataFinalValidade) e (ID_Indicador = CHID_Indicador1);
 */

export const CHID_INDICADOR_PADRAO = 'FRPBJCVF';
export const CHAVE_SECRETA = 220714n;

export interface LicenseInput {
  idCliente: string; // CPF (com ou sem formatação)
  mesValidade: number; // 1 - 12
  anoValidade: number; // AAAA (ex: 2026)
  chaveAtivacao: string; // Ex: 111112248148
  idIndicador: string; // Ex: "FRPBJCVF"
}

export interface LicenseValidationResult {
  isValid: boolean;
  chaveCalculada: string;
  dataFinalValidade: Date;
  status: 'VALIDO' | 'CHAVE_INCORRETA' | 'DATA_EXPIRADA' | 'INDICADOR_INVALIDO' | 'CPF_INVALIDO';
  mensagem: string;
  detalhes?: {
    idClienteNum: string;
    mesValidade: number;
    anoValidade: number;
    chaveAtivacaoEsperada: string;
    chaveAtivacaoRecebida: string;
    dataExpiracaoFormatada: string;
    diasRestantes: number;
  };
}

/**
 * Remove caracteres não numéricos do CPF
 */
export function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '').trim();
}

/**
 * Formata CPF para exibição amigável: 000.000.000-00
 */
export function formatCpf(cpf: string): string {
  const clean = sanitizeCpf(cpf);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

/**
 * Mascara o CPF para privacidade: 123.***.***-01
 */
export function maskCpf(cpf: string): string {
  const clean = sanitizeCpf(cpf);
  if (clean.length < 11) return cpf;
  return `${clean.slice(0, 3)}.***.***-${clean.slice(9, 11)}`;
}

/**
 * Calcula a Chave de Ativação exata de acordo com a fórmula:
 * ChaveCalculada := (ID_Cliente * MesValidade) + (AnoValidade * 17) + (MesValidade * 3) + (CHAVE_SECRETA * 5)
 */
export function calculateActivationKey(
  idClienteRaw: string | number | bigint,
  mesValidade: number,
  anoValidade: number
): string {
  const cleanCpf = typeof idClienteRaw === 'string' ? sanitizeCpf(idClienteRaw) : idClienteRaw.toString();
  if (!cleanCpf || !/^\d+$/.test(cleanCpf)) {
    throw new Error('ID_Cliente (CPF) inválido: deve conter apenas números.');
  }

  const idCliente = BigInt(cleanCpf);
  const mes = BigInt(mesValidade);
  const ano = BigInt(anoValidade);

  // ChaveCalculada := (ID_Cliente * MesValidade) + (AnoValidade * 17) + (MesValidade * 3) + (CHAVE_SECRETA * 5);
  const parte1 = idCliente * mes;
  const parte2 = ano * 17n;
  const parte3 = mes * 3n;
  const parte4 = CHAVE_SECRETA * 5n;

  const total = parte1 + parte2 + parte3 + parte4;
  return total.toString();
}

/**
 * Calcula a data limite final da validade:
 * Último dia do mês indicado às 23:59:59.999
 */
export function calculateExpirationDate(mesValidade: number, anoValidade: number): Date {
  // Em JS, new Date(ano, mes, 0) retorna o último dia do mês especificado (1-based)
  return new Date(anoValidade, mesValidade, 0, 23, 59, 59, 999);
}

/**
 * Validação completa da licença
 * AcessoLiberado := (ChaveCalculada = ChaveAtivacao) e (CurrentDate <= DataFinalValidade) e (ID_Indicador = CHID_Indicador1)
 */
export function validateLicense(
  input: LicenseInput,
  currentDate: Date = new Date()
): LicenseValidationResult {
  const cleanCpf = sanitizeCpf(input.idCliente);

  if (!cleanCpf || cleanCpf.length < 11) {
    return {
      isValid: false,
      chaveCalculada: '',
      dataFinalValidade: new Date(0),
      status: 'CPF_INVALIDO',
      mensagem: 'ID_Cliente inválido. Insira um CPF completo com 11 dígitos numéricos.',
    };
  }

  if (input.mesValidade < 1 || input.mesValidade > 12) {
    return {
      isValid: false,
      chaveCalculada: '',
      dataFinalValidade: new Date(0),
      status: 'DATA_EXPIRADA',
      mensagem: 'Mês de Validade deve estar entre 1 e 12.',
    };
  }

  if (input.anoValidade < 2000 || input.anoValidade > 2100) {
    return {
      isValid: false,
      chaveCalculada: '',
      dataFinalValidade: new Date(0),
      status: 'DATA_EXPIRADA',
      mensagem: 'Ano de Validade inválido (deve ser no formato AAAA).',
    };
  }

  // 1. Validar ID_Indicador
  const normalizedIndicador = (input.idIndicador || '').trim().toUpperCase();
  if (normalizedIndicador !== CHID_INDICADOR_PADRAO) {
    return {
      isValid: false,
      chaveCalculada: '',
      dataFinalValidade: new Date(0),
      status: 'INDICADOR_INVALIDO',
      mensagem: `Nome do Indicador inválido. O identificador deve ser exatamente "${CHID_INDICADOR_PADRAO}".`,
    };
  }

  // 2. Calcular chave esperada
  const chaveCalculada = calculateActivationKey(cleanCpf, input.mesValidade, input.anoValidade);
  const chaveRecebida = (input.chaveAtivacao || '').trim().replace(/\D/g, '');

  // 3. Calcular data final de validade
  const dataFinalValidade = calculateExpirationDate(input.mesValidade, input.anoValidade);
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dataFinalValidade);

  const diffMs = dataFinalValidade.getTime() - currentDate.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // 4. Comparar Chave Calculada com Chave de Ativação
  if (chaveCalculada !== chaveRecebida) {
    return {
      isValid: false,
      chaveCalculada,
      dataFinalValidade,
      status: 'CHAVE_INCORRETA',
      mensagem: 'Chave de Ativação incorreta para este CPF e período de validade.',
      detalhes: {
        idClienteNum: cleanCpf,
        mesValidade: input.mesValidade,
        anoValidade: input.anoValidade,
        chaveAtivacaoEsperada: chaveCalculada,
        chaveAtivacaoRecebida: chaveRecebida,
        dataExpiracaoFormatada: dataFormatada,
        diasRestantes,
      },
    };
  }

  // 5. Verificar se data é válida (CurrentDate <= DataFinalValidade)
  if (currentDate.getTime() > dataFinalValidade.getTime()) {
    return {
      isValid: false,
      chaveCalculada,
      dataFinalValidade,
      status: 'DATA_EXPIRADA',
      mensagem: `A licença expirou em ${dataFormatada}. Renove seu acesso para continuar utilizando o indicador.`,
      detalhes: {
        idClienteNum: cleanCpf,
        mesValidade: input.mesValidade,
        anoValidade: input.anoValidade,
        chaveAtivacaoEsperada: chaveCalculada,
        chaveAtivacaoRecebida: chaveRecebida,
        dataExpiracaoFormatada: dataFormatada,
        diasRestantes,
      },
    };
  }

  // Acesso Liberado com sucesso!
  return {
    isValid: true,
    chaveCalculada,
    dataFinalValidade,
    status: 'VALIDO',
    mensagem: `Acesso liberado com sucesso! Licença válida até ${dataFormatada} (${diasRestantes} dias restantes).`,
    detalhes: {
      idClienteNum: cleanCpf,
      mesValidade: input.mesValidade,
      anoValidade: input.anoValidade,
      chaveAtivacaoEsperada: chaveCalculada,
      chaveAtivacaoRecebida: chaveRecebida,
      dataExpiracaoFormatada: dataFormatada,
      diasRestantes,
    },
  };
}

// Persistência de Sessão de Licença
const STORAGE_KEY = 'farol_license_session';

export interface StoredLicenseSession {
  idCliente: string;
  mesValidade: number;
  anoValidade: number;
  chaveAtivacao: string;
  idIndicador: string;
  validadoEm: string;
}

export function saveLicenseSession(input: LicenseInput): void {
  if (typeof window === 'undefined') return;
  const session: StoredLicenseSession = {
    idCliente: sanitizeCpf(input.idCliente),
    mesValidade: input.mesValidade,
    anoValidade: input.anoValidade,
    chaveAtivacao: input.chaveAtivacao.trim(),
    idIndicador: input.idIndicador.trim(),
    validadoEm: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getStoredLicenseSession(): StoredLicenseSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredLicenseSession;
  } catch {
    return null;
  }
}

export function clearLicenseSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
