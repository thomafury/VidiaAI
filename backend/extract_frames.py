
import cv2
import os


def extract_frames(video_path, output_folder, interval=5, max_dimension=1280):
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

    try:
        while timestamp < duration:
            cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)

            success, frame = cap.read()

            if not success:
                break

            height, width = frame.shape[:2]

            scale = min(
                1.0,
                max_dimension / max(width, height)
            )

            if scale < 1.0:
                new_width = int(width * scale)
                new_height = int(height * scale)

                frame = cv2.resize(
                    frame,
                    (new_width, new_height),
                    interpolation=cv2.INTER_AREA
                )

            filename = os.path.join(
                output_folder,
                f"frame_{int(timestamp)}.jpg"
            )

            saved = cv2.imwrite(
                filename,
                frame,
                [cv2.IMWRITE_JPEG_QUALITY, 80]
            )

            if saved:
                frames.append({
                    "file": filename,
                    "timestamp": timestamp
                })

            del frame
            timestamp += interval

    finally:
        cap.release()

    print(f"Extracted {len(frames)} frames", flush=True)

    return frames
