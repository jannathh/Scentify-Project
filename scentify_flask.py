import time
import numpy as np
import joblib
import firebase_admin
from firebase_admin import credentials, db, firestore

# Initialize Firebase Admin with your service account credentials
cred = credentials.Certificate("scentify-54c2e-firebase-adminsdk-fbsvc-dadbf2333c.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://scentify-54c2e-default-rtdb.europe-west1.firebasedatabase.app/'
})

# Load your trained model (model.pkl should include both the scaler and classifier)
model = joblib.load('model.pkl')

# References for Realtime Database
sensor_ref = db.reference('latestSensorData')
prediction_ref = db.reference('prediction')

# Create Firestore client
firestore_db = firestore.client()

def poll_and_predict():
    while True:
        # Retrieve sensor values from Firebase under 'latestSensorData'
        sensor_data = sensor_ref.get()
        if sensor_data:
            try:
                # Assuming sensor_data contains keys "MQ135", "MQ3", and "MQ4"
                # Map the Firebase keys to the model's expected order: [MQ3, MQ4, MQ135]
                mq3 = float(sensor_data.get('MQ3', 0))
                mq4 = float(sensor_data.get('MQ4', 0))
                mq135 = float(sensor_data.get('MQ135', 0))
                
                # Create feature array with the correct order
                features = np.array([mq3, mq4, mq135]).reshape(1, -1)
                
                # Use the model to make a prediction
                prediction = model.predict(features)[0]
                
                # Write the prediction back to Realtime Database
                prediction_ref.set({'prediction': prediction})
                
                # Write the prediction to Firestore in collection 'scentify'
                firestore_db.collection('scentify').document('currentPrediction').set({
                    'prediction': prediction,
                    'timestamp': firestore.SERVER_TIMESTAMP
                })
                
                print("Prediction updated:", prediction)
            except Exception as e:
                print("Error processing sensor data:", e)
        else:
            print("No sensor data available.")
        # Wait a few seconds before polling again (adjust as needed)
        time.sleep(5)

if __name__ == '__main__':
    poll_and_predict()



