import cv2
from pathlib import Path
from tqdm import tqdm

SOURCE = Path("sample_dataset")
DEST = Path("sample_face_crops")

(DEST / "real").mkdir(parents=True, exist_ok=True)
(DEST / "spoof").mkdir(parents=True, exist_ok=True)

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

for cls in ["real", "spoof"]:

    files = list((SOURCE / cls).glob("*"))

    for file in tqdm(files, desc=cls):

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

        x, y, w, h = faces[0]

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

print("Cropping Complete")