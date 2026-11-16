import { useRef, useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [fileName, setFileName] = useState("");
const [processingStage, setProcessingStage] = useState(0);
const [processingMessage, setProcessingMessage] = useState("");
  const videoRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const uploadVideo = async () => {
  if (!file) {
    alert("Choose a video first");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  setLoading(true);
  setProcessingStage(0);
  setProcessingMessage("Uploading video...");

  const stages = [
    "Uploading video...",
    "Starting Whisper AI...",
    "Transcribing audio...",
    "Generating searchable segments...",
    "Saving video and transcript to database..."
  ];

  let currentStage = 0;

  const stageInterval = setInterval(() => {
    currentStage = Math.min(
      currentStage + 1,
      stages.length - 1
    );

    setProcessingStage(currentStage);
    setProcessingMessage(stages[currentStage]);

  }, 4000);

  try {
    const response = await axios.post(
      `${API_URL}/upload/`,
      formData
    );

    console.log(response.data);

    clearInterval(stageInterval);

    setProcessingStage(5);
    setProcessingMessage("Video processing completed!");

    setVideoUrl(URL.createObjectURL(file));
    setFileName(file.name);

    alert("Video uploaded successfully");

  } catch (error) {
    clearInterval(stageInterval);

    console.error(error);

    setProcessingMessage("Video processing failed");

    alert("Upload failed");

  } finally {
    setLoading(false);
  }
};

  const searchKeyword = async () => {
    if (!query) return;
    try {
      const response = await axios.get(`${API_URL}/search/?query=${query}`);
      setResults(response.data.results);
    } catch (error) {
      console.error(error);
    }
  };

  const jumpToTimestamp = async (result) => {
  try {
        console.log("RESULT CARD CLICKED:", result);

        const videoId = result.video;
        const timestamp = Number(result.timestamp || 0);

        const response = await fetch(
            `${API_URL}/videos/${videoId}`
        );

        if (!response.ok) {
            throw new Error("Failed to retrieve video URL");
        }

        const data = await response.json();

        console.log("SIGNED VIDEO URL:", data.video_url);

        if (!data.video_url) {
            throw new Error("Video URL missing");
        }

        const video = videoRef.current;

        if (!video) {
            throw new Error("Video element not found");
        }

        video.src = data.video_url;
        video.load();

        video.onloadedmetadata = () => {
            video.currentTime = timestamp;
            video.play().catch(console.error);
        };

        video.onerror = () => {
            console.error("VIDEO ERROR:", {
                error: video.error,
                source: video.currentSrc
            });
        };

    } catch (error) {
        console.error("Video playback failed:", error);
    }
};

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoMark}>V</div>
            <div style={styles.titleBlock}>
              <h1 style={styles.title}>
                Vidia<span style={styles.titleAccent}>AI</span>
              </h1>
              <p style={styles.subtitle}>
                Semantic video search engine
              </p>
            </div>
          </div>
        </header>

        {/* Upload Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Upload Video</h2>
            <span style={styles.cardHint}>MP4, AVI, MOV · Max 500MB</span>
          </div>
          <div style={styles.uploadSection}>
            <label style={styles.fileLabel}>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  if (e.target.files[0]) {
                    setFileName(e.target.files[0].name);
                  }
                }}
                style={styles.fileInput}
              />
              <div style={styles.fileDropZone}>
                <span style={styles.dropIcon}>↑</span>
                <span style={styles.fileName}>
                  {fileName || "Drop your video here or click to browse"}
                </span>
              </div>
            </label>

            <button
              onClick={uploadVideo}
              style={{
                ...styles.primaryButton,
                ...(loading ? styles.primaryButtonDisabled : {}),
              }}
              disabled={loading}
            >
              {loading ? (
                <span style={styles.loadingSpinner}>
                  <span style={styles.spinner}></span> Processing
                </span>
              ) : (
                "Upload & Process"
              )}
            </button>
          </div>

          {loading && (
  <div style={styles.loadingBar}>

    <div style={styles.loadingInfo}>
      <span style={styles.loadingText}>
        {processingMessage}
      </span>

      <span style={styles.loadingPercent}>
        {processingStage < 5
          ? `${Math.round(processingStage / 5 * 100)}%`
          : "100%"}
      </span>
    </div>

    <div style={{
      ...styles.loadingProgress,
      width: `${processingStage / 5 * 100}%`
    }} />

    <div style={{ marginTop: "16px" }}>
      {[
        "Uploading video",
        "Starting Whisper AI",
        "Transcribing audio",
        "Generating searchable segments",
        "Saving results"
      ].map((stage, index) => (
        <div
          key={stage}
          style={{
            padding: "8px 0",
            color: index <= processingStage
              ? "#e5e7eb"
              : "#4b5563",
            fontSize: "0.8rem"
          }}
        >
          {index < processingStage
            ? "✓"
            : index === processingStage
              ? "◉"
              : "○"
          }{" "}
          {stage}
        </div>
      ))}
    </div>

  </div>
)}
        </div>

        {/* Search Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Search Video</h2>
            <span style={styles.cardHint}>Natural language queries</span>
          </div>
          <div style={styles.searchSection}>
            <input
              type="text"
              placeholder="e.g., 'person talking about AI'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={styles.searchInput}
              onKeyDown={(e) => e.key === "Enter" && searchKeyword()}
            />
            <button onClick={searchKeyword} style={styles.searchButton}>
              Search
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div style={styles.resultsSection}>
          <div style={styles.resultsHeader}>
            <h2 style={styles.resultsTitle}>Search Results</h2>
            {results.length > 0 && (
              <span style={styles.resultCount}>
                {results.length} {results.length === 1 ? "moment" : "moments"}
              </span>
            )}
          </div>

          {results.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>No results yet</p>
              <p style={styles.emptyText}>
                Upload a video and search for specific moments using natural language.
              </p>
            </div>
          )}

          <div style={styles.resultsList}>
            {results.map((item, index) => (
              <div
                key={index}
                onClick={() => jumpToTimestamp(item)}
                style={styles.resultCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#111318";
                  e.currentTarget.style.borderColor = "#2a2e37";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0b0d10";
                  e.currentTarget.style.borderColor = "#1f232b";
                }}
              >
                <div style={styles.resultHeader}>
                  <div style={styles.resultBadges}>
                    <span style={styles.timestampBadge}>
                      {item.timestamp}s
                    </span>
                    <span style={styles.sourceBadge}>
                      {item.source || "Uploaded Video"}
                    </span>
                  </div>
                  <span style={styles.resultIndex}>#{index + 1}</span>
                </div>
                <p style={styles.resultText}>
                  {item.text || "No description available"}
                </p>
                {item.video && (
                  <p style={styles.resultVideo}>File: {item.video}</p>
                )}
                <div style={styles.resultAction}>
                  <span  onClick={() => jumpToTimestamp(item)} style={styles.jumpHint}>Click to jump to moment</span>
                  <span style={styles.playIcon}>▶</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Player */}
        (
          <div style={styles.videoSection}>
            <div style={styles.videoCard}>
              <div style={styles.videoHeader}>
                <div style={styles.videoTitleWrapper}>
                  <span style={styles.videoDot}></span>
                  <h3 style={styles.videoTitle}>Now Playing</h3>
                </div>
                <button
                  onClick={() => {
                    setVideoUrl(null);
                    setFileName("");
                  }}
                  style={styles.closeButton}
                >
                  ✕
                </button>
              </div>
              <div style={styles.videoWrapper}>
                <video
  ref={videoRef}
  width="100%"
  controls
  style={styles.videoPlayer}
/>
                  
              </div>
              <div style={styles.videoFooter}>
                <span style={styles.videoFileName}>{fileName}</span>
                <span style={styles.videoStatus}>Ready</span>
              </div>
            </div>
          </div>
        
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    width: "100%",
    background: "#050607",
    padding: "40px 20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "860px",
    margin: "0 auto",
  },

  /* HEADER */
  header: {
    marginBottom: "40px",
    paddingBottom: "28px",
    borderBottom: "1px solid #14171c",
  },

  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  logoMark: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#050607",
    fontSize: "1.3rem",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "-0.03em",
  },

  titleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  title: {
    fontSize: "1.5rem",
    fontWeight: "700",
    letterSpacing: "-0.02em",
    margin: 0,
    color: "#ffffff",
    lineHeight: 1.1,
  },

  titleAccent: {
    color: "#6b7280",
    fontWeight: "400",
    marginLeft: "2px",
  },

  subtitle: {
    color: "#6b7280",
    fontSize: "0.8rem",
    fontWeight: "400",
    margin: 0,
    letterSpacing: "0.02em",
  },

  /* CARDS */
  card: {
    background: "#0b0d10",
    borderRadius: "10px",
    padding: "20px 24px",
    marginBottom: "12px",
    border: "1px solid #1f232b",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "16px",
  },

  cardTitle: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#e5e7eb",
    margin: 0,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },

  cardHint: {
    color: "#4b5563",
    fontSize: "0.75rem",
    fontWeight: "400",
  },

  /* UPLOAD */
  uploadSection: {
    display: "flex",
    gap: "10px",
    alignItems: "stretch",
    flexWrap: "wrap",
  },

  fileLabel: {
    display: "block",
    cursor: "pointer",
    flex: 1,
    minWidth: "200px",
  },

  fileInput: {
    display: "none",
  },

  fileDropZone: {
    border: "1px dashed #2a2e37",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "border-color 0.2s, background 0.2s",
    background: "#050607",
    cursor: "pointer",
    height: "100%",
    boxSizing: "border-box",
  },

  dropIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    background: "#14171c",
    color: "#9ca3af",
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  fileName: {
    color: "#9ca3af",
    fontSize: "0.85rem",
    fontWeight: "400",
  },

  primaryButton: {
    background: "#ffffff",
    color: "#050607",
    border: "none",
    padding: "0 24px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s, opacity 0.2s",
    whiteSpace: "nowrap",
    minHeight: "56px",
  },

  primaryButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  loadingSpinner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },

  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(5, 6, 7, 0.2)",
    borderTop: "2px solid #050607",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  loadingBar: {
    marginTop: "14px",
    padding: "12px 16px",
    background: "#050607",
    borderRadius: "8px",
    border: "1px solid #1f232b",
  },

  loadingProgress: {
    height: "2px",
    background: "#ffffff",
    borderRadius: "2px",
    animation: "progress 2s ease-in-out infinite",
    width: "0%",
  },

  loadingInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "8px",
  },

  loadingText: {
    color: "#6b7280",
    fontSize: "0.75rem",
    margin: 0,
  },

  loadingPercent: {
    color: "#e5e7eb",
    fontSize: "0.75rem",
    fontWeight: "600",
    margin: 0,
  },

  /* SEARCH */
  searchSection: {
    display: "flex",
    gap: "10px",
    alignItems: "stretch",
  },

  searchInput: {
    flex: 1,
    padding: "12px 16px",
    border: "1px solid #2a2e37",
    borderRadius: "8px",
    fontSize: "0.9rem",
    transition: "border-color 0.2s",
    outline: "none",
    background: "#050607",
    color: "#ffffff",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "44px",
  },

  searchButton: {
    background: "#14171c",
    color: "#ffffff",
    border: "1px solid #2a2e37",
    padding: "0 24px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
    whiteSpace: "nowrap",
    minHeight: "44px",
  },

  /* RESULTS */
  resultsSection: {
    background: "#0b0d10",
    borderRadius: "10px",
    padding: "20px 24px",
    border: "1px solid #1f232b",
    marginBottom: "12px",
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "16px",
  },

  resultsTitle: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#e5e7eb",
    margin: 0,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },

  resultCount: {
    background: "#14171c",
    color: "#9ca3af",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "500",
    border: "1px solid #2a2e37",
  },

  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
  },

  emptyTitle: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#6b7280",
    margin: "0 0 6px 0",
  },

  emptyText: {
    color: "#4b5563",
    fontSize: "0.85rem",
    margin: 0,
    lineHeight: "1.6",
  },

  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  resultCard: {
    padding: "16px 20px",
    border: "1px solid #1f232b",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    background: "#0b0d10",
  },

  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  resultBadges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  timestampBadge: {
    background: "#14171c",
    color: "#e5e7eb",
    padding: "3px 10px",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: "600",
    fontFamily: "monospace",
    border: "1px solid #2a2e37",
  },

  sourceBadge: {
    background: "#14171c",
    color: "#9ca3af",
    padding: "3px 10px",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: "500",
    border: "1px solid #2a2e37",
  },

  resultIndex: {
    color: "#4b5563",
    fontSize: "0.7rem",
    fontWeight: "500",
    fontFamily: "monospace",
  },

  resultText: {
    color: "#d1d5db",
    fontSize: "0.88rem",
    margin: "0 0 4px 0",
    lineHeight: "1.55",
  },

  resultVideo: {
    color: "#6b7280",
    fontSize: "0.78rem",
    margin: "0 0 8px 0",
  },

  resultAction: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid #14171c",
  },

  jumpHint: {
    color: "#6b7280",
    fontSize: "0.72rem",
    fontWeight: "500",
  },

  playIcon: {
    color: "#e5e7eb",
    fontSize: "0.7rem",
  },

  /* VIDEO */
  videoSection: {
    marginTop: "12px",
  },

  videoCard: {
    background: "#0b0d10",
    borderRadius: "10px",
    padding: "20px 24px",
    border: "1px solid #1f232b",
  },

  videoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },

  videoTitleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  videoDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
  },

  videoTitle: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#e5e7eb",
    margin: 0,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },

  closeButton: {
    background: "#14171c",
    border: "1px solid #2a2e37",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
    color: "#9ca3af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  videoWrapper: {
    borderRadius: "8px",
    overflow: "hidden",
    background: "#000",
    position: "relative",
    aspectRatio: "16/9",
    border: "1px solid #14171c",
  },

  videoPlayer: {
    width: "100%",
    height: "100%",
    display: "block",
    background: "#000",
    objectFit: "contain",
  },

  videoFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "12px",
  },

  videoFileName: {
    color: "#6b7280",
    fontSize: "0.78rem",
    fontFamily: "monospace",
  },

  videoStatus: {
    color: "#10b981",
    fontSize: "0.72rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
};

/* global styles injected once */
const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes progress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #050607;
    color-scheme: dark;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::selection {
    background: #ffffff;
    color: #050607;
  }
  input:focus {
    border-color: #4b5563 !important;
  }
  button:hover {
    opacity: 0.9;
  }
  button:active {
    transform: scale(0.98);
  }
  label:hover > div {
    border-color: #4b5563;
    background: #0b0d10;
  }
  @media (max-width: 640px) {
    .upload-section,
    .search-section {
      flex-direction: column;
    }
    .primary-button,
    .search-button {
      width: 100%;
      min-height: 48px;
    }
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #050607;
  }
  ::-webkit-scrollbar-thumb {
    background: #1f232b;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #2a2e37;
  }
`;
document.head.appendChild(styleTag);

export default App;