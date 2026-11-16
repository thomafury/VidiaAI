
import os
import gc
import uuid
import shutil
import logging
import mimetypes

from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from extract_frames import extract_frames
from ocr import run_ocr_on_frames
from speech_processor import transcribe_video

# --------------------------------------------------
# LOGGING
# --------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)

logger = logging.getLogger("vidiaai")

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "temp_uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE = 50 * 1024 * 1024
UPLOAD_CHUNK_SIZE = 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm"
}

BUCKET_NAME = "vidia-videos"

# Optimized frame extraction settings
FRAME_INTERVAL = 10
FRAME_MAX_DIMENSION = 640
FRAME_JPEG_QUALITY = 75

# --------------------------------------------------
# FASTAPI
# --------------------------------------------------

app = FastAPI(
    title="VidiaAI API",
    description="AI-powered semantic video search using OCR and speech transcription",
    version="1.0.0"
)

# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://vidiaai-frontend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# SUPABASE
# --------------------------------------------------

def get_supabase():

    from supabase import create_client

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise RuntimeError(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable"
        )

    return create_client(
        supabase_url,
        supabase_key
    )


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "VidiaAI API is running",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
def health():

    return {
        "status": "ok",
        "service": "vidiaai"
    }


# --------------------------------------------------
# VIDEO UPLOAD
# --------------------------------------------------

@app.post("/upload/")
def upload_video(file: UploadFile = File(...)):

    db = get_supabase()

    video_id = str(uuid.uuid4())

    original_filename = file.filename or "video.mp4"
    extension = Path(original_filename).suffix.lower()

    # Validate extension
    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail="Unsupported video format"
        )

    video_path = UPLOAD_DIR / f"{video_id}{extension}"
    frame_folder = UPLOAD_DIR / f"{video_id}_frames"

    storage_path = f"{video_id}{extension}"

    uploaded_to_storage = False
    video_metadata_saved = False

    try:

        # --------------------------------------------------
        # STEP 1: RECEIVE VIDEO
        # --------------------------------------------------

        logger.info("STEP 1: Receiving video: %s", original_filename)

        total_size = 0

        with open(video_path, "wb") as buffer:

            while True:

                chunk = file.file.read(UPLOAD_CHUNK_SIZE)

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

        logger.info(
            "STEP 2: Video saved temporarily. Size: %.2f MB",
            total_size / (1024 * 1024)
        )

        # --------------------------------------------------
        # STEP 3: EXTRACT OPTIMIZED FRAMES
        # --------------------------------------------------

        logger.info(
            "STEP 3: Extracting frames. Interval=%s, Max dimension=%s, JPEG=%s",
            FRAME_INTERVAL,
            FRAME_MAX_DIMENSION,
            FRAME_JPEG_QUALITY
        )

        frames = extract_frames(
            str(video_path),
            str(frame_folder),
            interval=FRAME_INTERVAL,
            max_dimension=FRAME_MAX_DIMENSION,
            jpeg_quality=FRAME_JPEG_QUALITY
        )

        logger.info(
            "STEP 4: Extracted %s optimized frames",
            len(frames)
        )

        # --------------------------------------------------
        # STEP 5: TESSERACT OCR
        # --------------------------------------------------

        logger.info("STEP 5: Starting Tesseract OCR")

        ocr_results = run_ocr_on_frames(frames)

        logger.info(
            "STEP 6: OCR completed: %s text segments",
            len(ocr_results)
        )

        # Release frame metadata before Whisper
        del frames
        gc.collect()

        # --------------------------------------------------
        # STEP 7: FASTER WHISPER
        # --------------------------------------------------

        logger.info("STEP 7: Starting Faster Whisper")

        speech_results = transcribe_video(
            str(video_path)
        )

        logger.info(
            "STEP 8: Transcription completed: %s segments",
            len(speech_results)
        )

        gc.collect()

        # --------------------------------------------------
        # STEP 9: UPLOAD VIDEO TO SUPABASE
        # --------------------------------------------------

        logger.info("STEP 9: Uploading video to Supabase Storage")

        media_type = (
            mimetypes.guess_type(video_path.name)[0]
            or "application/octet-stream"
        )

        # Read in chunks to avoid loading the complete video
        # into memory at once.
        with open(video_path, "rb") as video_file:

            video_data = bytearray()

            while True:

                chunk = video_file.read(UPLOAD_CHUNK_SIZE)

                if not chunk:
                    break

                video_data.extend(chunk)

            db.storage.from_(BUCKET_NAME).upload(
                storage_path,
                bytes(video_data),
                file_options={
                    "content-type": media_type,
                    "upsert": "false"
                }
            )

            del video_data

        uploaded_to_storage = True

        logger.info("STEP 10: Video uploaded to Supabase")

        # --------------------------------------------------
        # STEP 11: SAVE VIDEO METADATA
        # --------------------------------------------------

        logger.info("STEP 11: Saving video metadata")

        db.table("videos").insert({
            "id": video_id,
            "filename": original_filename,
            "storage_path": storage_path,
            "metadata": {
                "file_size": total_size,
                "extension": extension
            }
        }).execute()

        video_metadata_saved = True

        # --------------------------------------------------
        # STEP 12: PREPARE SEARCHABLE SEGMENTS
        # --------------------------------------------------

        logger.info("STEP 12: Preparing searchable segments")

        segments = []

        # Whisper transcript segments
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

        # OCR segments
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

        # --------------------------------------------------
        # STEP 13: SAVE SEARCHABLE SEGMENTS
        # --------------------------------------------------

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
        speech_count = len(speech_results)
        ocr_count = len(ocr_results)
        # --------------------------------------------------
        # RELEASE MEMORY
        # --------------------------------------------------

        del speech_results
        del ocr_results
        del segments

        gc.collect()

        # --------------------------------------------------
        # RESPONSE
        # --------------------------------------------------

        logger.info(
            "VIDEO PROCESSING COMPLETED: %s",
            video_id
        )

        return {
    "message": "processed",
    "video": video_id,
    "filename": original_filename,
    "speech_segments": speech_count,
    "ocr_results": ocr_count,
    "storage": "supabase"
}
    except HTTPException:
        raise

    except Exception:

        logger.exception("VIDEO PROCESSING FAILED")

        # Remove uploaded storage object if processing failed
        if uploaded_to_storage:

            try:

                db.storage.from_(BUCKET_NAME).remove(
                    [storage_path]
                )

                logger.info("Removed failed video from Supabase Storage")

            except Exception:

                logger.exception("Storage cleanup failed")

        # Remove video metadata if it was already saved
        if video_metadata_saved:

            try:

                db.table("videos").delete().eq(
                    "id",
                    video_id
                ).execute()

            except Exception:

                logger.exception("Video metadata cleanup failed")

        raise HTTPException(
            status_code=500,
            detail="Video processing failed. Check Render logs."
        )

    finally:

        # Close uploaded file
        file.file.close()

        # Remove temporary video
        if video_path.exists():

            try:
                video_path.unlink()
            except Exception:
                logger.exception("Temporary video cleanup failed")

        # Remove extracted frames
        if frame_folder.exists():

            shutil.rmtree(
                frame_folder,
                ignore_errors=True
            )

        gc.collect()


