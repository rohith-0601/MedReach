from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import shap
from typing import List, Optional

app = FastAPI(title="MedReach ML Service")

# Load models
try:
    eng_model = joblib.load('models/engagement_model.joblib')
    eng_features = joblib.load('models/engagement_features.joblib')
    sub_model = joblib.load('models/subject_line_model.joblib')
    
    # Initialize SHAP explainer
    if type(eng_model).__name__ in ['RandomForestClassifier', 'XGBClassifier']:
        explainer = shap.TreeExplainer(eng_model)
    else:
        # Fallback if LogisticRegression: requires a non-empty background dataset
        background_data = pd.DataFrame(np.zeros((1, len(eng_features))), columns=eng_features)
        explainer = shap.LinearExplainer(eng_model, background_data)
        
    print("Models loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load models. Did you run train.py? Error: {e}")
    eng_model = None
    sub_model = None


class EngagementRequest(BaseModel):
    recipientType: str
    engagementScore: float
    daysSinceLastOpen: float
    daysSinceLastClick: float
    interactionFrequency: float
    therapyArea: str
    tenureDays: float

class SubjectLineRequest(BaseModel):
    subject: str
    programType: Optional[str] = None

class ABTestRequest(BaseModel):
    subjectA: str
    subjectB: str

@app.post("/predict/engagement")
async def predict_engagement(req: EngagementRequest):
    if eng_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
        
    # Construct feature vector matching training data
    features_dict = {
        'score': req.engagementScore,
        'days_since_last_open': req.daysSinceLastOpen,
        'days_since_last_click': req.daysSinceLastClick,
        'interaction_frequency': req.interactionFrequency,
        'tenure_days': req.tenureDays,
        'recipient_type_Patient': 1 if req.recipientType == 'Patient' else 0,
        'therapy_area_Metabolic Health Program': 1 if req.therapyArea == 'Metabolic Health Program' else 0,
        'therapy_area_None': 1 if req.therapyArea == 'None' else 0,
        'therapy_area_Respiratory Care Program': 1 if req.therapyArea == 'Respiratory Care Program' else 0
    }
    
    # Ensure all features are present in the correct order
    x_input = pd.DataFrame([{col: features_dict.get(col, 0) for col in eng_features}])
    
    # Predict
    prob = eng_model.predict_proba(x_input)[0][1]
    
    # Determine tier
    if prob >= 0.7: tier = "high"
    elif prob >= 0.4: tier = "medium"
    else: tier = "low"
    
    # SHAP explanations
    top_factors = []
    try:
        shap_values = explainer.shap_values(x_input)
        if isinstance(shap_values, list): # For some tree models, it returns a list per class
             shap_values = shap_values[1]
             
        # Get top 3 factors
        shap_vals = shap_values[0]
        feature_importance = list(zip(eng_features, shap_vals))
        feature_importance.sort(key=lambda x: abs(x[1]), reverse=True)
        
        # Map raw feature names to human-readable ones
        readable_names = {
            'score': 'Base score',
            'days_since_last_open': 'Recent open activity',
            'days_since_last_click': 'Recent click activity',
            'interaction_frequency': 'Overall interaction frequency',
            'tenure_days': 'Time since enrollment',
            'recipient_type_Patient': 'Recipient type',
        }
        
        for feat, val in feature_importance[:3]:
            direction = "increased" if val > 0 else "decreased"
            name = readable_names.get(feat, feat.replace('_', ' ').capitalize())
            top_factors.append(f"{name} {direction} probability")
            
    except Exception as e:
        top_factors = ["SHAP explanation unavailable"]
        print(f"SHAP error: {e}")

    return {
        "openProbability": float(prob),
        "clickProbability": float(prob * 0.4), # Synthetic click prob based on open
        "engagementTier": tier,
        "topFactors": top_factors
    }


@app.post("/predict/subject-line")
async def predict_subject_line(req: SubjectLineRequest):
    if sub_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
        
    score = sub_model.predict([req.subject])[0]
    score = np.clip(score, 0, 100)
    
    suggestions = []
    if "{{" not in req.subject:
        suggestions.append("Consider adding personalization tokens (e.g. {{name}})")
    if len(req.subject) < 20:
        suggestions.append("Subject line is quite short, consider adding more context")
    if len(req.subject) > 60:
        suggestions.append("Subject line is long, consider keeping it under 60 characters")
        
    return {
        "score": float(score),
        "suggestions": suggestions
    }


@app.post("/simulate/ab-test")
async def simulate_ab_test(req: ABTestRequest):
    if sub_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
        
    scoreA = float(np.clip(sub_model.predict([req.subjectA])[0], 0, 100))
    scoreB = float(np.clip(sub_model.predict([req.subjectB])[0], 0, 100))
    
    # Synthetic metrics based on score
    def get_metrics(score):
        base_open = 0.15 + (score / 100) * 0.4
        return {
            "predictedOpenRate": base_open * 100,
            "predictedClickRate": (base_open * 0.3) * 100,
            "score": score
        }
        
    metricsA = get_metrics(scoreA)
    metricsA['subject'] = req.subjectA
    
    metricsB = get_metrics(scoreB)
    metricsB['subject'] = req.subjectB
    
    recommendation = "A" if scoreA >= scoreB else "B"
    
    return {
        "variantA": metricsA,
        "variantB": metricsB,
        "recommendation": recommendation
    }

@app.get("/health")
async def health():
    return {"status": "ok"}
