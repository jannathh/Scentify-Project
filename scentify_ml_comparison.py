import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, ConfusionMatrixDisplay
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier

# Step 1: Load Data
df = pd.read_csv("combined_sensor_data.csv")  # Make sure this file is in your directory
X = df[['MQ-3', 'MQ-4', 'MQ-135']]
y = df['Label']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, test_size=0.2, random_state=42)

# Step 2: Define a helper function
def evaluate_model(name, model, param_grid=None, tuned=False):
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', model)
    ])
    
    if tuned and param_grid:
        grid = GridSearchCV(pipeline, param_grid, cv=3, n_jobs=-1)
        grid.fit(X_train, y_train)
        model = grid.best_estimator_
        print(f"{name} Tuned - Best Params: {grid.best_params_}")
    else:
        model = pipeline.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    # Plot Confusion Matrix
    cm = confusion_matrix(y_test, y_pred, labels=np.unique(y))
    disp = ConfusionMatrixDisplay(cm, display_labels=np.unique(y))
    disp.plot(cmap='Blues')
    plt.title(f"{name} - {'Tuned' if tuned else 'Default'}")
    plt.grid(False)
    plt.show()

    print(f"{name} - {'Tuned' if tuned else 'Default'} Accuracy: {round(acc * 100, 2)}%\n")
    return acc

# Step 3: Define models and reduced hyperparameters
models = [
    {
        'name': 'Random Forest',
        'model': RandomForestClassifier(random_state=42),
        'params': {'clf__n_estimators': [50], 'clf__max_depth': [10]}
    },
    {
        'name': 'SVM',
        'model': SVC(),
        'params': {'clf__C': [1], 'clf__kernel': ['rbf']}
    },
    {
        'name': 'KNN',
        'model': KNeighborsClassifier(),
        'params': {'clf__n_neighbors': [5]}
    }
]

# Step 4: Evaluate
results = []
for m in models:
    print(f"Evaluating {m['name']} - Default")
    acc_default = evaluate_model(m['name'], m['model'], tuned=False)

    print(f"Evaluating {m['name']} - Tuned")
    acc_tuned = evaluate_model(m['name'], m['model'], m['params'], tuned=True)

    results.append({
        'Model': m['name'],
        'Accuracy (Default)': round(acc_default * 100, 2),
        'Accuracy (Tuned)': round(acc_tuned * 100, 2)
    })

# Step 5: Show Summary
summary_df = pd.DataFrame(results)
print("=== Accuracy Comparison Summary ===")
print(summary_df)
