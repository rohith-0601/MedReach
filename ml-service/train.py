import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score
import joblib
import os

os.makedirs('models', exist_ok=True)

print("Generating synthetic data for Engagement Model...")
# 1. Engagement Prediction Model
# Features: recipient_type, score, days_since_last_open, days_since_last_click, interaction_frequency, therapy_area (one-hot), tenure_days
n_samples = 2000

recipient_types = np.random.choice(['HCP', 'Patient'], n_samples)
scores = np.random.normal(65, 15, n_samples).clip(0, 100)
days_since_last_open = np.random.exponential(30, n_samples).clip(0, 365)
days_since_last_click = days_since_last_open + np.random.exponential(15, n_samples).clip(0, 365)
interaction_frequency = np.random.poisson(5, n_samples)
therapy_areas = np.random.choice(['Cardiac Wellness Program', 'Metabolic Health Program', 'Respiratory Care Program', 'None'], n_samples)
tenure_days = np.random.uniform(30, 730, n_samples)

# Derived target probabilities (synthetic logic)
base_prob = 0.2 + (scores / 100) * 0.4
prob = base_prob - (days_since_last_open / 365) * 0.2 + (interaction_frequency / 20) * 0.2
prob = prob.clip(0, 1)

# Generate targets based on probabilities
engaged_target = np.random.binomial(1, prob)

df_eng = pd.DataFrame({
    'recipient_type': recipient_types,
    'score': scores,
    'days_since_last_open': days_since_last_open,
    'days_since_last_click': days_since_last_click,
    'interaction_frequency': interaction_frequency,
    'therapy_area': therapy_areas,
    'tenure_days': tenure_days,
    'engaged': engaged_target
})

# Preprocessing
df_eng = pd.get_dummies(df_eng, columns=['recipient_type', 'therapy_area'], drop_first=True)
X_eng = df_eng.drop('engaged', axis=1)
y_eng = df_eng['engaged']

# Save feature names for SHAP
joblib.dump(list(X_eng.columns), 'models/engagement_features.joblib')

X_train, X_test, y_train, y_test = train_test_split(X_eng, y_eng, test_size=0.2, random_state=42)

print("Training Engagement Models...")
# Compare models
models = {
    'Logistic Regression': LogisticRegression(max_iter=1000),
    'Random Forest': RandomForestClassifier(random_state=42),
    'XGBoost': XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
}

best_model = None
best_auc = 0
best_model_name = ""

for name, model in models.items():
    model.fit(X_train, y_train)
    preds = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, preds)
    print(f"{name} AUC-ROC: {auc:.4f}")
    if auc > best_auc:
        best_auc = auc
        best_model = model
        best_model_name = name

print(f"Selected best model: {best_model_name} (AUC: {best_auc:.4f})")
joblib.dump(best_model, 'models/engagement_model.joblib')


print("\nGenerating synthetic data for Subject Line Scoring Model...")
# 2. Subject Line Scoring Model
subjects = [
    "Weekly Wellness Check-in",
    "Important Update: Program Changes",
    "Your Monthly Progress Report",
    "Reminder: Complete Assessment",
    "Welcome to the Program!",
    "New Digital Tools Available",
    "Engagement Digest for HCPs",
    "Clinical Updates: Q3",
    "We Miss You! Come Back",
    "Action Required: Policy Update"
] * 40 # 400 samples

# Add some variations
import random
subjects = [s + (" {{name}}" if random.random() > 0.5 else "") for s in subjects]
subjects = [s + ("!" if random.random() > 0.7 else "") for s in subjects]

# Synthetic scoring logic: length penalty, personalization bonus, clarity keywords
def score_subject(text):
    score = 50
    if "{{name}}" in text: score += 15
    if len(text) < 40: score += 10
    if len(text) > 80: score -= 15
    words = text.lower().split()
    if any(w in words for w in ['important', 'action', 'required']): score += 10
    if any(w in words for w in ['update', 'progress']): score += 5
    return np.clip(score + np.random.normal(0, 5), 0, 100)

scores = [score_subject(s) for s in subjects]

df_sub = pd.DataFrame({'subject': subjects, 'score': scores})

# We'll use a simple TF-IDF + Ridge Regression for scoring
from sklearn.linear_model import Ridge
X_sub = df_sub['subject']
y_sub = df_sub['score']

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=100)),
    ('ridge', Ridge(alpha=1.0))
])

pipeline.fit(X_sub, y_sub)
print("Subject line model trained.")
joblib.dump(pipeline, 'models/subject_line_model.joblib')

print("All models trained and saved to models/ directory.")
