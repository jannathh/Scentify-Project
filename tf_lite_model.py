converter = tf.lite.TFLiteConverter.from_saved_model("tf_scentify_model")
tflite_model = converter.convert()

with open("scentify_model.tflite", "wb") as f:
    f.write(tflite_model)
