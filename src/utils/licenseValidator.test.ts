import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateActivationKey,
  calculateExpirationDate,
  validateLicense,
  sanitizeCpf,
  formatCpf,
  maskCpf,
  CHID_INDICADOR_PADRAO,
} from './licenseValidator';

test('Fórmula Oficial da Chave de Ativação do Usuário', () => {
  // Exemplo fornecido pelo usuário:
  // ID_Cliente: CPF 12345678901
  // MesValidade: 9
  // AnoValidade: 2026
  // ChaveAtivacao esperada: 111112248148
  const cpfExemplo = '12345678901';
  const mes = 9;
  const ano = 2026;
  const chave = calculateActivationKey(cpfExemplo, mes, ano);

  assert.equal(chave, '111112248148', 'A chave calculada deve bater exatamente com o exemplo do usuário 111112248148');
});

test('Cálculo com CPF formatado (máscara de pontos e traço)', () => {
  const cpfFormatado = '123.456.789-01';
  const chave = calculateActivationKey(cpfFormatado, 9, 2026);
  assert.equal(chave, '111112248148');
});

test('Cálculo para outras datas e CPFs', () => {
  // Dezembro de 2026 para o mesmo CPF:
  // (12345678901 * 12) + (2026 * 17) + (12 * 3) + (220714 * 5)
  // = 148148146812 + 34442 + 36 + 1103570 = 148149284860
  const chaveDez = calculateActivationKey('12345678901', 12, 2026);
  assert.equal(chaveDez, '148149284860');

  // Ano de 2027, Mês 12:
  // (12345678901 * 12) + (2027 * 17) + (12 * 3) + (220714 * 5)
  // = 148148146812 + 34459 + 36 + 1103570 = 148149284877
  const chave2027 = calculateActivationKey('12345678901', 12, 2027);
  assert.equal(chave2027, '148149284877');
});

test('Cálculo de Data Final de Validade (Último dia do mês)', () => {
  // Setembro tem 30 dias
  const expSet = calculateExpirationDate(9, 2026);
  assert.equal(expSet.getFullYear(), 2026);
  assert.equal(expSet.getMonth(), 8); // 0-based: 8 = Setembro
  assert.equal(expSet.getDate(), 30);
  assert.equal(expSet.getHours(), 23);
  assert.equal(expSet.getMinutes(), 59);

  // Fevereiro de 2024 (ano bissexto) tem 29 dias
  const expFevBissexto = calculateExpirationDate(2, 2024);
  assert.equal(expFevBissexto.getDate(), 29);

  // Dezembro tem 31 dias
  const expDez = calculateExpirationDate(12, 2026);
  assert.equal(expDez.getDate(), 31);
});

test('Validação de Licença Completa - Caso de Sucesso', () => {
  // Simulando data atual anterior à data de expiração (ex: 15 de agosto de 2026)
  const currentDate = new Date(2026, 7, 15); // 15/08/2026
  const input = {
    idCliente: '12345678901',
    mesValidade: 9,
    anoValidade: 2026,
    chaveAtivacao: '111112248148',
    idIndicador: 'FRPBJCVF',
  };

  const result = validateLicense(input, currentDate);
  assert.equal(result.isValid, true);
  assert.equal(result.status, 'VALIDO');
  assert.ok(result.mensagem.includes('Acesso liberado'));
});

test('Validação de Licença - Chave Incorreta', () => {
  const currentDate = new Date(2026, 7, 15);
  const input = {
    idCliente: '12345678901',
    mesValidade: 9,
    anoValidade: 2026,
    chaveAtivacao: '999999999999', // Chave errada
    idIndicador: 'FRPBJCVF',
  };

  const result = validateLicense(input, currentDate);
  assert.equal(result.isValid, false);
  assert.equal(result.status, 'CHAVE_INCORRETA');
});

test('Validação de Licença - Data Expirada', () => {
  // Se a validade for mês 9/2026 (expira em 30/09/2026 23:59:59)
  // e a data atual for 10 de Outubro de 2026:
  const currentDate = new Date(2026, 9, 10); // 10/10/2026
  const input = {
    idCliente: '12345678901',
    mesValidade: 9,
    anoValidade: 2026,
    chaveAtivacao: '111112248148',
    idIndicador: 'FRPBJCVF',
  };

  const result = validateLicense(input, currentDate);
  assert.equal(result.isValid, false);
  assert.equal(result.status, 'DATA_EXPIRADA');
  assert.ok(result.mensagem.includes('expirou'));
});

test('Validação de Licença - Indicador Inválido', () => {
  const currentDate = new Date(2026, 7, 15);
  const input = {
    idCliente: '12345678901',
    mesValidade: 9,
    anoValidade: 2026,
    chaveAtivacao: '111112248148',
    idIndicador: 'OUTRO_INDICADOR',
  };

  const result = validateLicense(input, currentDate);
  assert.equal(result.isValid, false);
  assert.equal(result.status, 'INDICADOR_INVALIDO');
});

test('Sanitização e Máscara de CPF', () => {
  assert.equal(sanitizeCpf('123.456.789-01'), '12345678901');
  assert.equal(formatCpf('12345678901'), '123.456.789-01');
  assert.equal(maskCpf('12345678901'), '123.***.***-01');
});
