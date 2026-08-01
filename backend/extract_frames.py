def extract_frames(video_path, output_folder):
    import cv2
    import os

    os.makedirs(output_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 25

    # ✅ CHANGE HERE: 5 second gap
    frame_interval = int(fps * 5)

    count = 0
    saved = 0

    frames = []

    while True:
        success, frame = cap.read()
        if not success:
            break

        if count % frame_interval == 0:
            timestamp = count / fps

            filename = f"{output_folder}/frame_{int(timestamp)}.jpg"
            cv2.imwrite(filename, frame)

            frames.append({
                "file": filename,
                "timestamp": timestamp
            })

            saved += 1

        count += 1

    cap.release()

    print(f"Saved {saved} frames (5s interval)")
    return frames