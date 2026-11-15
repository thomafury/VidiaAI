
from faster_whisper import WhisperModel

model = None


def get_whisper_model():
    global model

    if model is None:
        print("Loading Faster Whisper tiny INT8...", flush=True)

        model = WhisperModel(
            "tiny",
            device="cpu",
            compute_type="int8",
            cpu_threads=1
        )

        print("Faster Whisper loaded successfully!", flush=True)

    return model


def transcribe_video(video_path):
    whisper_model = get_whisper_model()

    print("Starting transcription...", flush=True)

    segments, info = whisper_model.transcribe(
        video_path,
        beam_size=1,
        vad_filter=True
    )

    transcript = []

    for segment in segments:
        transcript.append({
            "timestamp": round(segment.start, 2),
            "text": segment.text.strip()
        })

    print(
        f"Transcription completed: {len(transcript)} segments",
        flush=True
    )

    return transcript
