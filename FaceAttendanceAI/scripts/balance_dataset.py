from pathlib import Path
import random
import shutil

random.seed(42)

REAL = Path("final_dataset/real")
SPOOF = Path("final_dataset/spoof")

BALANCED = Path("balanced_dataset")

(BALANCED / "real").mkdir(parents=True, exist_ok=True)
(BALANCED / "spoof").mkdir(parents=True, exist_ok=True)

real_files = list(REAL.glob("*"))
spoof_files = list(SPOOF.glob("*"))

target = min(len(real_files), len(spoof_files))

real_selected = random.sample(real_files, target)
spoof_selected = random.sample(spoof_files, target)

for f in real_selected:
    shutil.copy(f, BALANCED / "real" / f.name)

for f in spoof_selected:
    shutil.copy(f, BALANCED / "spoof" / f.name)

print("Balanced Dataset Created")
print("Images per class:", target)