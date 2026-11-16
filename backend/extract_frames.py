
import cv2
import os
import logging

logger = logging.getLogger("vidiaai")


def extract_frames(
    video_path,
    output_folder,
    interval=10,
    max_dimension=640,
    jpeg_quality=75
):
    """
    Extract optimized frames for Tesseract OCR.

    Defaults:
        - One frame every 10 seconds
        - Maximum image dimension: 640px
        - JPEG quality: 75
    """

    os.makedirs(output_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise RuntimeError("Could not open video")

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)

    if fps <= 0 or frame_count <= 0:
        cap.release()
        raise RuntimeError("Invalid video FPS or frame count")

    duration = frame_count / fps

    frames = []
    timestamp = 0
    frame_index = 0

    try:
        while timestamp < duration:

            cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)

            success, frame = cap.read()

            if not success:
                break

            height, width = frame.shape[:2]

            # Resize frame to reduce OCR processing time
            scale = min(
                1.0,
                max_dimension / max(width, height)
            )

            if scale < 1.0:
                frame = cv2.resize(
                    frame,
                    (
                        int(width * scale),
                        int(height * scale)
                    ),
                    interpolation=cv2.INTER_AREA
                )

            # Convert to grayscale to simplify OCR input
            gray = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2GRAY
            )

            filename = os.path.join(
                output_folder,
                f"frame_{frame_index}.jpg"
            )

            saved = cv2.imwrite(
                filename,
                gray,
                [cv2.IMWRITE_JPEG_QUALITY, jpeg_quality]
            )

            if saved:
                frames.append({
                    "file": filename,
                    "timestamp": round(timestamp, 2)
                })

            del frame
            del gray

            timestamp += interval
            frame_index += 1

    finally:
        cap.release()

    logger.info(
        "Extracted %s optimized frames from %.2f seconds of video",
        len(frames),
        duration
    )

    return frames
