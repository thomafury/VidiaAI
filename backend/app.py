from fastapi import FastAPI, UploadFile, File
import shutil
import os
import json

from extract_frames import extract_frames
from ocr import run_ocr_on_frames
from fastapi.middleware.cors import CORSMiddleware
from speech_processor import transcribe_video

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
FRAMES_DIR = "frames"
META_DIR = "metadata"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(META_DIR, exist_ok=True)


@app.post("/upload/")
async def upload_video(file: UploadFile = File(...)):

    video_name = file.filename.split(".")[0]
    video_path = f"uploads/{file.filename}"

    with open(video_path, "wb") as buffer:
        buffer.write(await file.read())

    # 🎧 AUDIO (Whisper)
    speech_results = transcribe_video(video_path)

    # 🖼️ OCR (frames already extracted)
    frames = extract_frames(video_path, f"frames/{video_name}")
    ocr_results = run_ocr_on_frames(frames)

    # 💾 SAVE BOTH
    data = {
        "speech": speech_results,
        "ocr": ocr_results
    }

    import json
    with open(f"metadata/{video_name}.json", "w") as f:
        json.dump(data, f, indent=2)

    return {
        "message": "processed",
        "video": video_name
    }
@app.get("/search/")
def search(query: str):

    import os
    import json

    results = []

    for file in os.listdir("metadata"):

        if file.endswith(".json"):

            video_name = file.replace(
                ".json",
                ""
            )

            path = f"metadata/{file}"

            with open(
                path,
                "r",
                encoding="utf-8"
            ) as f:
                data = json.load(f)

            # 🎧 SEARCH SPEECH
            for speech in data.get(
                "speech",
                []
            ):

                if query.lower() in speech.get(
                    "text",
                    ""
                ).lower():

                    results.append({
                        "video":
                            video_name,

                        "timestamp":
                            speech.get(
                                "start",
                                0
                            ),

                        "text":
                            speech.get(
                                "text",
                                ""
                            ),

                        "source":
                            "speech"
                    })

            # 🖼️ SEARCH OCR
            for ocr in data.get(
                "ocr",
                []
            ):

                if query.lower() in ocr.get(
                    "text",
                    ""
                ).lower():

                    results.append({
                        "video":
                            video_name,

                        "timestamp":
                            ocr.get(
                                "timestamp",
                                0
                            ),

                        "text":
                            ocr.get(
                                "text",
                                ""
                            ),

                        "source":
                            "ocr"
                    })

    return {
        "query": query,
        "results": results
    }