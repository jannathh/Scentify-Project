import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, ConfusionMatrixDisplay

# Step 1: Load your data
df = pd.read_csv("combined_sensor_data.csv")
X = df[['MQ-3', 'MQ-4', 'MQ-135']]
y = df['Label']

# Step 2: Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, test_size=0.2, random_state=42)

# Step 3: Base SVM pipeline
base_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', SVC())
])

# Step 4: Train base model
base_pipeline.fit(X_train, y_train)
y_pred_base = base_pipeline.predict(X_test)
acc_base = accuracy_score(y_test, y_pred_base)

# Step 5: Define parameter grid for tuning
param_grid = {
    'svm__C': [0.1, 1],
    'svm__kernel': ['linear', 'rbf']
}

tuned_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', SVC())
])

grid_search = GridSearchCV(tuned_pipeline, param_grid, cv=3, scoring='accuracy', n_jobs=-1)
grid_search.fit(X_train, y_train)
y_pred_tuned = grid_search.predict(X_test)
acc_tuned = accuracy_score(y_test, y_pred_tuned)

# Step 6: Show results
print(f"✅ Base SVM Accuracy: {round(acc_base * 100, 2)}%")
print(f"✅ Tuned SVM Accuracy: {round(acc_tuned * 100, 2)}%")
print(f"🏆 Best Parameters: {grid_search.best_params_}")

# Step 7: Confusion Matrices side-by-side
labels = np.unique(y)

fig, ax = plt.subplots(1, 2, figsize=(14, 6))

# Base
cm_base = confusion_matrix(y_test, y_pred_base, labels=labels)
disp_base = ConfusionMatrixDisplay(cm_base, display_labels=labels)
disp_base.plot(ax=ax[0], cmap='Blues', values_format='d')
ax[0].set_title("Base SVM")
ax[0].set_xticklabels(labels, rotation=90)

# Tuned
cm_tuned = confusion_matrix(y_test, y_pred_tuned, labels=labels)
disp_tuned = ConfusionMatrixDisplay(cm_tuned, display_labels=labels)
disp_tuned.plot(ax=ax[1], cmap='Greens', values_format='d')
ax[1].set_title("Tuned SVM")
ax[1].set_xticklabels(labels, rotation=90)

plt.tight_layout()
plt.show()
