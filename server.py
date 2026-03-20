"""
InSurePay – AI Income Shield
Flask Backend API Server
Endpoints: /register, /risk, /weather, /claim
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import random
import os
from datetime import datetime

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend on different port

# In-memory storage for registered users
registered_users = []


@app.route('/register', methods=['POST'])
def register():
    """Register a new delivery partner."""
    data = request.get_json()

    name = data.get('name', '').strip()
    location = data.get('location', '').strip()
    platform = data.get('platform', '').strip()

    if not name or not location or not platform:
        return jsonify({'error': 'All fields (name, location, platform) are required'}), 400

    user = {
        'id': len(registered_users) + 1,
        'name': name,
        'location': location,
        'platform': platform,
        'registered_at': datetime.now().isoformat(),
        'premium': 29,
        'coverage': 5000
    }
    registered_users.append(user)

    return jsonify({
        'message': f'Welcome to InSurePay, {name}!',
        'user_id': user['id'],
        'premium': user['premium'],
        'coverage': user['coverage']
    }), 201


@app.route('/risk', methods=['GET'])
def get_risk():
    """Get current risk level based on simulated conditions."""
    # Simulate risk assessment based on weighted random factors
    rain = random.randint(0, 100)
    temp = random.randint(22, 48)
    aqi = random.randint(30, 350)

    # Calculate risk score
    score = 0
    if rain > 70:
        score += 3
    elif rain > 40:
        score += 1

    if temp > 42:
        score += 3
    elif temp > 35:
        score += 1

    if aqi > 200:
        score += 3
    elif aqi > 100:
        score += 1

    if score >= 4:
        risk_level = 'High'
    elif score >= 2:
        risk_level = 'Medium'
    else:
        risk_level = 'Low'

    # Simulate Trust Score and Fraud Risk Level for the user
    trust_score = random.randint(40, 100)
    if trust_score >= 80:
        fraud_risk_level = 'Low'
    elif trust_score >= 60:
        fraud_risk_level = 'Medium'
    else:
        fraud_risk_level = 'High'

    return jsonify({
        'risk_level': risk_level,
        'score': score,
        'factors': {
            'rain': rain,
            'temperature': temp,
            'aqi': aqi
        },
        'trust_score': trust_score,
        'fraud_risk_level': fraud_risk_level,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/weather', methods=['GET'])
def get_weather():
    """Get current weather and environmental data."""
    rain = random.randint(0, 100)
    temperature = random.randint(22, 48)
    aqi = random.randint(30, 350)

    # Determine overall advisory
    if rain > 70 or temperature > 42 or aqi > 200:
        advisory = 'High Risk – Stay alert, coverage is active'
    elif rain > 40 or temperature > 35 or aqi > 100:
        advisory = 'Moderate Risk – Proceed with caution'
    else:
        advisory = 'Safe – Favorable conditions for deliveries'

    return jsonify({
        'rain': rain,
        'temperature': temperature,
        'aqi': aqi,
        'advisory': advisory,
        'location': 'Mumbai',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/claim', methods=['GET'])
def get_claim():
    """Simulate an automatic insurance claim due to heavy rain."""
    amount = random.choice([300, 400, 500, 600, 750])

    # Simulate Fraud Risk for this claim
    trust_score = random.randint(40, 100)
    if trust_score >= 80:
        fraud_risk = 'Low'
        status = 'Approved'
        message = f'₹{amount} credited successfully'
    elif trust_score >= 60:
        fraud_risk = 'Medium'
        status = 'Verification Required'
        message = 'Additional verification needed'
    else:
        fraud_risk = 'High'
        status = 'Flagged'
        message = 'Claim flagged for manual review'

    return jsonify({
        'status': status,
        'amount': amount,
        'message': message,
        'trigger': 'Heavy Rain Detected',
        'claim_id': f'CLM-{random.randint(10000, 99999)}',
        'processed_at': datetime.now().isoformat(),
        'fraud_risk': fraud_risk
    })


# Serve frontend static files
@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(BASE_DIR, path)):
        return send_from_directory(BASE_DIR, path)
    return jsonify({'error': 'Not Found'}), 404


if __name__ == '__main__':
    print('=' * 50)
    print('  InSurePay API Server')
    print('  Running on http://localhost:5000')
    print('=' * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
