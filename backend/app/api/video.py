import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
from datetime import datetime, date
from sqlalchemy.orm import Session
import json
import time

from app.db.database import SessionLocal
from app.db import models
from app.services import face_service

router = APIRouter()

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Global list to hold recent recognition events for SSE
recognition_events = []

# Global flag to control camera loop
camera_active = False

def generate_frames():
    db: Session = SessionLocal()
    
    # Pre-load all embeddings to memory to keep the loop fast.
    active_embeddings = []
    
    # Load Students
    students = db.query(models.Student).filter(models.Student.is_active == True).all()
    for s in students:
        for e in s.face_embeddings:
            if e.status == 'active':
                active_embeddings.append({
                    "id": s.id,
                    "name": s.full_name,
                    "role": "STUDENT",
                    "embedding": np.frombuffer(e.embedding_data, dtype=np.float32)
                })
                
    # Load Admins
    admins = db.query(models.Admin).filter(models.Admin.is_active == True).all()
    for a in admins:
        role_name = "ADMIN"
        if a.role and a.role.name.upper() == "SUPER ADMIN":
            role_name = "SUPER ADMIN"
        elif a.role:
            role_name = "ADMIN" # fallback
            
        for e in a.face_embeddings:
            if e.status == 'active':
                active_embeddings.append({
                    "id": a.id,
                    "name": a.full_name,
                    "role": role_name,
                    "embedding": np.frombuffer(e.embedding_data, dtype=np.float32)
                })
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        db.close()
        return

    frame_count = 0
    recognized_names = {}
    
    # Track when a student was last recognized to prevent rapid-fire scanning (cooldown in seconds)
    last_recognized = {}
    COOLDOWN_SECONDS = 10 

    global camera_active
    camera_active = True
    
    try:
        while camera_active:
            success, frame = cap.read()
            if not success:
                break
                
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
            
            run_heavy = (frame_count % 10 == 0)
            current_time = time.time()
            
            for (x, y, w, h) in faces:
                # Default to red color for scanning
                color = (0, 0, 255)
                
                box_center = (x + w//2, y + h//2)
                matched_student_id = None
                
                for cx, cy, c_name, c_id in recognized_names.values():
                    if abs(cx - box_center[0]) < 50 and abs(cy - box_center[1]) < 50:
                        matched_student_id = c_id
                        color = (0, 255, 0) # Green if previously matched
                        break
                
                if run_heavy:
                    face_crop = frame[y:y+h, x:x+w]
                    is_real = face_service.check_liveness(face_crop)
                    
                    if is_real:
                        embedding = face_service.generate_embedding(face_crop, enforce_detection=False)
                        if embedding is not None:
                            best_student_match = None
                            best_student_score = 0
                            best_admin_match = None
                            best_admin_score = 0
                            THRESHOLD = 0.65
                            
                            for emb_data in active_embeddings:
                                sim = face_service.cosine_similarity(embedding, emb_data["embedding"])
                                if emb_data["role"] == "STUDENT":
                                    if sim > best_student_score:
                                        best_student_score = sim
                                        best_student_match = emb_data
                                else:
                                    if sim > best_admin_score:
                                        best_admin_score = sim
                                        best_admin_match = emb_data
                            
                            best_match = None
                            best_score = 0
                            
                            # Prioritize student matches
                            if best_student_score > THRESHOLD:
                                best_match = best_student_match
                                best_score = best_student_score
                            elif best_admin_score > THRESHOLD:
                                best_match = best_admin_match
                                best_score = best_admin_score
                            
                            if best_match:
                                color = (0, 255, 0) # Green for success
                                matched_id = best_match['id']
                                matched_role = best_match['role']
                                recognized_names[f"{x}_{y}"] = (box_center[0], box_center[1], best_match['name'], matched_id)
                                
                                # Process only if cooldown has passed
                                last_time = last_recognized.get(f"{matched_role}_{matched_id}", 0)
                                if current_time - last_time > COOLDOWN_SECONDS:
                                    direction = ""
                                    
                                    # Log attendance only for students
                                    if matched_role == "STUDENT":
                                        today = date.today()
                                        records_count = db.query(models.AttendanceRecord).filter(
                                            models.AttendanceRecord.student_id == matched_id,
                                            models.AttendanceRecord.date == today
                                        ).count()
                                        
                                        # Even count means they are scanning IN. Odd count means OUT.
                                        direction = "In" if records_count % 2 == 0 else "Out"
                                        
                                        new_record = models.AttendanceRecord(
                                            student_id=matched_id,
                                            date=today,
                                            status=direction,
                                            confidence_score=float(best_score)
                                        )
                                        db.add(new_record)
                                        db.commit()
                                        
                                    # Update cooldown
                                    last_recognized[f"{matched_role}_{matched_id}"] = current_time
                                    
                                    # Emit event to frontend
                                    recognition_events.append(json.dumps({
                                        "id": matched_id,
                                        "name": best_match['name'],
                                        "role": matched_role,
                                        "direction": direction,
                                        "timestamp": datetime.now().isoformat()
                                    }))
                            else:
                                color = (0, 0, 255) # Red for unknown
                    else:
                        color = (0, 0, 255) # Red for spoof
                
                # Draw the bounding box (no text as requested)
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                    
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                   
            frame_count += 1

    except GeneratorExit:
        # Client disconnected (navigated away) — release camera immediately
        pass
    finally:
        cap.release()
        db.close()

@router.get("/feed")
def video_feed():
    global camera_active
    camera_active = True
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/stop_feed")
def stop_feed():
    global camera_active
    camera_active = False
    return {"message": "Camera stopped"}

@router.get("/events")
async def sse(request: Request):
    """Server-Sent Events endpoint to stream recognition events to the frontend."""
    async def event_generator():
        last_idx = len(recognition_events)
        while True:
            if await request.is_disconnected():
                break
            if len(recognition_events) > last_idx:
                for i in range(last_idx, len(recognition_events)):
                    yield f"data: {recognition_events[i]}\n\n"
                last_idx = len(recognition_events)
            await asyncio.sleep(0.5)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

