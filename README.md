# Face Attendance System

A modern, full-stack Face Recognition Attendance System leveraging advanced AI techniques. The application provides an automated way to track attendance using facial recognition, alongside a web-based dashboard for administration, student management, and analytics.

## Project Structure

The project is divided into a backend (FastAPI) and a frontend (React + Vite).

- `backend/`: Contains the FastAPI application, database configurations, and AI model integrations.
- `frontend/`: Contains the React + Vite frontend application, utilizing TailwindCSS for styling.
- `dataset/`: Contains datasets and face encodings for recognition.
- `FaceAttendanceAI/`: Contains scripts for AI model training, dataset preparation, and evaluation (e.g., anti-spoofing models).

## Features

- **Automated Face Recognition:** Utilizes `DeepFace` and OpenCV for seamless face detection and recognition.
- **Anti-Spoofing Integration:** Includes a pre-trained ONNX model (`anti_spoofing_model.onnx`) to detect spoofing attempts and ensure the authenticity of the attendance process.
- **Comprehensive API:** Built with FastAPI, offering endpoints for authentication, student management, leave requests, analytics, and video processing.
- **Modern Dashboard:** A reactive frontend built with React, Vite, and TailwindCSS for admins to monitor attendance and manage the system.
- **Local Database:** Uses SQLite (`attendance.db` and `face_recognition.db`) for lightweight and fast local data storage.

## Tech Stack

### Backend
- **Framework:** FastAPI
- **AI/ML:** OpenCV, DeepFace, MediaPipe, ONNXRuntime, TensorFlow/Keras
- **Database:** SQLite (via SQLAlchemy)
- **Authentication:** passlib, python-jose

### Frontend
- **Framework:** React 19, Vite
- **Styling:** TailwindCSS 4, PostCSS
- **Routing:** React Router DOM
- **HTTP Client:** Axios

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License.
