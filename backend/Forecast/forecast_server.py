#!/usr/bin/env python3
"""
Simple Flask server to serve ML forecast predictions
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os
import time
import datetime

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from dataloader import inference, get_enhanced_forecast
    MODEL_LOADED = True
    print("✅ ML model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load ML model: {e}")
    MODEL_LOADED = False

app = Flask(__name__)
CORS(app)

# Server-side cache for expensive ML computations
forecast_cache = {}
CACHE_DURATION = 3600  # 1 hour cache

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': MODEL_LOADED,
        'timestamp': '2025-08-24'
    })

@app.route('/forecast/<symbol>', methods=['GET'])
def get_forecast(symbol):
    """Get basic forecast direction for a stock symbol"""
    if not MODEL_LOADED:
        return jsonify({
            'error': 'ML model not available',
            'direction': 'HOLD',
            'confidence': 50.0
        }), 503
    
    # Check cache first
    cache_key = f"basic_{symbol}_{datetime.date.today()}"
    if cache_key in forecast_cache:
        cached_data, timestamp = forecast_cache[cache_key]
        if time.time() - timestamp < CACHE_DURATION:
            print(f"Cache hit for {symbol}")
            return jsonify(cached_data)

    try:
        result = inference(symbol.upper())
        # Cache the result
        forecast_cache[cache_key] = (result, time.time())
        print(f"Computed and cached forecast for {symbol}")
        return jsonify(result)
    except Exception as e:
        print(f"Error getting forecast for {symbol}: {e}")
        return jsonify({
            'error': str(e),
            'direction': 'HOLD',
            'confidence': 50.0
        }), 500

@app.route('/forecast/enhanced/<symbol>', methods=['GET'])
def get_enhanced_forecast_api(symbol):
    """Get comprehensive forecast data for a stock symbol"""
    if not MODEL_LOADED:
        return jsonify({
            'error': 'ML model not available',
            'direction': 'HOLD',
            'confidence': 50.0,
            'recommendation': 'HOLD'
        }), 503
    
    # Check cache first
    cache_key = f"enhanced_{symbol}_{datetime.date.today()}"
    if cache_key in forecast_cache:
        cached_data, timestamp = forecast_cache[cache_key]
        if time.time() - timestamp < CACHE_DURATION:
            print(f"Cache hit for enhanced {symbol}")
            return jsonify(cached_data)

    try:
        result = get_enhanced_forecast(symbol.upper())
        # Cache the result
        forecast_cache[cache_key] = (result, time.time())
        print(f"Computed and cached enhanced forecast for {symbol}")
        return jsonify(result)
    except Exception as e:
        print(f"Error getting enhanced forecast for {symbol}: {e}")
        return jsonify({
            'error': str(e),
            'direction': 'HOLD',
            'confidence': 50.0,
            'recommendation': 'HOLD'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting ML Forecast Server...")
    print("📊 Available endpoints:")
    print("   GET /health - Check server health")
    print("   GET /forecast/<symbol> - Get basic forecast")
    print("   GET /forecast/enhanced/<symbol> - Get detailed forecast")
    print("🌐 Server will run on http://localhost:5001")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
