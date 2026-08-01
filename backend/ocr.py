import easyocr

reader = easyocr.Reader(['en'])

def run_ocr_on_frames(frames_data):
    results = []

    for item in frames_data:
        path = item["file"]
        timestamp = item["timestamp"]

        text_list = reader.readtext(path, detail=0)
        text = " ".join(text_list)

        results.append({
            "timestamp": round(timestamp, 2),
            "text": text
        })

    return results