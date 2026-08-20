from pathlib import Path
import shutil
import random

random.seed(42)

SOURCE = Path("face_crops")
TARGET = Path("balanced_face_crops")

(TARGET / "real").mkdir(parents=True, exist_ok=True)
(TARGET / "spoof").mkdir(parents=True, exist_ok=True)

real_files = list((SOURCE / "real").glob("*"))
spoof_files = list((SOURCE / "spoof").glob("*"))

min_count = min(len(real_files), len(spoof_files))

print("Target Count:", min_count)

real_selected = random.sample(real_files, min_count)
spoof_selected = random.sample(spoof_files, min_count)

for file in real_selected:
    shutil.copy(file, TARGET / "real" / file.name)

for file in spoof_selected:
    shutil.copy(file, TARGET / "spoof" / file.name)

print("Balanced Dataset Created")