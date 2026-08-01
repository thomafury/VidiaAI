import whisper

model = whisper.load_model("base")


def transcribe_video(video_path):

    print("Starting Whisper...")

    result = model.transcribe(
        video_path
    )

    transcript = []

    for segment in result["segments"]:

        transcript.append({
            "timestamp":
                round(
                    segment["start"],
                    2
                ),
            "text":
                segment["text"]
        })

    print("Whisper complete")

    return transcript