# FAROL TRADERS — MONITOR DE FORÇA DO IBOVESPA E WINFUT

Terminal profissional quantitativo para monitoramento em tempo real de todas as ações que compõem a carteira vigente do Ibovespa, calculando tendência, força da MM200, IFR 14, Farol Strength Score e comparando o comportamento coletivo das ações com o índice à vista (IBOV) e os contratos futuros (WINFUT).

---

## 1. Identidade e Filosofia Operacional

- **Fundo Escuro e Acabamento Institucional**: Interface desenvolvida para alta densidade analítica, com cabeçalho azul-escuro institucional (`#0B132B`), realces em ouro/âmbar (`#F59E0B`), verde comprador (`#10B981`) e vermelho vendedor (`#F43F5E`).
- **Fatos Calculados vs Previsões**: O sistema apresenta métricas estritamente matemáticas e interpretações técnicas, sem emitir ordens automáticas nem promessas de ganhos.
- **Fuso Horário Oficial**: `America/Sao_Paulo` (Horário de Brasília).

---

## 2. Metodologia Quantitativa dos Indicadores

### 2.1 Média Móvel Simples de 200 Períodos (MM200)
- Exige estritamente **no mínimo 200 candles válidos** na periodicidade avaliada (5m, 15m, 60m ou Diário). Caso contrário, exibe `"Histórico Insuficiente para MM200"`.
- Fórmula:
  $$\text{SMA200} = \frac{1}{200} \sum_{i=0}^{199} \text{Fechamento}_{t-i}$$

### 2.2 Distância Percentual da MM200
- Mede o afastamento do preço atual em relação à média móvel de 200 períodos:
  $$\text{Distância (\%)} = \left(\frac{\text{Fechamento}}{\text{SMA200}} - 1\right) \times 100$$

### 2.3 Inclinação da MM200
- Avalia a variação percentual da média em relação a $N$ candles anteriores (configurável, padrão = 5):
  $$\text{Inclinação (\%)} = \left(\frac{\text{SMA200}_t}{\text{SMA200}_{t-N}} - 1\right) \times 100$$
- Classificada em:
  - **ASCENDENTE**: $\text{Inclinação} > \text{limiar}$
  - **DESCENDENTE**: $\text{Inclinação} < -\text{limiar}$
  - **HORIZONTAL**: dentro da faixa de tolerância.

### 2.4 Evolução da Distância (Delta)
$$\Delta \text{Distância} = \text{Distância Atual} - \text{Distância}_{t-N}$$
- Permite detectar aceleração de tendência (afastamento) ou exaustão/aproximação da média.

### 2.5 Classificação de Tendência (9 Estados Técnicos)
1. **ALTA FORTE**: Preço acima da MM200, inclinação positiva e distância estável ou crescente.
2. **ALTA PERDENDO FORÇA**: Preço acima da MM200, mas distância diminuindo de maneira relevante.
3. **ALTA EM ACELERAÇÃO**: Preço acima da MM200, inclinação positiva e rápido aumento da distância.
4. **BAIXA FORTE**: Preço abaixo da MM200, inclinação negativa e distância estável ou aumentando em módulo.
5. **BAIXA PERDENDO FORÇA**: Preço abaixo da MM200, mas distância negativa contraindo em direção à média.
6. **BAIXA EM ACELERAÇÃO**: Preço abaixo da MM200, inclinação negativa e rápido aumento da distância negativa.
7. **NEUTRO**: Preço muito próximo da MM200 ou sem direção consistente.
8. **TRANSIÇÃO**: Conflito entre posição do preço, inclinação e evolução da distância.
9. **DADOS INSUFICIENTES**: Histórico menor que 200 candles.

### 2.6 IFR de 14 Períodos (Wilder's RSI)
- Calculado pelo método de suavização exponencial de Welles Wilder:
  - $> 70$: Sobrecompra.
  - $60 \text{ a } 70$: Força compradora elevada.
  - $40 \text{ a } 60$: Zona intermediária / neutra.
  - $30 \text{ a } 40$: Pressão vendedora elevada.
  - $< 30$: Sobrevenda.

### 2.7 Farol Strength Score (-100 a +100)
Indicador proprietário multivariado que normaliza e pondera 6 dimensões:
1. Posição em relação à MM200 (20%)
2. Inclinação da MM200 (20%)
3. Evolução da distância / Delta (20%)
4. Retorno normalizado (15%)
5. IFR contextual (10%)
6. Consistência direcional recente (15%)

