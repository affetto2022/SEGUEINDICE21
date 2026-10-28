import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.indicators.engine import (
    calculate_sma,
    calculate_rsi,
    calculate_distance_percent,
    calculate_slope_percent,
    classify_trend_state,
    calculate_farol_strength_score,
)

def test_sma():
    assert calculate_sma([1.0] * 199, 200) is None
    assert calculate_sma([50.0] * 200, 200) == 50.0

def test_distance():
    assert calculate_distance_percent(110.0, 100.0) == 10.0
    assert calculate_distance_percent(90.0, 100.0) == -10.0

def test_slope():
    assert calculate_slope_percent(102.0, 100.0) == 2.0

def test_trend():
    assert classify_trend_state(35.0, 30.0, 16.67, 0.05, 0.10) == "ALTA FORTE"
    assert classify_trend_state(25.0, 30.0, -16.67, -0.05, -0.10) == "BAIXA FORTE"

def test_farol_score():
    score, cov = calculate_farol_strength_score(
        price=45.0,
        sma200=40.0,
        distance_percent=12.5,
        slope_percent=0.35,
        distance_delta=0.8,
        candle_return=2.5,
        rsi=68.0,
        closes_recent=[42.0, 43.0, 44.0, 45.0]
    )
    assert score is not None
    assert score >= 60

if __name__ == '__main__':
    test_sma()
    test_distance()
    test_slope()
    test_trend()
    test_farol_score()
    print("Todos os testes em Python passaram com sucesso!")
