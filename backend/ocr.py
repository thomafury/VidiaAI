import easyocr

reader = None

def get_ocr_reader():
    global reader

    if reader is None:
        print("Loading EasyOCR model...")
        reader = easyocr.Reader(['en'])
        print("EasyOCR model loaded")

    return reader


def run_ocr_on_frames(frames_data):
    results = []

    ocr_reader = get_ocr_reader()

    for item in frames_data:
        path = item["file"]
        timestamp = item["timestamp"]

        text_list = ocr_reader.readtext(path, detail=0)
        text = " ".join(text_list)

        results.append({
            "timestamp": round(timestamp, 2),
            "text": text
        })

    return results