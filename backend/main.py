"""
Farol Traders - API Backend FastAPI (Python)
Executável via: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
"""
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
from datetime import datetime

from backend.models.schemas import AssetMetrics, MarketSummary, Candle
from backend.indicators.engine import (
    calculate_sma,
    calculate_rsi,
    calculate_distance_percent,
    calculate_slope_percent,
    classify_slope,
    classify_trend_state,
    calculate_farol_strength_score,
)

app = FastAPI(
    title="Farol Traders API",
    description="Motor quantitativo de força do IBOVESPA e WINFUT (B3)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulação de base em memória / persistência local
@app.get("/api/health")
def health_check():
    return {
        "status": "UP",
        "service": "Farol Traders FastAPI",
        "timestamp": datetime.utcnow().isoformat(),
        "timezone": "America/Sao_Paulo"
    }

@app.get("/api/market/summary")
def get_market_summary():
    return {
        "ibov": {
            "price": 131840.50,
            "changePercent": 0.65,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "^BVSP B3"
        },
        "winfut": {
            "contract": "WINZ26",
            "price": 132680.0,
            "changePercent": 0.78,
            "maturity": "16/12/2026",
            "basis": 839.5
        },
        "aggregateMarketScore": 34,
        "marketAlignment": "ALINHAMENTO COMPRADOR",
        "confirmationStatus": "WINFUT sobe e cesta fortalece (Confirmação Compradora)",
        "percentAboveMM200Daily": 68.4,
        "validAssetsCoverage": 100.0
    }

@app.get("/api/assets")
def get_assets():
    return {
        "success": True,
        "message": "Endpoints operacionais conectados com a camada quantitativa Farol Traders."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
