import { Candle, Timeframe } from '../../types';

export interface YahooQuoteMeta {
  symbol: string;
  regularMarketPrice: number;
  chartPreviousClose: number;
  regularMarketChangePercent: number;
  regularMarketTime: number;
}

export class YahooFinanceService {
  private static userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Fetches real-time quote metadata and OHLCV candles from Yahoo Finance v8 chart API.
   */
  public static async fetchChart(
    symbol: string,
    timeframe: Timeframe = '1d'
  ): Promise<{ meta: YahooQuoteMeta | null; candles: Candle[] }> {
    try {
      let interval = '1d';
      let range = '1y';

      if (timeframe === '5m') {
        interval = '5m';
        range = '60d';
      } else if (timeframe === '15m') {
        interval = '15m';
        range = '60d';
      } else if (timeframe === '60m') {
        interval = '60m';
        range = '730d';
      } else {
        interval = '1d';
        range = '1y';
      }

      const encoded = encodeURIComponent(symbol);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=${interval}&range=${range}`;

      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!res.ok) {
        console.warn(`[YahooFinance] Resposta HTTP ${res.status} para ${symbol}`);
        return { meta: null, candles: [] };
      }

      const json = await res.json();
      const result = json.chart?.result?.[0];
      if (!result) {
        return { meta: null, candles: [] };
      }

      const metaRaw = result.meta;
      const timestamps: number[] = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const opens: (number | null)[] = quote.open || [];
      const highs: (number | null)[] = quote.high || [];
      const lows: (number | null)[] = quote.low || [];
      const closes: (number | null)[] = quote.close || [];
      const volumes: (number | null)[] = quote.volume || [];

      const lastValidClose = [...closes].reverse().find((c) => c !== null && c > 0) || metaRaw.regularMarketPrice;
      const prevClose = metaRaw.chartPreviousClose || metaRaw.previousClose || lastValidClose;
      const changePct = prevClose > 0 ? Number((((lastValidClose / prevClose) - 1) * 100).toFixed(2)) : 0;

      const meta: YahooQuoteMeta = {
        symbol: metaRaw.symbol,
        regularMarketPrice: Number((lastValidClose || 0).toFixed(2)),
        chartPreviousClose: Number((prevClose || 0).toFixed(2)),
        regularMarketChangePercent: changePct,
        regularMarketTime: metaRaw.regularMarketTime || Math.floor(Date.now() / 1000),
      };

      const candles: Candle[] = [];
      const nowIso = new Date().toISOString();

      for (let i = 0; i < timestamps.length; i++) {
        const c = closes[i];
        if (c === null || isNaN(c) || c <= 0) continue;
        const o = opens[i] || c;
        const h = highs[i] || Math.max(o, c);
        const l = lows[i] || Math.min(o, c);
        const v = volumes[i] || 0;
        const dateIso = new Date(timestamps[i] * 1000).toISOString();

        candles.push({
          symbol,
          timeframe,
          timestamp: dateIso,
          open: Number(o.toFixed(2)),
          high: Number(h.toFixed(2)),
          low: Number(l.toFixed(2)),
          close: Number(c.toFixed(2)),
          volume: v,
          is_closed: i < timestamps.length - 1,
          source: 'Yahoo Finance Oficial',
          fetched_at: nowIso,
        });
      }

      return { meta, candles };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[YahooFinance] Falha ao obter dados para ${symbol}: ${msg}`);
      return { meta: null, candles: [] };
    }
  }
}
