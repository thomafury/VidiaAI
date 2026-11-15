
import cv2
import os


def extract_frames(video_path, output_folder):

    os.makedirs(output_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise RuntimeError("Could not open video")

    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps <= 0:
        cap.release()
        raise RuntimeError("Invalid video FPS")

    duration = (
        cap.get(cv2.CAP_PROP_FRAME_COUNT) / fps
    )

    frames = []

    timestamp = 0

    while timestamp < duration:

        cap.set(
            cv2.CAP_PROP_POS_MSEC,
            timestamp * 1000
        )

        success, frame = cap.read()

        if not success:
            break

        filename = os.path.join(
            output_folder,
            f"frame_{int(timestamp)}.jpg"
        )

        cv2.imwrite(filename, frame)

        frames.append({
            "file": filename,
            "timestamp": timestamp
        })

        timestamp += 5

    cap.release()

    print(
        f"Extracted {len(frames)} frames",
        flush=True
    )

    return frames
