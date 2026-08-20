import cv2
import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_large
from torchvision import transforms
from PIL import Image

# -------------------
# Device
# -------------------

device = "cuda" if torch.cuda.is_available() else "cpu"

# -------------------
# Load Model
# -------------------

model = mobilenet_v3_large(weights=None)

model.classifier[3] = nn.Linear(
    model.classifier[3].in_features,
    2
)

model.load_state_dict(
    torch.load(
        "models/best_model.pth",
        map_location=device
    )
)

model.to(device)
model.eval()

# -------------------
# Transform
# -------------------

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

# -------------------
# Webcam
# -------------------

cap = cv2.VideoCapture(0)

while True:

    ret, frame = cap.read()

    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    image = Image.fromarray(rgb)

    image = transform(image)

    image = image.unsqueeze(0).to(device)

    with torch.no_grad():

        output = model(image)

        prediction = output.argmax(1).item()

    if prediction == 0:
        label = "SPOOF"
    else:
        label = "REAL"

    cv2.putText(
        frame,
        label,
        (20, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    cv2.imshow("Anti-Spoofing Test", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()