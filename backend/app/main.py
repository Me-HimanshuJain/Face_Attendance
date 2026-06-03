import os
import logging
# Suppress annoying TensorFlow startup warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
logging.getLogger("tensorflow").setLevel(logging.ERROR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as auth_router
from app.api.admin import router as admin_router
from app.api.student import router as student_router
from app.api.leaves import router as leaves_router
from app.api.analytics import router as analytics_router
from app.api.video import router as video_router
from app.api.setup import router as setup_router
from app.db.database import engine, Base
from app.db import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Face Recognition Attendance API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api/admin")
app.include_router(student_router, prefix="/api/student")
app.include_router(leaves_router, prefix="/api/leaves")
app.include_router(analytics_router, prefix="/api/analytics")
app.include_router(video_router, prefix="/api/video")
app.include_router(setup_router, prefix="/api/setup")

@app.get("/")
def read_root():
    return {"message": "Welcome to Face Recognition Attendance System"}
