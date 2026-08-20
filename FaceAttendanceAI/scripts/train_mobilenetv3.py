import os
import torch
import torch.nn as nn

from torch.utils.data import DataLoader
from torchvision import datasets
from torchvision import transforms
from torchvision import models

from torch.optim.lr_scheduler import ReduceLROnPlateau
from torch.utils.tensorboard import SummaryWriter


def main():

    device = torch.device(
        "cuda" if torch.cuda.is_available()
        else "cpu"
    )

    print("Device:", device)

    os.makedirs("models", exist_ok=True)

    writer = SummaryWriter(
        "runs/anti_spoof"
    )

    train_transform = transforms.Compose([
        transforms.Resize((224,224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(
            brightness=0.3,
            contrast=0.3,
            saturation=0.2
        ),
        transforms.ToTensor()
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224,224)),
        transforms.ToTensor()
    ])

    train_dataset = datasets.ImageFolder(
        "processed/train",
        transform=train_transform
    )

    val_dataset = datasets.ImageFolder(
        "processed/val",
        transform=val_transform
    )

    print(
        "Train Images:",
        len(train_dataset)
    )

    print(
        "Val Images:",
        len(val_dataset)
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=32,
        shuffle=True,
        num_workers=0,
        pin_memory=True
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=32,
        shuffle=False,
        num_workers=0,
        pin_memory=True
    )

    model = models.mobilenet_v3_large(
        weights=models.MobileNet_V3_Large_Weights.DEFAULT
    )

    model.classifier[3] = nn.Linear(
        model.classifier[3].in_features,
        2
    )

    model = model.to(device)

    criterion = nn.CrossEntropyLoss()

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=1e-4,
        weight_decay=1e-4
    )

    scheduler = ReduceLROnPlateau(
        optimizer,
        mode="max",
        factor=0.5,
        patience=2
    )

    best_acc = 0
    patience = 5
    counter = 0
    epochs = 15

    for epoch in range(epochs):

        model.train()

        running_loss = 0

        for images, labels in train_loader:

            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()

            outputs = model(images)

            loss = criterion(
                outputs,
                labels
            )

            loss.backward()

            optimizer.step()

            running_loss += loss.item()

        model.eval()

        correct = 0
        total = 0

        with torch.no_grad():

            for images, labels in val_loader:

                images = images.to(device)
                labels = labels.to(device)

                outputs = model(images)

                preds = outputs.argmax(1)

                correct += (
                    preds == labels
                ).sum().item()

                total += labels.size(0)

        val_acc = correct / total

        avg_loss = (
            running_loss /
            len(train_loader)
        )

        scheduler.step(val_acc)

        print(
            f"Epoch {epoch+1}/{epochs} | "
            f"Loss={avg_loss:.4f} | "
            f"ValAcc={val_acc:.4f}"
        )

        writer.add_scalar(
            "Loss",
            avg_loss,
            epoch
        )

        writer.add_scalar(
            "ValAcc",
            val_acc,
            epoch
        )

        if val_acc > best_acc:

            best_acc = val_acc

            torch.save(
                model.state_dict(),
                "models/mobilenetv3_best.pth"
            )

            print(
                "Best Model Saved"
            )

            counter = 0

        else:

            counter += 1

        if counter >= patience:

            print(
                "Early Stopping"
            )

            break

    writer.close()

    print(
        f"Training Finished "
        f"(Best Acc={best_acc:.4f})"
    )


if __name__ == "__main__":
    main()