
import whisper

model = None


def get_whisper_model():
    global model

    if model is None:
        print("Loading Whisper tiny model...", flush=True)

        model = whisper.load_model(
            "tiny",
            device="cpu"
        )

        print("Whisper tiny model loaded!", flush=True)

    return model


def transcribe_video(video_path):

    print("Starting Whisper...", flush=True)

    whisper_model = get_whisper_model()

    print("Starting transcription...", flush=True)

    result = whisper_model.transcribe(
        video_path,
        fp16=False
    )

    transcript = []

    for segment in result["segments"]:
        transcript.append({
            "timestamp": round(segment["start"], 2),
            "text": segment["text"].strip()
        })

    print(
        f"Whisper completed: {len(transcript)} segments",
        flush=True
    )

    return transcript
