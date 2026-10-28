"""
Farol Traders - Motor de Indicadores Quantitativos (Python)
Fórmulas padronizadas: SMA200, IFR 14 Wilder, Inclinação, Farol Strength Score.
"""
from typing import List, Optional, Tuple, Dict
import math

def calculate_sma(closes: List[float], period: int = 200) -> Optional[float]:
    if not closes or len(closes) < period:
        return None
    return sum(closes[-period:]) / period

def calculate_sma_offset(closes: List[float], offset: int, period: int = 200) -> Optional[float]:
    if not closes or len(closes) < period + offset:
        return None
    end_idx = len(closes) - offset
    return sum(closes[end_idx - period : end_idx]) / period

def calculate_rsi(closes: List[float], period: int = 14) -> Optional[float]:
    if not closes or len(closes) <= period:
        return None
    
    deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    if len(deltas) < period:
        return None

    avg_gain = sum(d for d in deltas[:period] if d > 0) / period
    avg_loss = sum(abs(d) for d in deltas[:period] if d < 0) / period

    for d in deltas[period:]:
        gain = d if d > 0 else 0.0
        loss = abs(d) if d < 0 else 0.0
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return round(max(0.0, min(100.0, rsi)), 2)

def calculate_distance_percent(price: float, sma200: Optional[float]) -> Optional[float]:
    if sma200 is None or sma200 <= 0 or price <= 0:
        return None
    return round(((price / sma200) - 1.0) * 100.0, 2)

def calculate_slope_percent(sma_curr: Optional[float], sma_prev: Optional[float]) -> Optional[float]:
    if sma_curr is None or sma_prev is None or sma_prev <= 0:
        return None
    return round(((sma_curr / sma_prev) - 1.0) * 100.0, 3)

def classify_slope(slope: Optional[float], timeframe: str) -> str:
    if slope is None:
        return "DADOS INSUFICIENTES"
    threshold = 0.02 if timeframe == "5m" else 0.04 if timeframe == "15m" else 0.08 if timeframe == "60m" else 0.15
    if slope > threshold:
        return "ASCENDENTE"
    if slope < -threshold:
        return "DESCENDENTE"
    return "HORIZONTAL"

def classify_trend_state(
    price: Optional[float],
    sma200: Optional[float],
    dist_pct: Optional[float],
    slope_pct: Optional[float],
    delta: Optional[float],
) -> str:
    if price is None or sma200 is None or dist_pct is None or slope_pct is None:
        return "DADOS INSUFICIENTES"

    if abs(dist_pct) < 0.25 and abs(slope_pct) < 0.05:
        return "NEUTRO"

    d = delta if delta is not None else 0.0

    if dist_pct > 0: # Acima da MM200
        if slope_pct > 0.02 and d > 0.40:
            return "ALTA EM ACELERAÇÃO"
        if d < -0.30:
            return "ALTA PERDENDO FORÇA"
        if slope_pct >= -0.02 and d >= -0.30:
            return "ALTA FORTE"
        return "TRANSIÇÃO"

    if dist_pct < 0: # Abaixo da MM200
        if slope_pct < -0.02 and d < -0.40:
            return "BAIXA EM ACELERAÇÃO"
        if d > 0.30:
            return "BAIXA PERDENDO FORÇA"
        if slope_pct <= 0.02 and d <= 0.30:
            return "BAIXA FORTE"
        return "TRANSIÇÃO"

    return "NEUTRO"

def calculate_farol_strength_score(
    price: Optional[float],
    sma200: Optional[float],
    distance_percent: Optional[float],
    slope_percent: Optional[float],
    distance_delta: Optional[float],
    candle_return: Optional[float],
    rsi: Optional[float],
    closes_recent: Optional[List[float]] = None,
) -> Tuple[Optional[int], float]:
    total_valid_weight = 0.0
    weighted_sum = 0.0

    w_pos, w_slope, w_delta, w_ret, w_rsi, w_dir = 0.20, 0.20, 0.20, 0.15, 0.10, 0.15

    if distance_percent is not None and price is not None and sma200 is not None:
        norm_pos = max(-100.0, min(100.0, distance_percent * 10.0))
        weighted_sum += norm_pos * w_pos
        total_valid_weight += w_pos

    if slope_percent is not None:
        norm_slope = max(-100.0, min(100.0, slope_percent * 200.0))
        weighted_sum += norm_slope * w_slope
        total_valid_weight += w_slope

    if distance_delta is not None:
        norm_delta = max(-100.0, min(100.0, distance_delta * 50.0))
        weighted_sum += norm_delta * w_delta
        total_valid_weight += w_delta

    if candle_return is not None:
        norm_ret = max(-100.0, min(100.0, candle_return * 33.33))
        weighted_sum += norm_ret * w_ret
        total_valid_weight += w_ret

    if rsi is not None:
        rsi_score = (rsi - 50.0) * 2.0
        if rsi > 85: rsi_score = 70.0
        if rsi < 15: rsi_score = -70.0
        weighted_sum += max(-100.0, min(100.0, rsi_score)) * w_rsi
        total_valid_weight += w_rsi

    if closes_recent and len(closes_recent) >= 3:
        up = sum(1 for i in range(1, len(closes_recent)) if closes_recent[i] >= closes_recent[i - 1])
        ratio = up / (len(closes_recent) - 1)
        dir_score = (ratio - 0.5) * 200.0
        weighted_sum += dir_score * w_dir
        total_valid_weight += w_dir

    if total_valid_weight < 0.50:
        return None, total_valid_weight

    score = int(round(max(-100.0, min(100.0, weighted_sum / total_valid_weight))))
    return score, round(total_valid_weight, 2)
