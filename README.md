# MedReach

A full-stack pharma/biotech patient and healthcare-provider (HCP) engagement platform demo.
Features an AI chatbot and advanced ML-based engagement prediction.

## Project Structure

This is a monorepo containing three services:
1. `client/` - React frontend with Tailwind CSS and Recharts
2. `server/` - Express REST API backend with MongoDB
3. `ml-service/` - Python FastAPI microservice for ML predictions

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB (running locally on port 27017 or update `server/.env`)

### 2. Environment Variables
Add your Gemini API key to `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medreach
GEMINI_API_KEY=your_gemini_api_key_here
ML_SERVICE_URL=http://localhost:8000
```

### 3. Installation
Install dependencies for all services:
```bash
npm run install:all
cd ml-service && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

### 4. Setup Data and Models
Seed the database with synthetic recipients and programs:
```bash
npm run seed
```

Train the machine learning models:
```bash
cd ml-service
source venv/bin/activate
python train.py
```

### 5. Run the Application
Start the ML service (in one terminal):
```bash
npm run ml
```

Start the Node backend and React frontend concurrently (in another terminal):
```bash
npm run dev
```

Navigate to `http://localhost:5173` to view the application.

## Features

- **Marketing Landing Page**: High-fidelity B2B SaaS landing page.
- **Recipient CRM**: Manage HCPs and Patients, bulk import via CSV.
- **Cohort Builder**: Filter and segment users based on properties and engagement scores.
- **Outreach Programs**: Build email campaigns targeting specific cohorts.
- **ML Predictions**:
  - Engagement modeling using XGBoost to predict open and click probabilities based on history.
  - Subject line scoring using TF-IDF and hand-crafted NLP features.
  - A/B test simulator to compare subject lines.
  - SHAP value explanations for ML predictions.
- **AI Chatbot**:
  - Gemini-powered assistant with two modes (Internal Marketing, Recipient FAQ).
  - Refuses to answer medical questions in Recipient mode.
  - Summarizes overdue programs and data in Internal mode.
- **Real-Time Analytics**: Dashboard with Recharts visualization for engagement tracking.
