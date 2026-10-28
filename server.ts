import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { marketEngine } from './src/server/providers/MarketDataEngine';
import { Timeframe } from './src/types';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'UP',
      service: 'FAROL_TRADERS_FORCADOIBOVE — Monitor de Força IBOVESPA e WINFUT',
      timestamp: new Date().toISOString(),
      timezone: 'America/Sao_Paulo',
    });
  });

  // GET /api/assets
  app.get('/api/assets', (_req: Request, res: Response) => {
    const assets = marketEngine.getAllAssets();
    res.json({
      success: true,
      count: assets.length,
      data: assets,
    });
  });

  // GET /api/index/composition
  app.get('/api/index/composition', (_req: Request, res: Response) => {
    const comp = marketEngine.getIndexComposition();
    res.json({
      success: true,
      data: comp,
    });
  });

  // POST /api/index/composition/import-csv
  app.post('/api/index/composition/import-csv', (req: Request, res: Response) => {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      res.status(400).json({ success: false, message: 'Conteúdo CSV obrigatório.' });
      return;
    }
    const result = marketEngine.importCompositionCSV(csvText);
    res.json(result);
  });

  // GET /api/market/summary
  app.get('/api/market/summary', (_req: Request, res: Response) => {
    const summary = marketEngine.getMarketSummary();
    res.json({
      success: true,
      data: summary,
    });
  });

  // GET /api/market/index/:symbol (IBOV or WINFUT)
  app.get('/api/market/index/:symbol', (req: Request, res: Response) => {
    const symbol = req.params.symbol.toUpperCase() as 'IBOV' | 'WINFUT';
    if (symbol !== 'IBOV' && symbol !== 'WINFUT') {
      res.status(400).json({ success: false, message: 'Símbolo deve ser IBOV ou WINFUT.' });
      return;
    }
    const details = marketEngine.getIndexDetails(symbol);
    res.json({
      success: true,
      data: details,
    });
  });

  // GET /api/market/index/:symbol/candles
  app.get('/api/market/index/:symbol/candles', (req: Request, res: Response) => {
    const symbol = req.params.symbol.toUpperCase() as 'IBOV' | 'WINFUT';
    const tf = (req.query.timeframe as Timeframe) || '1d';
    if (symbol !== 'IBOV' && symbol !== 'WINFUT') {
      res.status(400).json({ success: false, message: 'Símbolo deve ser IBOV ou WINFUT.' });
      return;
    }
    const candles = marketEngine.getIndexCandles(symbol, tf);
    res.json({
      success: true,
      symbol,
      timeframe: tf,
      count: candles.length,
      data: candles,
    });
  });

  // GET /api/market/quotes
  app.get('/api/market/quotes', (_req: Request, res: Response) => {
    const assets = marketEngine.getAllAssets().map((a) => ({
      ticker: a.ticker,
      name: a.name,
      price: a.currentPrice,
      dailyReturn: a.dailyReturn,
      lastUpdate: a.lastUpdate,
      status: a.dataStatus,
    }));
    res.json({
      success: true,
      data: assets,
    });
  });

  // GET /api/market/strength
  app.get('/api/market/strength', (req: Request, res: Response) => {
    const tf = (req.query.timeframe as Timeframe) || '1d';
    const assets = marketEngine.getAllAssets().map((a) => {
      const ind = a.indicatorsByTimeframe[tf] || a.indicatorsByTimeframe['1d'];
      return {
        ticker: a.ticker,
        name: a.name,
        weight: a.weight,
        price: a.currentPrice,
        score: tf === 'multi' ? a.multiperiodScore : ind?.score,
        trend: tf === 'multi' ? a.multiperiodAlignment : ind?.trendState,
        distancePercent: ind?.distancePercent,
        slopePercent: ind?.slopePercent,
        rsi: ind?.rsi14,
        dailyReturn: a.dailyReturn,
      };
    });
    res.json({
      success: true,
      timeframe: tf,
      data: assets,
    });
  });

  // GET /api/market/contributions
  app.get('/api/market/contributions', (_req: Request, res: Response) => {
    const assets = marketEngine.getAllAssets();
    const sorted = [...assets].sort(
      (a, b) => (b.estimatedContribution ?? 0) - (a.estimatedContribution ?? 0)
    );
    const positive = sorted.filter((a) => (a.estimatedContribution ?? 0) > 0);
    const negative = sorted.filter((a) => (a.estimatedContribution ?? 0) < 0).reverse();

    res.json({
      success: true,
      data: {
        positive,
        negative,
        totalContributionSum: Number(
          assets.reduce((acc, a) => acc + (a.estimatedContribution ?? 0), 0).toFixed(3)
        ),
      },
    });
  });

  // GET /api/assets/:ticker
  app.get('/api/assets/:ticker', (req: Request, res: Response) => {
    const ticker = req.params.ticker;
    const asset = marketEngine.getAsset(ticker);
    if (!asset) {
      res.status(404).json({ success: false, message: `Ativo ${ticker} não encontrado.` });
      return;
    }
    res.json({ success: true, data: asset });
  });

  // GET /api/assets/:ticker/candles
  app.get('/api/assets/:ticker/candles', (req: Request, res: Response) => {
    const ticker = req.params.ticker;
    const tf = (req.query.timeframe as Timeframe) || '1d';
    const candles = marketEngine.getCandles(ticker, tf);
    res.json({
      success: true,
      ticker,
      timeframe: tf,
      count: candles.length,
      data: candles,
    });
  });

  // GET /api/assets/:ticker/indicators
  app.get('/api/assets/:ticker/indicators', (req: Request, res: Response) => {
    const ticker = req.params.ticker;
    const asset = marketEngine.getAsset(ticker);
    if (!asset) {
      res.status(404).json({ success: false, message: `Ativo ${ticker} não encontrado.` });
      return;
    }
    res.json({
      success: true,
      ticker,
      indicators: asset.indicatorsByTimeframe,
      multiperiodScore: asset.multiperiodScore,
      multiperiodAlignment: asset.multiperiodAlignment,
    });
  });

  // GET /api/history/strength
  app.get('/api/history/strength', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: marketEngine.getStrengthHistory(),
    });
  });

  // POST /api/refresh
  app.post('/api/refresh', async (req: Request, res: Response) => {
    const { ticker, timeframe } = req.body || {};
    const result = await marketEngine.refreshMarketData({ ticker, timeframe });
    res.json({
      success: true,
      message: 'Cotações e indicadores recalculados com sucesso.',
      result,
    });
  });

  // GET /api/providers/status
  app.get('/api/providers/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: marketEngine.getProviderStatus(),
    });
  });

  // GET /api/settings
  app.get('/api/settings', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: marketEngine.getSettings(),
    });
  });

  // PUT /api/settings
  app.put('/api/settings', (req: Request, res: Response) => {
    const updated = marketEngine.updateSettings(req.body);
    res.json({
      success: true,
      message: 'Configurações atualizadas.',
      data: updated,
    });
  });

  // GET /api/export/csv
  app.get('/api/export/csv', (_req: Request, res: Response) => {
    const csvData = marketEngine.exportMetricsToCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="farol_traders_ibov_winfut.csv"');
    // Add BOM for Excel UTF-8 support
    res.send('\uFEFF' + csvData);
  });

  // Frontend integration via Vite
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FAROL TRADERS] Servidor online em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FAROL TRADERS] Erro ao iniciar servidor:', err);
  process.exit(1);
});
