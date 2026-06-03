import onnxruntime as ort

session = ort.InferenceSession("anti_spoofing_model.onnx")
for i in session.get_inputs():
    print("Input:", i.name, "Shape:", i.shape, "Type:", i.type)
for o in session.get_outputs():
    print("Output:", o.name, "Shape:", o.shape, "Type:", o.type)
