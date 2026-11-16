# 🎥 VidiaAI – Intelligent Video Analysis & Search Platform

**Turn videos into searchable knowledge using AI.**

VidiaAI is an AI-powered video intelligence platform that transforms video content into searchable information. It extracts spoken dialogue and on-screen text, stores the extracted content with timestamps, and allows users to search videos to find relevant moments instantly.

Instead of manually watching hours of footage, users can upload videos, process them through AI-powered pipelines, and search for specific words or phrases.

## 🚀 Live Demo

- **Frontend:** https://vidiaai-frontend.onrender.com
- **Backend API:** https://vidiaai-1.onrender.com
- **API Documentation:** https://vidiaai-1.onrender.com/docs

*Note: Availability and processing performance depend on the hosting provider's free-tier resources.*

## ✨ Key Features

### 📤 Video Upload
- Upload videos through a React web interface.
- Supported formats: MP4, MOV, AVI, MKV and WebM.
- Application-level maximum upload size: 50 MB.
- Video files are stored in Supabase Storage.
- Backend validates uploaded file types and size.

### 🎙️ Speech-to-Text Transcription
- Uses Faster Whisper for speech recognition.
- Uses the tiny model with INT8 quantization to reduce resource requirements.
- Generates timestamped speech segments.
- Uses Voice Activity Detection (VAD) to filter non-speech portions.
- Makes spoken dialogue searchable.

### 📝 Optical Character Recognition (OCR)
- Uses Tesseract OCR to extract visible text from video frames.
- OpenCV handles frame extraction and image preprocessing.
- Extracts frames at configurable intervals.
- Associates detected text with timestamps.
- Stores OCR output for keyword searching.

### 🔍 Intelligent Video Search

Search across:
- Spoken dialogue.
- Text displayed inside videos.

Search results contain:
- Video ID.
- Timestamp.
- Matching text.
- Content source (OCR or transcript).

### 🎬 Video Playback
- Retrieve stored videos using Supabase signed URLs.
- Associate search results with their original video.
- Use timestamps to locate relevant content in the video player.

### 💾 Database and Storage
- Supabase Storage for video files.
- Supabase PostgreSQL for video metadata and extracted segments.
- Temporary local files are cleaned up after processing.

## 🏗️ System Architecture

```text
                  React Frontend
                       |
                       v
                  FastAPI Backend
                       |
             Video Upload & Validation
                       |
                       v
                 Supabase Storage
                       |
                       v
                Video Processing
                       |
              +--------+--------+
              |                 |
              v                 v
         OpenCV Frames     Audio Processing
              |                 |
              v                 v
         Tesseract OCR     Faster Whisper
              |                 |
              v                 v
          OCR Text         Transcripts
              |                 |
              +--------+--------+
                       |
                       v
               Supabase PostgreSQL
                       |
                       v
                 Search API
                       |
                       v
             Search Results + Timestamps
                       |
                       v
                Video Playback
```

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, HTML5, CSS |
| Backend | Python, FastAPI |
| Computer Vision | OpenCV, Tesseract OCR |
| Speech Recognition | Faster Whisper |
| Model Optimization | INT8 quantization, VAD |
| Database | Supabase PostgreSQL |
| Object Storage | Supabase Storage |
| Deployment | Render, Docker |
| API | REST API |

## ⚡ Resource Optimization for Free-Tier Deployment

One of the main engineering challenges was deploying an AI-powered video processing application within the memory and CPU limitations of a free cloud hosting environment.

The Render free instance used for this project provides approximately **512 MB RAM**. Running OCR and speech recognition models without optimisation can exceed the available resources or result in request timeouts.

Several optimisations were introduced.

### 1. OCR Optimization

**Initial implementation:** EasyOCR, which relies on PyTorch and introduces substantial memory overhead.

**Optimised implementation:** Tesseract OCR.

