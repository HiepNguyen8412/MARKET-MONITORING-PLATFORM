import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np
from datetime import datetime, timedelta

def forecast_prices(data_points):
    df = pd.DataFrame([dp.dict() for dp in data_points])
    
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Convert timestamps to numeric values (seconds since start) for simple regression
    min_time = df['timestamp'].min()
    df['time_sec'] = (df['timestamp'] - min_time).dt.total_seconds()
    
    X = df[['time_sec']]
    y = df['price']
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict next 5 intervals (assume 5-second intervals based on backend mock data engine)
    last_time = df['time_sec'].max()
    last_timestamp = df['timestamp'].max()
    
    future_times_sec = []
    future_timestamps = []
    
    for i in range(1, 6):
        future_times_sec.append(last_time + i * 5)
        future_timestamps.append((last_timestamp + timedelta(seconds=i * 5)).isoformat())
        
    X_future = pd.DataFrame({'time_sec': future_times_sec})
    predictions = model.predict(X_future)
    
    results = []
    for i in range(5):
        results.append({
            "timestamp": future_timestamps[i] + "Z", # Adding Z to indicate UTC for frontend
            "price": float(predictions[i])
        })
        
    return results
