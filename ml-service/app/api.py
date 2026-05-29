from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.model import forecast_prices
import pandas as pd

router = APIRouter()

class DataPoint(BaseModel):
    timestamp: str
    price: float

class ForecastRequest(BaseModel):
    data: List[DataPoint]

@router.post("/forecast")
def get_forecast(request: ForecastRequest):
    if len(request.data) < 5:
        raise HTTPException(status_code=400, detail="Not enough data points for forecasting. Minimum 5 required.")
    
    try:
        predictions = forecast_prices(request.data)
        return {"forecast": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
