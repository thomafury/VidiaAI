
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import json
import uuid
import logging

from speech_processor import transcribe_video

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vidiaai")

app = FastAPI(title="VidiaAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-vercel-domain.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
META_DIR = Path("metadata")

UPLOAD_DIR.mkdir(exist_ok=True)
META_DIR.mkdir(exist_ok=True)

MAX_UPLOAD_SIZE = 50 * 1024 * 1024


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

    video_id = str(uuid.uuid4())

    extension = Path(file.filename or "video.mp4").suffix.lower()

    if extension not in [".mp4", ".mov", ".avi", ".mkv", ".webm"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format"
        )

    video_path = UPLOAD_DIR / f"{video_id}{extension}"
    metadata_path = META_DIR / f"{video_id}.json"

    try:
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

        logger.info("STEP 2: Video saved: %s", video_path)

        logger.info("STEP 3: Starting Faster Whisper")

        speech_results = transcribe_video(str(video_path))

        logger.info(
            "STEP 4: Transcription completed: %s segments",
            len(speech_results)
        )

        data = {
            "speech": speech_results,
            "ocr": []
        }

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        logger.info("STEP 5: Metadata saved")

        return {
            "message": "processed",
            "video": video_id,
            "speech_segments": len(speech_results),
            "ocr_results": 0
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("VIDEO PROCESSING FAILED")

        raise HTTPException(
            status_code=500,
            detail="Video processing failed. Check Render logs."
        )

    finally:
        file.file.close()


@app.get("/search/")
def search(query: str):

    results = []

    for metadata_file in META_DIR.glob("*.json"):

        with open(metadata_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        video_name = metadata_file.stem

        for speech in data.get("speech", []):

            if query.lower() in speech.get("text", "").lower():

                results.append({
                    "video": video_name,
                    "timestamp": speech.get("timestamp", 0),
                    "text": speech.get("text", ""),
                    "source": "speech"
                })

    return {
        "query": query,
        "results": results
    }
