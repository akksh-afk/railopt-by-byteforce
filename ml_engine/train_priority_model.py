"""
train_priority_model.py
========================
Trains the Priority Scoring model for RailOpt (SIH26027).

WHAT THIS MODEL DOES:
Given a maintenance/defect record (from TMS, SMMS, or TDMS), predict the
probability that it leads to a failure/disruption within 90 days if left
unaddressed. That probability becomes the basis of the 0-100 priority score
fed into the block-scheduling optimizer.

WHY XGBoost:
This is a "tabular data" problem (rows and columns, like Excel) — not text,
not images. Gradient-boosted decision trees (XGBoost/LightGBM) are the
established best-performing, most interpretable choice for this category of
problem, and train in seconds on a laptop CPU — no GPU required.

HOW TO RUN:
    pip install -r requirements.txt        (from the repo root)
    python3 train_priority_model.py ml_training_dataset.csv

OUTPUT:
    - models/priority_model.json          (the trained model, reload anytime)
    - models/feature_importance.png       (chart: what the model actually learned)
    - models/evaluation_report.txt        (accuracy/precision/recall you can quote to judges)
    - models/label_encoders.pkl           (needed to encode new data the same way)
"""

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
import matplotlib.pyplot as plt
import pickle
import os
import sys

from pathlib import Path

# Paths are relative to this file, so it works wherever the repo is cloned.
SCRIPT_DIR = Path(__file__).resolve().parent

DATA_DIR = SCRIPT_DIR.parent / "data" / "synthetic"

filename = (sys.argv[1] if len(sys.argv) > 1
            else input("Enter the dataset filename [ml_training_dataset.csv]: ").strip()) or "ml_training_dataset.csv"

DATA_PATH = os.path.join(DATA_DIR, filename)

MODEL_DIR = SCRIPT_DIR / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
# ---------------------------------------------------------------------------
# STEP 1: LOAD THE DATA
# ---------------------------------------------------------------------------
# This is just reading the CSV into a table (a "DataFrame") that Python can
# work with row-by-row and column-by-column.
print("STEP 1: Loading data...")
df = pd.read_csv(DATA_PATH) # type: ignore
print(f"  Loaded {len(df)} rows, {len(df.columns)} columns")
print(f"  Columns: {list(df.columns)}")

# ---------------------------------------------------------------------------
# STEP 2: SEPARATE FEATURES (inputs) FROM LABEL (the answer we're predicting)
# ---------------------------------------------------------------------------
# "Features" = everything the model is allowed to look at to make a guess.
# "Label"    = the correct answer from history, used to check/train the model.
# We deliberately EXCLUDE identifier columns (record_id, corridor_id) from
# features — an ID number carries no real signal and including it risks the
# model "memorizing" specific rows instead of learning a general pattern.
print("\nSTEP 2: Selecting features and label...")

LABEL_COL = "label_failure_within_90_days"

# Categorical (text) columns need to be converted to numbers for the model.
# XGBoost cannot read the word "Engineering" directly - we encode it as e.g. 0,1,2...
CATEGORICAL_COLS = ["department", "zone", "defect_type", "severity_class",
                     "requires_traffic_or_power_block"]

NUMERIC_COLS = ["severity_score", "days_overdue", "corridor_traffic_density",
                 "estimated_repair_duration_hrs"]

FEATURE_COLS = CATEGORICAL_COLS + NUMERIC_COLS

# Encode each categorical column into numbers, and REMEMBER the encoding
# (label_encoders) so that later, when new real defect data comes in, we
# transform it the exact same way before asking the model to predict.
label_encoders = {}
df_encoded = df.copy()
for col in CATEGORICAL_COLS:
    le = LabelEncoder()
    df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
    label_encoders[col] = le
    print(f"  Encoded '{col}': {list(le.classes_)}")

X = df_encoded[FEATURE_COLS]
y = df_encoded[LABEL_COL]

print(f"\n  Final feature matrix shape: {X.shape}")
print(f"  Label distribution:\n{y.value_counts()}")
print(f"  Positive class rate: {100*y.mean():.1f}%  (this is realistically imbalanced -- most defects do NOT become failures, matching real-world rarity)")

# ---------------------------------------------------------------------------
# STEP 3: TRAIN / TEST SPLIT
# ---------------------------------------------------------------------------
# We hold back 20% of the data that the model NEVER sees during training.
# This is how we honestly check "did it actually learn the pattern, or did
# it just memorize the training rows?" stratify=y ensures both the train and
# test sets keep the same ~9.5% positive rate, so testing stays realistic.
print("\nSTEP 3: Splitting into train (80%) and test (20%) sets...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  Train set: {len(X_train)} rows | Test set: {len(X_test)} rows")

