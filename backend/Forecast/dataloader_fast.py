import pandas as pd
import numpy as np 
import datetime
import hashlib

def get_mock_data(symbol):
    """Generate consistent mock forecast data based on symbol hash"""
    # Create a consistent hash for the symbol
    symbol_hash = int(hashlib.md5(symbol.encode()).hexdigest()[:8], 16)
    np.random.seed(symbol_hash % 1000)
    
    # Generate probability based on symbol hash
    probability = 0.3 + (symbol_hash % 1000) / 2500  # 0.3 to 0.7
    direction = "UP" if probability > 0.5 else "DOWN"
    
    # Calculate confidence as how far from 0.5 the probability is
    confidence = abs(probability - 0.5) * 200  # Scale to 0-100%
    confidence = min(max(confidence, 20), 95)  # Keep between 20-95%
    
    return {
        "direction": direction,
        "confidence": round(confidence, 1),
        "probability": round(probability, 3),
        "signal_strength": "Strong" if confidence > 70 else "Moderate" if confidence > 50 else "Weak",
        "source": "fast_mock"
    }

def inference(symbol):
    """Fast inference using mock data instead of slow scraping"""
    try:
        return get_mock_data(symbol)
    except Exception as e:
        print(f"Error in inference for {symbol}: {e}")
        return {
            "direction": "HOLD",
            "confidence": 50.0,
            "probability": 0.5,
            "signal_strength": "Weak",
            "source": "error_fallback"
        }

def get_enhanced_forecast(symbol):
    """Get comprehensive forecast data including technical indicators"""
    try:
        forecast = inference(symbol)
        
        # Generate additional technical metrics
        symbol_hash = int(hashlib.md5(symbol.encode()).hexdigest()[:8], 16)
        np.random.seed(symbol_hash % 1000)  # Consistent results for same symbol
        
        # Technical indicators (mock for now, but consistent)
        rsi = 30 + np.random.random() * 40  # RSI between 30-70
        sma_signal = "Bullish" if forecast["direction"] == "UP" else "Bearish"
        volume_trend = np.random.choice(["Increasing", "Decreasing", "Stable"])
        
        # Risk assessment
        if forecast["direction"] == "UP":
            risk_level = "Low" if forecast["confidence"] > 70 else "Medium"
            recommendation = "BUY" if forecast["confidence"] > 60 else "HOLD"
        else:
            risk_level = "High" if forecast["confidence"] > 70 else "Medium" 
            recommendation = "SELL" if forecast["confidence"] > 60 else "HOLD"
        
        return {
            **forecast,
            "technical_indicators": {
                "rsi": round(rsi, 1),
                "sma_signal": sma_signal,
                "volume_trend": volume_trend
            },
            "risk_level": risk_level,
            "recommendation": recommendation,
            "timeframe": "1-3 days",
            "last_updated": datetime.date.today().strftime("%Y-%m-%d"),
            "source": "fast_mock"
        }
    except Exception as e:
        print(f"Error in enhanced forecast for {symbol}: {e}")
        return {
            "direction": "HOLD",
            "confidence": 50.0,
            "probability": 0.5,
            "signal_strength": "Weak",
            "technical_indicators": {
                "rsi": 50.0,
                "sma_signal": "Neutral",
                "volume_trend": "Stable"
            },
            "risk_level": "Medium",
            "recommendation": "HOLD",
            "timeframe": "1-3 days",
            "last_updated": datetime.date.today().strftime("%Y-%m-%d"),
            "source": "error_fallback"
        }

#just for testing purpose
if __name__ == '__main__':
    print("Basic inference:", inference("NABIL"))
    print("Enhanced forecast:", get_enhanced_forecast("NABIL"))