Classificação do Score:
- $+60 \text{ a } +100$: Força Compradora Forte
- $+20 \text{ a } +59$: Força Compradora Moderada
- $-19 \text{ a } +19$: Neutro / Indefinido
- $-59 \text{ a } -20$: Força Vendedora Moderada
- $-100 \text{ a } -60$: Força Vendedora Forte

### 2.8 Consolidação Multiperíodo
Combina as 4 periodicidades operacionais:
- Diário (40% de peso)
- 60 Minutos (30% de peso)
- 15 Minutos (20% de peso)
- 5 Minutos (10% de peso)

Sinaliza:
- `ALINHAMENTO COMPRADOR`
- `ALINHAMENTO VENDEDOR`
- `CONFLITO MULTIPERÍODO`
- `REVERSÃO EM OBSERVAÇÃO`

### 2.9 Contribuição Estimada para o Ibovespa
$$\text{Contribuição Estimada (pontos \%)} \approx \frac{\text{Peso na Carteira (\%)} \times \text{Retorno do Ativo (\%)}}{100}$$

---

## 3. Estrutura do Projeto

```
farol-traders/
├── backend/                  # Backend Python + FastAPI
│   ├── api/main.py           # Endpoints REST FastAPI
│   ├── indicators/engine.py  # Indicadores em Python
│   ├── models/schemas.py     # Modelos de dados e schemas Pydantic
│   ├── tests/test_engine.py  # Testes unitários do motor Python
│   └── requirements.txt      # Dependências Python
├── src/                      # Frontend React + TypeScript
│   ├── components/           # Componentes modulares
│   │   ├── Header.tsx        # Cabeçalho Farol Traders + Cotações + Fuso BRT
│   │   ├── DashboardCards.tsx# Cards de amplitude, alinhamento e IBOV/WINFUT
│   │   ├── InteractiveCharts.tsx # 6 Gráficos interativos em Apache ECharts
│   │   ├── AssetsTable.tsx   # Tabela ordenável com filtros e multiperíodo
│   │   ├── AssetDetailModal.tsx # Detalhamento individual com Candles + MM200
│   │   ├── SettingsModal.tsx # Configuração de pesos dos scores
│   │   └── ImportPortfolioModal.tsx # Importação de carteira via CSV
│   ├── indicators/           # Motor de cálculo em TypeScript
│   │   ├── calculations.ts   # Fórmulas puras e desacopladas
│   │   └── calculations.test.ts # 12 testes unitários (node:test)
│   ├── data/                 # Composição oficial da B3
│   ├── server/providers/     # Cache de candles e motor de agregação
│   ├── types/index.ts        # Interfaces e tipos do domínio
│   ├── App.tsx               # Aplicação principal
│   ├── main.tsx              # Ponto de entrada React
│   └── index.css             # Tailwind CSS e estilos institucionais
├── server.ts                 # Servidor Full-Stack Express + Vite
├── package.json              # Scripts e dependências Node
├── tsconfig.json             # Configuração TypeScript
└── README.md                 # Documentação técnica
```

---

## 4. Como Executar

### 4.1 Ambiente de Desenvolvimento (Full-Stack TypeScript + React)
```bash
# 1. Instalar dependências
npm install

# 2. Executar testes unitários das fórmulas de indicadores
npm test

# 3. Iniciar o terminal em modo de desenvolvimento (Porta 3000)
npm run dev
```

Acesse no navegador: `http://localhost:3000`

### 4.2 Execução do Backend Python FastAPI (Opcional para ambiente Python)
```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar requisitos
pip install -r backend/requirements.txt

# Executar testes unitários em Python
python3 backend/tests/test_engine.py

# Iniciar o servidor FastAPI
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 5. Estratégia de Fontes de Dados e Contingência

1. **Camada de Provedores Desacoplada**: A arquitetura normaliza candles e cotações sob uma mesma interface (`Candle`, `AssetMetrics`).
2. **Histórico Mínimo Garantido**: O motor mantém em cache séries contínuas com mais de 220 candles por periodicidade para cada ação do Ibovespa, garantindo que o cálculo da MM200 e do IFR 14 nunca quebre por ausência de dados.
3. **Contingência e Tratamento de Falhas**:
   - Dados ausentes são rotulados explicitamente como `"Histórico Insuficiente"` ou `"Score Indisponível"`, nunca substituídos por zeros artificiais.
   - Os pesos da carteira são derivados da composição oficial da B3 e normalizados para 100%.
   - É possível importar nova carteira a qualquer momento colando ou enviando arquivo CSV no botão **Carteira**.
