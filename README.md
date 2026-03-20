# 🚀 InSurePay – AI Income Shield for Gig Workers

## 📌 Problem Statement

India’s delivery partners (Swiggy, Zomato, etc.) depend heavily on daily earnings. External disruptions such as heavy rain, extreme heat, pollution, or curfews can prevent them from working, causing significant income loss.

Currently, there is no system that protects gig workers from such unpredictable financial risks.

---

## 💡 Proposed Solution

InSurePay is an AI-powered parametric insurance platform designed to protect delivery workers from income loss caused by environmental disruptions.

The system automatically detects real-world conditions such as weather and pollution levels and triggers instant payouts without requiring manual claims.

---

## 👤 Target Persona

- Food delivery partners (Swiggy / Zomato)
- Daily wage earners
- Highly dependent on weather conditions
- No existing income protection system

---

## ⚙️ Workflow of the System

1. User registers with name, location, and platform  
2. AI calculates weekly premium based on risk  
3. System continuously monitors environmental data  
4. Disruption detected when thresholds are crossed  
5. Claim is automatically triggered  
6. Instant payout is credited to the user  
7. Dashboard displays claim and earnings status  

---

## 💰 Weekly Pricing Model

The platform uses a weekly subscription model:

| Risk Level | Weekly Premium |
|-----------|--------------|
| Low Risk  | ₹20          |
| Medium Risk | ₹40        |
| High Risk | ₹60          |

Premium is calculated based on:
- Rainfall probability  
- Temperature  
- Air Quality Index (AQI)  
- Location-based risk  

---

## 🌧️ Parametric Triggers

Claims are triggered automatically when:

- Rainfall exceeds threshold  
- Temperature > 40°C  
- AQI > 300  

No manual claim is required.

---

## 🧠 AI/ML Integration

AI is used to:
- Calculate risk score  
- Adjust weekly premium dynamically  
- Detect anomalies in claims  
- Predict high-risk conditions  

Example risk formula:

Risk Score = (Rain × 0.4) + (Temperature × 0.3) + (AQI × 0.3)

---

## 🔐 Adversarial Defense & Anti-Spoofing Strategy

To prevent fraud such as GPS spoofing and coordinated attacks, InSurePay uses a multi-layered defense system.

### 1. Differentiation (Real vs Fake Users)

- Real users show continuous movement patterns  
- Fake users show static or unrealistic jumps  
- Delivery activity is verified before claim approval  

---

### 2. Multi-Source Data Validation

Beyond GPS, the system analyzes:

- GPS movement history  
- Network data (IP, cell tower consistency)  
- Device fingerprinting  
- Activity patterns (speed, motion)  
- Time correlation with weather events  

---

### 3. Fraud Ring Detection

- Detect multiple claims from same location  
- Identify sudden spikes in claims  
- Flag clusters of suspicious accounts  
- Detect synchronized claim behavior  

---

### 4. Risk-Based Claim Scoring

Each claim is assigned a risk level:

- Low Risk → Instant payout  
- Medium Risk → Additional verification  
- High Risk → Flagged for review  

---

### 5. UX Balance (Protecting Genuine Users)

- Genuine users receive instant payouts  
- Only suspicious claims are verified  
- Soft verification for borderline cases  
- Appeal mechanism for false flags  

---

### 6. System Resilience

- Limit claims per zone during extreme events  
- Introduce cooldown periods  
- Monitor real-time anomalies  
- Prevent liquidity drain during attacks  

---

## 🛠️ Tech Stack

- Frontend: Antigravity (UI Builder)  
- Backend: Node.js (Express)  
- Database: MongoDB / Firebase  
- APIs: OpenWeather API  
- AI Model: Rule-based / Python  

---

## 🌐 Platform Choice

A web-based platform is chosen because:
- Easy accessibility  
- Faster development  
- Better dashboard visualization  

---

## 📊 Key Features

- User onboarding system  
- AI-based risk calculation  
- Weekly premium generation  
- Real-time monitoring  
- Automatic claim triggering  
- Instant payout simulation  
- Fraud detection system  

---

## 🎬 Demo

A 2-minute demo video demonstrates:
- Problem  
- Solution  
- Workflow  
- Prototype  

---

## 🚀 Future Scope

- Integration with real delivery platforms  
- Advanced ML-based fraud detection  
- Mobile application  
- Personalized insurance plans  

---

## 🏁 Conclusion

InSurePay provides a scalable and intelligent solution to protect gig workers’ income. By combining AI, automation, and parametric insurance, it ensures fast, fair, and reliable financial protection.
