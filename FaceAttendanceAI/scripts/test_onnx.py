import onnxruntime as ort
import numpy as np

session = ort.InferenceSession(
    "models/anti_spoofing_model.onnx",
    providers=["CPUExecutionProvider"]
)

dummy = np.random.randn(
    1,
    3,
    224,
    224
).astype(np.float32)

output = session.run(
    None,
    {"input": dummy}
)

print("ONNX Working")
print("Output Shape:", output[0].shape)