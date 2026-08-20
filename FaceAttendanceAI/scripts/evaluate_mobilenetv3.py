import torch
import torch.nn as nn

from torchvision import datasets
from torchvision import transforms
from torchvision import models

from torch.utils.data import DataLoader

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score
)

device = torch.device(
    "cuda" if torch.cuda.is_available()
    else "cpu"
)

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])

test_dataset = datasets.ImageFolder(
    "processed/test",
    transform=transform
)

test_loader = DataLoader(
    test_dataset,
    batch_size=32,
    shuffle=False
)

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

model = model.to(device)
model.eval()

y_true = []
y_pred = []

with torch.no_grad():

    for images, labels in test_loader:

        images = images.to(device)

        outputs = model(images)

        preds = outputs.argmax(1)

        y_true.extend(labels.numpy())
        y_pred.extend(preds.cpu().numpy())

print("\nAccuracy:")
print(
    accuracy_score(
        y_true,
        y_pred
    )
)

print("\nClassification Report:")
print(
    classification_report(
        y_true,
        y_pred,
        target_names=["real","spoof"]
    )
)

print("\nConfusion Matrix:")
print(
    confusion_matrix(
        y_true,
        y_pred
    )
)