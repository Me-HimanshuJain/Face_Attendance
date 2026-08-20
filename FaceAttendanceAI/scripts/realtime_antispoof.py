import cv2
import torch
import torch.nn as nn

from torchvision import models
from torchvision import transforms
from PIL import Image

# --------------------------
# Device
# --------------------------

device = torch.device(
    "cuda" if torch.cuda.is_available()
    else "cpu"
)

print("Device:", device)

# --------------------------
# Model
# --------------------------

model = models.mobilenet_v3_large()

model.classifier[3] = nn.Linear(
    model.classifier[3].in_features,
    2
)

model.load_state_dict(
    torch.load(
        "models/mobilenetv3_best.pth",
        map_location=device
    )
)

model = model.to(device)

model.eval()

# --------------------------
# Transform
# --------------------------

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])

# --------------------------
# Face Detector
# --------------------------

face_detector = cv2.CascadeClassifier(
    "models/haarcascade_frontalface_default.xml"
)

# --------------------------
# Labels
# --------------------------

classes = [
    "real",
    "spoof"
]

# --------------------------
# Webcam
# --------------------------

cap = cv2.VideoCapture(0)

while True:

    ret, frame = cap.read()

    if not ret:
        break

    gray = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2GRAY
    )

    faces = face_detector.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=5
    )

    for (x,y,w,h) in faces:

        face = frame[
            y:y+h,
            x:x+w
        ]

        rgb = cv2.cvtColor(
            face,
            cv2.COLOR_BGR2RGB
        )

        image = Image.fromarray(rgb)

        tensor = transform(image)

        tensor = tensor.unsqueeze(0)

        tensor = tensor.to(device)

        with torch.no_grad():

            output = model(tensor)

            probabilities = torch.softmax(
                output,
                dim=1
            )

            confidence = (
                probabilities.max().item()
                * 100
            )

            pred = output.argmax(1).item()

            label = classes[pred]

        color = (
            (0,255,0)
            if label == "real"
            else (0,0,255)
        )

        cv2.rectangle(
            frame,
            (x,y),
            (x+w,y+h),
            color,
            2
        )

        text = (
            f"{label.upper()} "
            f"{confidence:.1f}%"
        )

        cv2.putText(
            frame,
            text,
            (x,y-10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            color,
            2
        )

    cv2.imshow(
        "Anti Spoofing",
        frame
    )

    key = cv2.waitKey(1)

    if key == 27:
        break

cap.release()

cv2.destroyAllWindows()