
import easyocr
import gc

reader = None


def get_ocr_reader():
    global reader

    if reader is None:
        print("Loading EasyOCR model...", flush=True)

        reader = easyocr.Reader(
            ['en'],
            gpu=False,
            verbose=False
        )

        print("EasyOCR loaded successfully!", flush=True)

    return reader


def run_ocr_on_frames(frames_data):
    global reader

    results = []

    try:
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

            extracted_text = " ".join(text_list).strip()

            if extracted_text:
                results.append({
                    "timestamp": round(item["timestamp"], 2),
                    "text": extracted_text
                })

        print(
            f"OCR completed: {len(results)} text segments",
            flush=True
        )

        return results

    finally:
        # Release the EasyOCR model before loading Whisper
        reader = None
        gc.collect()

        print("EasyOCR model released", flush=True)
