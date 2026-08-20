from pathlib import Path
import shutil

REAL_DIR = Path("final_dataset/real")
SPOOF_DIR = Path("final_dataset/spoof")

REAL_DIR.mkdir(parents=True, exist_ok=True)
SPOOF_DIR.mkdir(parents=True, exist_ok=True)

# -------------------
# OULU
# -------------------

oulu_real = Path("datasets/Oulu-NPU/true")
oulu_spoof = Path("datasets/Oulu-NPU/false")

# -------------------
# CASIA
# -------------------

casia_train = Path(
    "datasets/Casia-fasd/train_img/train_img/color"
)

casia_test = Path(
    "datasets/Casia-fasd/test_img/test_img/color"
)

# -------------------
# CELEBA
# -------------------

celeba_train = Path(
    "datasets/CelebA_Spoof/Data/train"
)

celeba_test = Path(
    "datasets/CelebA_Spoof/Data/test"
)

# -------------------
# COPY OULU
# -------------------

for img in oulu_real.glob("*"):
    shutil.copy(img, REAL_DIR / f"oulu_{img.name}")

for img in oulu_spoof.glob("*"):
    shutil.copy(img, SPOOF_DIR / f"oulu_{img.name}")

# -------------------
# COPY CASIA
# -------------------

for folder in [casia_train, casia_test]:

    for img in folder.glob("*.jpg"):

        name = img.name.lower()

        if "real" in name:
            shutil.copy(
                img,
                REAL_DIR / f"casia_{img.name}"
            )

        elif "fake" in name:
            shutil.copy(
                img,
                SPOOF_DIR / f"casia_{img.name}"
            )

# -------------------
# COPY CELEBA
# -------------------

for root in [celeba_train, celeba_test]:

    for person in root.iterdir():

        if not person.is_dir():
            continue

        live_dir = person / "live"
        spoof_dir = person / "spoof"

        if live_dir.exists():

            for img in live_dir.glob("*.jpg"):

                shutil.copy(
                    img,
                    REAL_DIR /
                    f"celeba_{person.name}_{img.name}"
                )

        if spoof_dir.exists():

            for img in spoof_dir.glob("*.jpg"):

                shutil.copy(
                    img,
                    SPOOF_DIR /
                    f"celeba_{person.name}_{img.name}"
                )

print("Dataset Build Complete")