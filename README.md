# 🎥 VidIA AI – Intelligent Video Analysis & Search Platform

## Overview

VidIA AI is an AI-powered video intelligence platform that transforms videos into searchable knowledge. It automatically extracts spoken content and on-screen text, allowing users to search videos using keywords and instantly find the relevant timestamps.

Instead of manually watching hours of footage, users can upload a video, let the AI process it, and search for specific words or phrases to jump directly to the relevant moments.

---

## Key Features

### 📤 Video Upload

* Upload videos through a simple web interface.
* Backend automatically stores and processes uploaded files.

### 🎙️ Speech-to-Text Transcription

* Uses OpenAI Whisper to convert spoken audio into text.
* Preserves timestamps for every speech segment.
* Enables searching through spoken dialogue.

### 📝 OCR (Optical Character Recognition)

* Extracts frames from uploaded videos.
* Detects and reads visible text using EasyOCR.
* Associates detected text with timestamps.

### 🔍 Intelligent Video Search

* Search across:

  * Spoken words
  * On-screen text
* Returns:

  * Video name
  * Timestamp
  * Matching text
  * Source (Speech or OCR)

### 💾 Metadata Generation

* Automatically generates structured JSON metadata for every processed video.
* Stores speech transcripts and OCR results for fast retrieval.

### 🌐 Full-Stack Web Application

* React frontend for uploading videos and searching content.
* FastAPI backend for AI processing and search APIs.

---

# How It Works

```text
                    Upload Video
                          │
                          ▼
                  FastAPI Backend
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
 Speech-to-Text (Whisper)          Frame Extraction
        │                                   │
        ▼                                   ▼
 Speech Transcript                  OCR (EasyOCR)
        │                                   │
        └──────────────┬────────────────────┘
                       ▼
               Metadata Generation
                       ▼
                 Keyword Search API
                       ▼
         Matching Video + Timestamp
```

---

# Technology Stack

## Frontend

* React
* JavaScript
* HTML5
* CSS

## Backend

* FastAPI
* Python

## AI & Computer Vision

* OpenAI Whisper
* EasyOCR
* OpenCV

## Data Storage

* JSON Metadata

---

# Example Workflow

1. Upload a video.
2. VidIA AI extracts audio and video frames.
3. Speech is transcribed using Whisper.
4. Text appearing in video frames is extracted using EasyOCR.
5. Metadata is generated automatically.
6. Search for any keyword.
7. Instantly receive the matching timestamp and video segment.

---

# Example Search Result

Search:

```text
"Artificial Intelligence"
```

Output:

```text
Video: AI_Tutorial.mp4

Timestamp: 03:42

Source: Speech

Text:
"...artificial intelligence is transforming modern software..."
```

---

# Potential Use Cases

### 🎬 Content Creators

* Quickly locate specific moments in long recordings.
* Find clips for YouTube Shorts, Instagram Reels and TikTok.
* Reuse old content without manually reviewing every video.

### 📺 YouTubers

* Search hundreds of uploaded videos for specific topics.
* Locate memorable quotes or scenes within seconds.
* Speed up video editing workflows.

### 🎓 Educators & Students

* Search lecture recordings for important concepts.
* Jump directly to explanations without rewatching entire classes.

### 🏢 Businesses

* Search training videos for policies or procedures.
* Find discussions from recorded meetings.
* Build searchable internal video knowledge bases.

### 📰 Journalists & Researchers

* Search interviews and archived footage.
* Locate exact moments where people mention specific topics.

### ⚽ Sports & Event Analysis

* Search commentary and event recordings.
* Retrieve important highlights and timestamps.

---

# Future Improvements

* Semantic search using vector embeddings.
* ChromaDB integration for Retrieval-Augmented Generation (RAG).
* AI-generated video summaries.
* Object detection and scene understanding.
* Face recognition and speaker identification.
* Cloud deployment with Docker.
* Multi-user authentication and project management.
* Video player with automatic timestamp navigation.
* Support for additional languages and multilingual search.

---

# Project Status

✅ Video Upload

✅ Speech Transcription

✅ OCR Extraction

✅ Metadata Generation

✅ Keyword Search

🚧 Semantic Search

🚧 Cloud Deployment

🚧 Docker Support

---

# Author

**Thomas PJ**

Frontend Developer | AI & Machine Learning Engineer

Passionate about building intelligent applications that combine modern web technologies with Artificial Intelligence to solve real-world problems.
