import torch
import torch.nn as nn
from torchvision import models

device = torch.device("cpu")

model = models.mobilenet_v3_large()

model.classifier[3] = nn.Linear(
    model.classifier[3].in_features,
    2
)

model.load_state_dict(
    torch.load(
        "models/mobilenetv3_best.pth",
        map_location=device
    )
)

model.eval()

dummy_input = torch.randn(
    1,
    3,
    224,
    224
)

torch.onnx.export(
    model,
    dummy_input,
    "models/anti_spoofing_model.onnx",
    export_params=True,
    opset_version=11,
    input_names=["input"],
    output_names=["output"]
)

print("ONNX Export Complete")