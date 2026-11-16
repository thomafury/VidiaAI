
import logging
import pytesseract
from pathlib import Path

logger = logging.getLogger("vidiaai")


def run_ocr_on_frames(frames_data):
    """
    Extract text from video frames using Tesseract OCR.

    Input:
        [
            {"file": "path/to/frame.jpg", "timestamp": 5.0}
        ]

    Output:
        [
            {"timestamp": 5.0, "text": "Recognized text"}
        ]
    """

    results = []

    logger.info("Starting Tesseract OCR on %s frames", len(frames_data))

    for index, item in enumerate(frames_data):
        frame_path = Path(item["file"])

        if not frame_path.exists():
            logger.warning("Frame not found: %s", frame_path)
            continue

        try:
            logger.info(
                "OCR processing frame %s/%s",
                index + 1,
                len(frames_data)
            )

            extracted_text = pytesseract.image_to_string(
                str(frame_path),
                lang="eng",
                config="--oem 1 --psm 6",
                timeout=15
            )

            extracted_text = " ".join(extracted_text.split())

            if extracted_text:
                results.append({
                    "timestamp": round(float(item["timestamp"]), 2),
                    "text": extracted_text
                })

        except RuntimeError as error:
            logger.warning(
                "OCR timeout for frame %s: %s",
                frame_path,
                error
            )

        except Exception:
            logger.exception("OCR failed for frame: %s", frame_path)

    logger.info(
        "Tesseract OCR completed: %s text segments from %s frames",
        len(results),
        len(frames_data)
    )

    return results
