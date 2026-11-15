
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import os
import json
import uuid
import logging

from extract_frames import extract_frames
from ocr import run_ocr_on_frames
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
FRAMES_DIR = Path("frames")
META_DIR = Path("metadata")

for directory in [UPLOAD_DIR, FRAMES_DIR, META_DIR]:
    directory.mkdir(parents=True, exist_ok=True)


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

    video_name = video_id
    video_path = UPLOAD_DIR / f"{video_name}{extension}"
    frames_path = FRAMES_DIR / video_name
    metadata_path = META_DIR / f"{video_name}.json"

    try:
        logger.info("STEP 1: Receiving video")

        # Save in chunks instead of loading entire video into RAM
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer,
                length=1024 * 1024
            )

        logger.info(
            "STEP 2: Video saved: %s",
            video_path
        )

        logger.info("STEP 3: Starting Whisper")

        speech_results = transcribe_video(str(video_path))

        logger.info(
            "STEP 4: Whisper completed. Segments: %s",
            len(speech_results)
        )

        logger.info("STEP 5: Extracting video frames")

        frames = extract_frames(
            str(video_path),
            str(frames_path)
        )

        logger.info(
            "STEP 6: Frames extracted: %s",
            len(frames)
        )

        logger.info("STEP 7: Starting EasyOCR")

        ocr_results = run_ocr_on_frames(frames)

        logger.info(
            "STEP 8: OCR completed. Results: %s",
            len(ocr_results)
        )

        data = {
            "speech": speech_results,
            "ocr": ocr_results
        }

        with open(
            metadata_path,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        logger.info("STEP 9: Processing completed")

        return {
            "message": "processed",
            "video": video_name,
            "speech_segments": len(speech_results),
            "ocr_results": len(ocr_results)
        }

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

        video_name = metadata_file.stem

        with open(
            metadata_file,
            "r",
            encoding="utf-8"
        ) as f:
            data = json.load(f)

        for speech in data.get("speech", []):

            if query.lower() in speech.get("text", "").lower():

                results.append({
                    "video": video_name,
                    "timestamp": speech.get("timestamp", 0),
                    "text": speech.get("text", ""),
                    "source": "speech"
                })

        for ocr in data.get("ocr", []):

            if query.lower() in ocr.get("text", "").lower():

                results.append({
                    "video": video_name,
                    "timestamp": ocr.get("timestamp", 0),
                    "text": ocr.get("text", ""),
                    "source": "ocr"
                })

    return {
        "query": query,
        "results": results
    }
