import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, ConfusionMatrixDisplay
import joblib

# Step 1: Load dataset
df = pd.read_csv("combined_sensor_data.csv")
X = df[['MQ-3', 'MQ-4', 'MQ-135']]
y = df['Label']

# Step 2: Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, test_size=0.2, random_state=42)

# Step 3: Build basic Random Forest pipeline
base_rf = Pipeline([
    ('scaler', StandardScaler()),
    ('rf', RandomForestClassifier(random_state=42))
])

base_rf.fit(X_train, y_train)
y_pred_base = base_rf.predict(X_test)
acc_base = accuracy_score(y_test, y_pred_base)


# Step 4: Define supercharged parameters for tuning
param_grid = {
    'rf__n_estimators': [100, 200],
    'rf__max_depth': [10, 15],
    'rf__min_samples_split': [2],
    'rf__min_samples_leaf': [1],
    'rf__max_features': ['sqrt']
}

tuned_rf = Pipeline([
    ('scaler', StandardScaler()),
    ('rf', RandomForestClassifier(random_state=42))
])

grid_search = GridSearchCV(tuned_rf, param_grid, cv=3, scoring='accuracy', n_jobs=-1)
grid_search.fit(X_train, y_train)

best_rf = grid_search.best_estimator_
y_pred_tuned = best_rf.predict(X_test)
acc_tuned = accuracy_score(y_test, y_pred_tuned)

# Step 5: Print results
print(f"🌲 Base RF Accuracy: {round(acc_base * 100, 2)}%")
print(f"🌲 Tuned RF Accuracy: {round(acc_tuned * 100, 2)}%")
print(f"✅ Best Tuned Parameters: {grid_search.best_params_}")

# Step 6: Plot confusion matrices side by side
labels = np.unique(y)
fig, ax = plt.subplots(1, 2, figsize=(14, 6))

# Base RF Confusion Matrix
cm_base = confusion_matrix(y_test, y_pred_base, labels=labels)
disp_base = ConfusionMatrixDisplay(confusion_matrix=cm_base, display_labels=labels)
disp_base.plot(ax=ax[0], cmap='Blues', values_format='d')
ax[0].set_title("Base Random Forest")
ax[0].set_xticklabels(labels, rotation=90)

# Tuned RF Confusion Matrix
cm_tuned = confusion_matrix(y_test, y_pred_tuned, labels=labels)
disp_tuned = ConfusionMatrixDisplay(confusion_matrix=cm_tuned, display_labels=labels)
disp_tuned.plot(ax=ax[1], cmap='Greens', values_format='d')
ax[1].set_title("Tuned Random Forest")
ax[1].set_xticklabels(labels, rotation=90)

plt.tight_layout()
plt.show()

# Save the tuned model to a file named 'model.pk1'
joblib.dump(best_rf, 'model.pk1')