# --------------------------------------------------
# SEARCH VIDEOS
# --------------------------------------------------

@app.get("/search/")
def search_videos(query: str = ""):

    query = query.strip()

    if not query:

        return {
            "query": query,
            "results": []
        }

    try:

        db = get_supabase()

        response = (
            db.table("video_segments")
            .select(
                "video_id,content,start_time,end_time,content_type"
            )
            .ilike("content", f"%{query}%")
            .limit(100)
            .execute()
        )

        results = []

        for item in response.data or []:

            results.append({
                "video": item.get("video_id"),
                "timestamp": item.get("start_time", 0),
                "end_time": item.get("end_time", 0),
                "text": item.get("content", ""),
                "source": item.get("content_type", "unknown")
            })

        logger.info(
            "Search query '%s' returned %s results",
            query,
            len(results)
        )

        return {
            "query": query,
            "results": results
        }

    except Exception:

        logger.exception("VIDEO SEARCH FAILED")

        raise HTTPException(
            status_code=500,
            detail="Search failed. Check backend logs."
        )


# --------------------------------------------------
# VIDEO PLAYBACK / REDIRECT
# --------------------------------------------------

@app.get("/videos/{video_id}")
def get_video(video_id: str):

    try:

        db = get_supabase()

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

        signed_url = (
            db.storage
            .from_(BUCKET_NAME)
            .create_signed_url(storage_path, 3600)
        )

        return {
            "video_url": signed_url["signedURL"]
        }

    except HTTPException:
        raise

    except Exception:

        logger.exception("VIDEO RETRIEVAL FAILED")

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve video"
        )
