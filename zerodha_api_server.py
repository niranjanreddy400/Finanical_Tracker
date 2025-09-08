from flask import Flask, jsonify
from flask_cors import CORS
import os
import random

# In a real-world scenario, you would import API keys from a secure config file
# and not expose them directly in the code.
# The `config.py` file is where your real keys should be stored.
try:
    from config import ZERODHA_API_KEY, ZERODHA_API_SECRET
    print("API keys loaded from config.py")
except ImportError:
    print("Warning: config.py not found. Using dummy keys.")
    ZERODHA_API_KEY = "dummy_key"
    ZERODHA_API_SECRET = "dummy_secret"

app = Flask(__name__)
# Enable CORS so your web app can securely call this API.
CORS(app)

# This function simulates fetching real-time data from the Zerodha API.
def get_live_portfolio_data():
    """
    Simulates a call to the Zerodha API to get live portfolio data.
    This function uses dummy data for demonstration purposes.
    In a live application, you would replace this with the actual
    Zerodha API client (e.g., KiteConnect) and use your API keys.
    """
    print(f"Fetching portfolio data using API key: {ZERODHA_API_KEY}")
    
    # Placeholder for live data
    return [
        {
            "symbol": "TCS.NS",
            "quantity": 10,
            "buy_price": 3500.0,
            "current_price": 3500.0 + (random.random() - 0.5) * 100,
            "datePurchased": "2023-01-10",
            "source": "Zerodha"
        },
        {
            "symbol": "INFY.NS",
            "quantity": 25,
            "buy_price": 1400.0,
            "current_price": 1400.0 + (random.random() - 0.5) * 50,
            "datePurchased": "2023-02-20",
            "source": "Zerodha"
        },
    ]

@app.route('/api/portfolio', methods=['GET'])
def portfolio_endpoint():
    """
    An API endpoint that returns a user's live portfolio data.
    """
    try:
        portfolio_data = get_live_portfolio_data()
        return jsonify({
            "status": "success",
            "data": portfolio_data
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Use Gunicorn or a similar production server in a real deployment
    # For a local test, you can run this file directly.
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
    print("Server running on http://0.0.0.0:5000")
