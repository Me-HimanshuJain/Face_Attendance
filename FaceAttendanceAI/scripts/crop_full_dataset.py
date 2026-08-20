import cv2
from pathlib import Path
from tqdm import tqdm

SOURCE = Path("balanced_dataset")
DEST = Path("face_crops")

(DEST / "real").mkdir(parents=True, exist_ok=True)
(DEST / "spoof").mkdir(parents=True, exist_ok=True)

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

for cls in ["real", "spoof"]:

    files = list((SOURCE / cls).glob("*"))

    print(f"\nProcessing {cls}: {len(files)} images")

    for file in tqdm(files):

        try:
            img = cv2.imread(str(file))

            if img is None:
                continue

            gray = cv2.cvtColor(
                img,
                cv2.COLOR_BGR2GRAY
            )

            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(50, 50)
            )

            if len(faces) == 0:
                continue

            # Largest face
            x, y, w, h = max(
                faces,
                key=lambda f: f[2] * f[3]
            )

            face = img[y:y+h, x:x+w]

            face = cv2.resize(
                face,
                (224, 224)
            )

            save_path = (
                DEST /
                cls /
                file.name
            )

            cv2.imwrite(
                str(save_path),
                face
            )

        except:
            pass

print("\nFace Cropping Complete")