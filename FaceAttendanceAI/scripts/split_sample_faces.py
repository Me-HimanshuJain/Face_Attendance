from pathlib import Path
import shutil
import random

random.seed(42)

SOURCE = Path("sample_face_crops")
TARGET = Path("sample_face_dataset")

for cls in ["real", "spoof"]:

    files = list((SOURCE / cls).glob("*"))

    random.shuffle(files)

    total = len(files)

    train_end = int(total * 0.7)
    val_end = int(total * 0.85)

    splits = {
        "train": files[:train_end],
        "val": files[train_end:val_end],
        "test": files[val_end:]
    }

    for split, images in splits.items():

        dest = TARGET / split / cls

        dest.mkdir(
            parents=True,
            exist_ok=True
        )

        for img in images:

            shutil.copy(
                img,
                dest / img.name
            )

print("Dataset Split Complete")