# ---------------------------------------------------------------------------
# STEP 4: HANDLE CLASS IMBALANCE
# ---------------------------------------------------------------------------
# Since only ~9.5% of rows are "positive" (led to failure), a lazy model
# could get 90%+ "accuracy" by just always predicting "no failure" -- which
# would be useless. scale_pos_weight tells XGBoost to pay proportionally
# more attention to the rare, safety-critical positive cases.
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print(f"\nSTEP 4: Computed class imbalance weight (scale_pos_weight) = {scale_pos_weight:.2f}")

# ---------------------------------------------------------------------------
# STEP 5: TRAIN THE MODEL
# ---------------------------------------------------------------------------
# This is the actual "training" step. In plain terms: the model builds a
# sequence of simple decision trees, where each new tree focuses on
# correcting the mistakes of the trees before it (that's what "gradient
# boosting" means). n_estimators=200 means it builds 200 such trees.
print("\nSTEP 5: Training XGBoost model...")
model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=4,              # shallow trees = less overfitting, more interpretable
    learning_rate=0.1,
    scale_pos_weight=scale_pos_weight,
    eval_metric="logloss",
    random_state=42
)
model.fit(X_train, y_train)
print("  Training complete.")

# ---------------------------------------------------------------------------
# STEP 6: EVALUATE HONESTLY ON THE HELD-OUT TEST SET
# ---------------------------------------------------------------------------
print("\nSTEP 6: Evaluating on unseen test data...")
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)[:, 1]   # probability of "will fail"

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, zero_division=0)
rec = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)
auc = roc_auc_score(y_test, y_pred_proba)
cm = confusion_matrix(y_test, y_pred)

report = f"""
RailOpt Priority Model -- Evaluation Report
=============================================
Test set size: {len(y_test)} records (held out, never seen during training)

Accuracy:  {acc:.3f}   (fraction of all predictions that were correct)
Precision: {prec:.3f}   (of records we flagged as high-risk, fraction that truly were)
Recall:    {rec:.3f}   (of records that TRULY led to failure, fraction we successfully caught)
F1 Score:  {f1:.3f}   (balance of precision and recall)
ROC-AUC:   {auc:.3f}   (overall ability to separate risky vs safe cases, 0.5=random, 1.0=perfect)

Confusion Matrix:
                 Predicted: No Failure   Predicted: Failure
Actual: No Failure      {cm[0][0]:>6}                {cm[0][1]:>6}
Actual: Failure         {cm[1][0]:>6}                {cm[1][1]:>6}

--- What to tell judges ---
For a safety-critical maintenance system, RECALL matters more than raw
accuracy: missing a genuine high-risk defect (a false negative) is far more
costly than a false alarm. Our scale_pos_weight adjustment during training
was specifically chosen to push recall up, even at some cost to precision --
this is a deliberate, defensible safety-first design choice, not an
oversight.
"""
print(report)
with open(f"{MODEL_DIR}/evaluation_report.txt", "w") as f:
    f.write(report)
    f.write("\n\nFull sklearn classification report:\n")
    f.write(classification_report(y_test, y_pred, target_names=["No Failure","Failure"]))

# ---------------------------------------------------------------------------
# STEP 7: EXPLAINABILITY -- what did the model actually learn?
# ---------------------------------------------------------------------------
# This is the "explain why" piece that makes the model defensible to judges
# and to a real railway controller. feature_importances_ tells you which
# columns the model relied on most heavily, on average, across all its trees.
print("STEP 7: Computing feature importance (explainability)...")
importances = model.feature_importances_
imp_df = pd.DataFrame({"feature": FEATURE_COLS, "importance": importances})
imp_df = imp_df.sort_values("importance", ascending=True)

plt.figure(figsize=(8,5))
plt.barh(imp_df["feature"], imp_df["importance"], color="#b22222")
plt.xlabel("Importance (relative influence on prediction)")
plt.title("RailOpt Priority Model - Feature Importance")
plt.tight_layout()
plt.savefig(f"{MODEL_DIR}/feature_importance.png", dpi=150)
print(f"  Saved chart to {MODEL_DIR}/feature_importance.png")
print("\n  Ranked feature importance:")
print(imp_df.sort_values("importance", ascending=False).to_string(index=False))

# ---------------------------------------------------------------------------
# STEP 8: SAVE EVERYTHING SO THE MODEL CAN BE REUSED (no retraining needed)
# ---------------------------------------------------------------------------
print("\nSTEP 8: Saving model and encoders...")
model.save_model(f"{MODEL_DIR}/priority_model.json")
with open(f"{MODEL_DIR}/label_encoders.pkl", "wb") as f:
    pickle.dump(label_encoders, f)
with open(f"{MODEL_DIR}/feature_columns.pkl", "wb") as f:
    pickle.dump(FEATURE_COLS, f)
print(f"  Saved: {MODEL_DIR}/priority_model.json")
print(f"  Saved: {MODEL_DIR}/label_encoders.pkl")
print(f"  Saved: {MODEL_DIR}/feature_columns.pkl")

print("\nDONE. Model is trained, evaluated, explained, and saved.")
print("Next: use predict_priority.py to score new defect records with this model.")
