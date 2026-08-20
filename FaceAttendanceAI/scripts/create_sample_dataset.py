from pathlib import Path
import shutil
import random

random.seed(42)

SOURCE = Path("balanced_dataset")

DEST = Path("sample_dataset")

(DEST / "real").mkdir(parents=True, exist_ok=True)
(DEST / "spoof").mkdir(parents=True, exist_ok=True)

SAMPLE_SIZE = 1000

for cls in ["real", "spoof"]:

    files = list((SOURCE / cls).glob("*"))

    selected = random.sample(
        files,
        SAMPLE_SIZE
    )

    for file in selected:

        shutil.copy(
            file,
            DEST / cls / file.name
        )

print("Sample Dataset Created")