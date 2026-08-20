import cv2
import mediapipe as mp
from pathlib import Path
from tqdm import tqdm

mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(
    model_selection=1,
    min_detection_confidence=0.5
)

SOURCE = Path("balanced_dataset")
DEST = Path("face_crops")

(DEST / "real").mkdir(parents=True, exist_ok=True)
(DEST / "spoof").mkdir(parents=True, exist_ok=True)

for cls in ["real", "spoof"]:

    images = list((SOURCE / cls).glob("*"))

    for img_path in tqdm(images, desc=cls):

        img = cv2.imread(str(img_path))

        if img is None:
            continue

        h, w, _ = img.shape

        rgb = cv2.cvtColor(
            img,
            cv2.COLOR_BGR2RGB
        )

        results = face_detector.process(rgb)

        if not results.detections:
            continue

        det = results.detections[0]

        box = det.location_data.relative_bounding_box

        x = int(box.xmin * w)
        y = int(box.ymin * h)

        bw = int(box.width * w)
        bh = int(box.height * h)

        x = max(0, x)
        y = max(0, y)

        crop = img[y:y+bh, x:x+bw]

        if crop.size == 0:
            continue

        crop = cv2.resize(
            crop,
            (224,224)
        )

        save_path = (
            DEST /
            cls /
            img_path.name
        )

        cv2.imwrite(
            str(save_path),
            crop
        )

print("DONE")