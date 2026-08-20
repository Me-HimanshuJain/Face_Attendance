from pathlib import Path
import shutil
import random

SOURCE = Path("processed")

TARGET = Path("dataset")

random.seed(42)

for cls in ["real", "spoof"]:

    images = list((SOURCE / cls).glob("*"))

    random.shuffle(images)

    total = len(images)

    train_end = int(total * 0.7)
    val_end = int(total * 0.85)

    splits = {
        "train": images[:train_end],
        "val": images[train_end:val_end],
        "test": images[val_end:]
    }

    for split, files in splits.items():

        dest = TARGET / split / cls

        dest.mkdir(parents=True, exist_ok=True)

        for file in files:
            shutil.copy(file, dest / file.name)

print("Done")