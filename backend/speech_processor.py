import whisper

model = None

def get_whisper_model():
    global model

    if model is None:
        print("Loading Whisper model...")
        model = whisper.load_model("base")
        print("Whisper model loaded")

    return model


def transcribe_video(video_path):
    print("Starting Whisper...")

    whisper_model = get_whisper_model()

    result = whisper_model.transcribe(video_path)

    transcript = []

    for segment in result["segments"]:
        transcript.append({
            "timestamp": round(segment["start"], 2),
            "text": segment["text"]
        })

    print("Whisper complete")

    return transcript