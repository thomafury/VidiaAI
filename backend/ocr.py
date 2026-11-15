
import easyocr

reader = None


def get_ocr_reader():

    global reader

    if reader is None:

        print("Loading EasyOCR model...", flush=True)

        reader = easyocr.Reader(
            ['en'],
            gpu=False
        )

        print("EasyOCR loaded successfully!", flush=True)

    return reader


def run_ocr_on_frames(frames_data):

    results = []

    ocr_reader = get_ocr_reader()

    for index, item in enumerate(frames_data):

        print(
            f"OCR processing frame {index + 1}/{len(frames_data)}",
            flush=True
        )

        text_list = ocr_reader.readtext(
            item["file"],
            detail=0
        )

        results.append({
            "timestamp": round(item["timestamp"], 2),
            "text": " ".join(text_list)
        })

    print("OCR processing completed", flush=True)

    return results
