"""
Farol Traders - Modelos de Dados e Schemas Pydantic / SQLAlchemy
"""
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class Candle(BaseModel):
    symbol: str
    timeframe: str # '5m', '15m', '60m', '1d'
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    is_closed: bool = True
    source: str = "B3_YAHOO"
    fetched_at: datetime = Field(default_factory=datetime.utcnow)

class TimeframeIndicators(BaseModel):
    sma200: Optional[float] = None
    distance_percent: Optional[float] = None
    slope_percent: Optional[float] = None
    slope_classification: str = "DADOS INSUFICIENTES"
    distance_evolution_delta: Optional[float] = None
    trend_state: str = "DADOS INSUFICIENTES"
    rsi14: Optional[float] = None
    rsi_classification: str = "DADOS INSUFICIENTES"
    candle_return: Optional[float] = None
    score: Optional[int] = None
    score_coverage: float = 0.0
    candle_count: int = 0
    has_sufficient_history: bool = False
    last_candle_timestamp: Optional[datetime] = None

class AssetMetrics(BaseModel):
    ticker: str
    name: str
    weight: float
    current_price: Optional[float] = None
    previous_close: Optional[float] = None
    daily_return: Optional[float] = None
    estimated_contribution: Optional[float] = None
    intradiary_pressure: Optional[float] = None
    indicators_by_timeframe: Dict[str, TimeframeIndicators] = {}
    multiperiod_score: Optional[int] = None
    multiperiod_alignment: str = "DADOS INSUFICIENTES"
    last_update: datetime = Field(default_factory=datetime.utcnow)
    data_status: str = "VALID"
    source: str = "B3_YAHOO"

class MarketSummary(BaseModel):
    ibov_price: Optional[float]
    ibov_change_percent: Optional[float]
    winfut_contract: str
    winfut_price: Optional[float]
    winfut_change_percent: Optional[float]
    winfut_basis: Optional[float]
    percent_above_mm200_daily: float
    percent_below_mm200_daily: float
    count_bull_strength: int
    count_bear_strength: int
    count_overbought: int
    count_oversold: int
    aggregate_market_score: int
    market_alignment: str
    valid_assets_coverage: float
    valid_assets_count: int
    total_assets_count: int
    confirmation_status: str
    last_success_update: datetime = Field(default_factory=datetime.utcnow)
