import torch
import torch.nn as nn

from torchvision import transforms
from torchvision import datasets
from torchvision.models import mobilenet_v3_large

from torch.utils.data import DataLoader

device = "cuda"

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor()
])

train_data = datasets.ImageFolder(
    "dataset/train",
    transform=transform
)

val_data = datasets.ImageFolder(
    "dataset/val",
    transform=transform
)

train_loader = DataLoader(
    train_data,
    batch_size=32,
    shuffle=True
)

val_loader = DataLoader(
    val_data,
    batch_size=32
)

model = mobilenet_v3_large(weights="DEFAULT")

model.classifier[3] = nn.Linear(
    model.classifier[3].in_features,
    2
)

model.to(device)

criterion = nn.CrossEntropyLoss()

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=0.001
)

for epoch in range(10):

    model.train()

    total_loss = 0

    for images, labels in train_loader:

        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(outputs, labels)

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

    print(
        f"Epoch {epoch+1} Loss {total_loss:.4f}"
    )

torch.save(
    model.state_dict(),
    "models/best_model.pth"
)

print("Model Saved")