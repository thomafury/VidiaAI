
import os
import json
import uuid
import logging
import mimetypes
from pathlib import Path
import shutil
import gc

from extract_frames import extract_frames
from ocr import run_ocr_on_frames
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from supabase import create_client, Client
from speech_processor import transcribe_video

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vidiaai")

app = FastAPI(title="VidiaAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
       "https://vidiaai-frontend.onrender.com",

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME = "vidia-videos"

supabase: Client | None = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase connected")
else:
    logger.warning("Supabase credentials are missing")

# Temporary local storage for video processing
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "temp_uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE = 50 * 1024 * 1024


def get_supabase():
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured"
        )
    return supabase


@app.get("/")
def home():
    return {
        "message": "VidiaAI API is running",
        "status": "healthy"
    }


@app.get("/health")
def health():
    return {"status": "ok"}



@app.post("/upload/")
def upload_video(file: UploadFile = File(...)):

    db = get_supabase()

    video_id = str(uuid.uuid4())

    extension = Path(file.filename or "video.mp4").suffix.lower()

    if extension not in [".mp4", ".mov", ".avi", ".mkv", ".webm"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format"
        )

    video_path = UPLOAD_DIR / f"{video_id}{extension}"
    storage_path = f"{video_id}{extension}"
    frame_folder = UPLOAD_DIR / f"{video_id}_frames"

    uploaded_to_storage = False

    try:
        # STEP 1: Receive video
        logger.info("STEP 1: Receiving video")

        total_size = 0

        with open(video_path, "wb") as buffer:
            while True:
                chunk = file.file.read(1024 * 1024)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_UPLOAD_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="Video exceeds 50 MB limit"
                    )

                buffer.write(chunk)

        if total_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded video is empty"
            )

        logger.info("STEP 2: Video saved temporarily")

        # STEP 3: Extract video frames
        logger.info("STEP 3: Extracting video frames")

        frames = extract_frames(
            str(video_path),
            str(frame_folder),
            interval=5,
            max_dimension=1280
        )

        logger.info(
            "STEP 4: Extracted %s frames",
            len(frames)
        )

        # STEP 5: Run OCR
        logger.info("STEP 5: Starting EasyOCR")

        ocr_results = run_ocr_on_frames(frames)

        logger.info(
            "STEP 6: OCR completed: %s text segments",
            len(ocr_results)
        )

        # Release frame metadata before Whisper
        del frames
        gc.collect()

        # STEP 7: Run Faster Whisper
        logger.info("STEP 7: Starting Faster Whisper")

        speech_results = transcribe_video(str(video_path))

        logger.info(
            "STEP 8: Transcription completed: %s segments",
            len(speech_results)
        )

        gc.collect()

        # STEP 9: Upload video to Supabase Storage
        logger.info("STEP 9: Uploading video to Supabase")

        media_type = (
            mimetypes.guess_type(video_path.name)[0]
            or "application/octet-stream"
        )

        db.storage.from_(BUCKET_NAME).upload(
            storage_path,
            video_path.read_bytes(),
            file_options={
                "content-type": media_type,
                "upsert": "false"
            }
        )

        uploaded_to_storage = True

        logger.info("STEP 10: Video uploaded to Supabase")

        # STEP 11: Save video metadata
        db.table("videos").insert({
            "id": video_id,
            "filename": file.filename or video_path.name,
            "storage_path": storage_path,
            "metadata": {
                "file_size": total_size,
                "extension": extension
            }
        }).execute()

        # STEP 12: Prepare searchable segments
        segments = []

        # Save Whisper transcript segments
        for speech in speech_results:

            timestamp = speech.get(
                "timestamp",
                speech.get("start", 0)
            )

            segments.append({
                "video_id": video_id,
                "content": speech.get("text", ""),
                "start_time": timestamp,
                "end_time": speech.get("end", timestamp),
                "content_type": "transcript"
            })

        # Save OCR segments
        for item in ocr_results:

            text = item.get("text", "").strip()

            if not text:
                continue

            timestamp = item.get("timestamp", 0)

            segments.append({
                "video_id": video_id,
                "content": text,
                "start_time": timestamp,
                "end_time": timestamp,
                "content_type": "ocr"
            })

        # STEP 13: Insert searchable segments
        if segments:
            db.table("video_segments").insert(
                segments
            ).execute()

        logger.info(
            "STEP 13: Saved %s searchable segments "
            "(%s transcript, %s OCR)",
            len(segments),
            len(speech_results),
            len(ocr_results)
        )

        return {
            "message": "processed",
            "video": video_id,
            "filename": file.filename,
            "speech_segments": len(speech_results),
            "ocr_results": len(ocr_results),
            "storage": "supabase"
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("VIDEO PROCESSING FAILED")

        # Remove uploaded video if database processing failed
        if uploaded_to_storage:
            try:
                db.storage.from_(BUCKET_NAME).remove(
                    [storage_path]
                )
            except Exception:
                logger.exception("Storage cleanup failed")

        raise HTTPException(
            status_code=500,
            detail="Video processing failed. Check Render logs."
        )

    finally:
        file.file.close()

        # Remove temporary video
        if video_path.exists():
            video_path.unlink()

        # Remove extracted frames
        if frame_folder.exists():
            shutil.rmtree(
                frame_folder,
                ignore_errors=True
            )

        gc.collect()



@app.get("/search/")
def search(query: str):

    db = get_supabase()

    if not query.strip():
        return {
            "query": query,
            "results": []
        }

    try:
        response = (
            db.table("video_segments")
            .select("video_id, content, start_time, end_time, content_type")
            .ilike("content", f"%{query.strip()}%")
            .limit(100)
            .execute()
        )

        results = []

        for item in response.data:
            results.append({
                "video": item["video_id"],
                "timestamp": item["start_time"],
                "end_time": item["end_time"],
                "text": item["content"],
                "source": item["content_type"]
            })

        return {
            "query": query,
            "results": results
        }

    except Exception:
        logger.exception("SEARCH FAILED")

        raise HTTPException(
            status_code=500,
            detail="Search failed"
        )


@app.get("/videos/{video_id}")
def get_video(video_id: str):

    db = get_supabase()

    try:
        video_id = str(uuid.UUID(video_id))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid video ID"
        )

    try:
        response = (
            db.table("videos")
            .select("storage_path")
            .eq("id", video_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Video not found"
            )

        storage_path = response.data[0]["storage_path"]

        signed = db.storage.from_(BUCKET_NAME).create_signed_url(
            storage_path,
            3600
        )

        signed_url = signed["signedURL"]

        if signed_url.startswith("/"):
         signed_url = (
        SUPABASE_URL.rstrip("/")
        + "/storage/v1"
        + signed_url
    )
        return RedirectResponse(url=signed_url)

    except HTTPException:
        raise

    except Exception:
        logger.exception("VIDEO PLAYBACK FAILED")

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve video"
        )
