"""
InSurePay - AI Income Shield
Flask Backend API Server
Endpoints: /register, /risk, /weather, /claim
"""

from datetime import datetime
import os
import random

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
CORS(app)

# In-memory storage for registered users
registered_users = []


def generate_environment_factors():
    """Generate simulated environmental inputs."""
    return {
        'rain': random.randint(0, 100),
        'temperature': random.randint(22, 48),
        'aqi': random.randint(30, 350)
    }


def calculate_risk_metrics(rain, temp, aqi):
    """Calculate weighted risk score, premium, and trigger details."""
    risk_score = round((rain * 0.4) + (temp * 0.3) + (aqi * 0.3), 2)

    if risk_score >= 70:
        risk_level = 'High'
        premium = 60
    elif risk_score >= 40:
        risk_level = 'Medium'
        premium = 40
    else:
        risk_level = 'Low'
        premium = 20

    trigger_types = []
    if rain > 70:
        trigger_types.append('Rain')
    if temp > 42:
        trigger_types.append('Heat')
    if aqi > 200:
        trigger_types.append('AQI')

    return {
        'risk_score': risk_score,
        'risk_level': risk_level,
        'premium': premium,
        'trigger_status': bool(trigger_types),
        'trigger_type': ' / '.join(trigger_types) if trigger_types else None
    }


@app.route('/register', methods=['POST'])
def register():
    """Register a new delivery partner."""
    data = request.get_json() or {}

    name = data.get('name', '').strip()
    location = data.get('location', '').strip()
    platform = data.get('platform', '').strip()

    if not name or not location or not platform:
        return jsonify({'error': 'All fields (name, location, platform) are required'}), 400

    factors = generate_environment_factors()
    metrics = calculate_risk_metrics(
        factors['rain'],
        factors['temperature'],
        factors['aqi']
    )

    user = {
        'id': len(registered_users) + 1,
        'name': name,
        'location': location,
        'platform': platform,
        'registered_at': datetime.now().isoformat(),
        'premium': metrics['premium'],
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
    factors = generate_environment_factors()
    metrics = calculate_risk_metrics(
        factors['rain'],
        factors['temperature'],
        factors['aqi']
    )

    trust_score = random.randint(40, 100)
    if trust_score >= 80:
        fraud_risk_level = 'Low'
    elif trust_score >= 60:
        fraud_risk_level = 'Medium'
    else:
        fraud_risk_level = 'High'

    return jsonify({
        'risk_level': metrics['risk_level'],
        'score': metrics['risk_score'],
        'risk_score': metrics['risk_score'],
        'premium': metrics['premium'],
        'factors': {
            'rain': factors['rain'],
            'temperature': factors['temperature'],
            'aqi': factors['aqi']
        },
        'trigger_status': metrics['trigger_status'],
        'trigger_type': metrics['trigger_type'],
        'trust_score': trust_score,
        'fraud_risk_level': fraud_risk_level,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/weather', methods=['GET'])
def get_weather():
    """Get current weather and environmental data."""
    factors = generate_environment_factors()
    rain = factors['rain']
    temperature = factors['temperature']
    aqi = factors['aqi']
    metrics = calculate_risk_metrics(rain, temperature, aqi)

    if metrics['trigger_status']:
        advisory = 'High Risk - Stay alert, coverage is active'
    elif rain > 40 or temperature > 35 or aqi > 100:
        advisory = 'Moderate Risk - Proceed with caution'
    else:
        advisory = 'Safe - Favorable conditions for deliveries'

    return jsonify({
        'rain': rain,
        'temperature': temperature,
        'aqi': aqi,
        'risk_level': metrics['risk_level'],
        'risk_score': metrics['risk_score'],
        'premium': metrics['premium'],
        'trigger_status': metrics['trigger_status'],
        'trigger_type': metrics['trigger_type'],
        'advisory': advisory,
        'location': 'Mumbai',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/claim', methods=['GET'])
def get_claim():
    """Simulate an automatic insurance claim for an active trigger."""
    amount = random.choice([300, 400, 500, 600, 750])
    trigger = request.args.get('trigger_type', 'Heavy Rain Detected')

    trust_score = random.randint(40, 100)
    if trust_score >= 80:
        fraud_risk = 'Low'
        status = 'Approved'
        message = f'Rs.{amount} credited successfully'
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
        'trigger': trigger,
        'claim_id': f'CLM-{random.randint(10000, 99999)}',
        'processed_at': datetime.now().isoformat(),
        'fraud_risk': fraud_risk
    })


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
