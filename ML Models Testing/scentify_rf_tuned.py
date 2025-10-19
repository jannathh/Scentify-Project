import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, ConfusionMatrixDisplay

# Step 1: Load your data
df = pd.read_csv("combined_sensor_data.csv")  # Ensure this is in your folder
X = df[['MQ-3', 'MQ-4', 'MQ-135']]
y = df['Label']

# Step 2: Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, test_size=0.2, random_state=42)

# Step 3: Define basic Random Forest pipeline
base_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('rf', RandomForestClassifier(random_state=42))
])

# Step 4: Train base model
base_pipeline.fit(X_train, y_train)
y_pred_base = base_pipeline.predict(X_test)
acc_base = accuracy_score(y_test, y_pred_base)

# Step 5: Define parameter grid and tune using GridSearchCV
param_grid = {
    'rf__n_estimators': [50, 100],
    'rf__max_depth': [None, 10],
    'rf__min_samples_split': [2, 5]
}

tuned_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('rf', RandomForestClassifier(random_state=42))
])

grid_search = GridSearchCV(tuned_pipeline, param_grid, cv=3, scoring='accuracy', n_jobs=-1)
grid_search.fit(X_train, y_train)
y_pred_tuned = grid_search.predict(X_test)
acc_tuned = accuracy_score(y_test, y_pred_tuned)

# Step 6: Show results
print(f"✅ Base Accuracy: {round(acc_base * 100, 2)}%")
print(f"✅ Tuned Accuracy: {round(acc_tuned * 100, 2)}%")
print(f"🏆 Best Parameters: {grid_search.best_params_}")

# Step 7: Confusion Matrices side-by-side
labels = np.unique(y)

fig, ax = plt.subplots(1, 2, figsize=(14, 6))

# Base
cm_base = confusion_matrix(y_test, y_pred_base, labels=labels)
disp_base = ConfusionMatrixDisplay(cm_base, display_labels=labels)
disp_base.plot(ax=ax[0], cmap='Blues', values_format='d')
ax[0].set_title("Base Random Forest")
ax[0].set_xticklabels(labels, rotation=90)

# Tuned
cm_tuned = confusion_matrix(y_test, y_pred_tuned, labels=labels)
disp_tuned = ConfusionMatrixDisplay(cm_tuned, display_labels=labels)
disp_tuned.plot(ax=ax[1], cmap='Greens', values_format='d')
ax[1].set_title("Tuned Random Forest")
ax[1].set_xticklabels(labels, rotation=90)

plt.tight_layout()
plt.show()
