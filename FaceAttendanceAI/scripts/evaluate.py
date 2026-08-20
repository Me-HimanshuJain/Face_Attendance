import torch
import torch.nn as nn
from torchvision import datasets, transforms
from torchvision.models import mobilenet_v3_large
from torch.utils.data import DataLoader
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

device = "cuda"

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])

test_data = datasets.ImageFolder(
    "dataset/test",
    transform=transform
)

test_loader = DataLoader(
    test_data,
    batch_size=32,
    shuffle=False
)

model = mobilenet_v3_large(weights=None)

model.classifier[3] = nn.Linear(
    model.classifier[3].in_features,
    2
)

model.load_state_dict(
    torch.load(
        "models/best_model.pth",
        map_location=device
    )
)

model.to(device)
model.eval()

y_true = []
y_pred = []

with torch.no_grad():

    for images, labels in test_loader:

        images = images.to(device)

        outputs = model(images)

        predictions = outputs.argmax(1)

        y_true.extend(labels.numpy())
        y_pred.extend(predictions.cpu().numpy())

print("Accuracy :", accuracy_score(y_true, y_pred))
print("Precision:", precision_score(y_true, y_pred))
print("Recall   :", recall_score(y_true, y_pred))
print("F1 Score :", f1_score(y_true, y_pred))

print("\nConfusion Matrix")
print(confusion_matrix(y_true, y_pred))