Additional optimisations:
- Frame extraction interval increased from 5 seconds to 10 seconds.
- Maximum frame dimension reduced from 1280 px to 640 px.
- Frames converted to grayscale.
- JPEG quality set to 75.
- Temporary frame files deleted after processing.

These changes reduce the number and size of images processed by the OCR pipeline.

### 2. Speech Recognition Optimization

The speech recognition pipeline uses Faster Whisper with:
- Tiny model variant.
- INT8 quantization.
- Voice Activity Detection (VAD).

These settings reduce model memory requirements and processing overhead compared with larger model configurations.

### 3. Upload and Storage Optimization

- Application-level upload limit: 50 MB.
- Incoming uploads are read in 1 MB chunks into temporary local files.
- Video files are stored in Supabase Storage.
- Temporary video and frame files are removed after processing.
- Python garbage collection is used to help release unused objects.

**Important:** Chunked file reading reduces the need to read the entire incoming upload into memory at once. It does not make the entire pipeline fully streaming, since subsequent storage and processing stages may still use memory.

### 4. Database Optimization

OCR and speech segments use a shared database structure rather than separate tables.

The `video_segments` table contains:

| Column | Purpose |
|---|---|
| `id` | Segment identifier |
| `video_id` | Associated video |
| `content` | Extracted OCR or transcript text |
| `start_time` | Segment start timestamp |
| `end_time` | Segment end timestamp |
| `content_type` | Identifies OCR or transcript content |

The `content_type` field distinguishes between OCR and speech transcription.

### 5. Deployment Constraints and Current Limitations

The current deployment is a resource-constrained prototype.

- Maximum application upload size is 50 MB.
- Actual processing capacity depends on video duration, resolution, CPU usage and available RAM.
- Processing both OCR and transcription can cause request timeouts.
- Long videos may exceed the available processing time.
- The 50 MB upload limit does not guarantee successful processing of every video under that size.
- Background job processing and independent OCR/transcription tasks are planned improvements.

These optimisations demonstrate practical experience adapting AI workloads to limited cloud infrastructure.

## 🔄 Example Workflow

1. User uploads a video.
2. Backend validates the file and stores it temporarily.
3. OpenCV extracts video frames.
4. Tesseract extracts visible text.
5. Faster Whisper processes audio and generates transcripts.
6. Extracted segments are stored in Supabase PostgreSQL.
7. User searches for a keyword.
8. Backend returns matching video segments and timestamps.
9. The application retrieves the video from Supabase Storage.

## 🔎 Example Search Result

**Search query:** Artificial Intelligence

**Example output:**

```text
Video: AI_Tutorial.mp4

Timestamp: 03:42

Source: Transcript

Matching text:
"...artificial intelligence is transforming
modern software..."
```

## 💡 Potential Use Cases

- **Content Creators:** Find specific moments in long recordings and locate clips for editing.
- **YouTubers:** Search previously uploaded content for quotes and topics.
- **Education:** Find explanations and important concepts in lecture recordings.
- **Businesses:** Search training videos and recorded meetings.
- **Journalists:** Locate statements in interviews and archived footage.
- **Sports Analysis:** Search commentary and event recordings.

## 🔮 Future Improvements

- Semantic search using sentence embeddings.
- ChromaDB integration for vector search.
- Retrieval-Augmented Generation (RAG).
- AI-generated video summaries.
- Object detection and scene understanding.
- Multilingual speech recognition and search.
- Background processing with job queues.
- Independent OCR and transcription processing modes.
- Processing status tracking.
- Multi-user authentication and project management.
- Improved support for long videos through scalable worker infrastructure.



VidiaAI/
│
├── backend/
│   ├── app.py
│   ├── extract_frames.py
│   ├── ocr.py
│   ├── speech_processor.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── README.md
└── .gitignore




## 👨‍💻 Author

**Thomas PJ**

MSc Data Science, AI & Digital Business  
Frontend Developer | AI & Machine Learning Engineer

Interested in building practical AI applications combining machine learning, computer vision, NLP and modern full-stack technologies.

