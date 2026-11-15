import { useRef, useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [fileName, setFileName] = useState("");

  const videoRef = useRef(null);
const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
  const uploadVideo = async () => {
    if (!file) {
      alert("Choose a video first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const response = await axios.post(
  `${API_URL}/upload/`,
  formData
);

      console.log(response.data);

      alert("Video uploaded successfully");

      setVideoUrl(URL.createObjectURL(file));
      setFileName(file.name);
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }

    setLoading(false);
  };

  const searchKeyword = async () => {
    if (!query) return;

    try {
      const response = await axios.get(
        `${API_URL}/search/?query=${query}`
      );

      setResults(response.data.results);
    } catch (error) {
      console.error(error);
    }
  };

  const jumpToTimestamp = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
  };

  return (
    <div style={styles.app}>
      {/* Background decorative elements */}
      <div style={styles.bgBlob1}></div>
      <div style={styles.bgBlob2}></div>
      <div style={styles.bgBlob3}></div>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoIcon}>🎬</span>
            <h1 style={styles.title}>
              <span style={styles.titleGradient}>Vidia</span> AI
            </h1>
          </div>
          <p style={styles.subtitle}>
            Next-generation semantic video search • Find moments instantly
          </p>
        </header>

        {/* Upload Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📤</span>
            <h2 style={styles.cardTitle}>Upload Video</h2>
          </div>
          <div style={styles.uploadSection}>
            <div style={styles.fileInputWrapper}>
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
                  <span style={styles.dropIcon}>📁</span>
                  <span style={styles.fileName}>
                    {fileName || "Drop your video here or click to browse"}
                  </span>
                  <span style={styles.fileHint}>MP4, AVI, MOV • Max 500MB</span>
                </div>
              </label>
            </div>

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
                  <span style={styles.spinner}></span> Processing...
                </span>
              ) : (
                "🚀 Upload & Process"
              )}
            </button>
          </div>

          {loading && (
            <div style={styles.loadingBar}>
              <div style={styles.loadingProgress}></div>
              <div style={styles.loadingInfo}>
                <span style={styles.loadingText}>Indexing video content...</span>
                <span style={styles.loadingPercent}>0%</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>🔍</span>
            <h2 style={styles.cardTitle}>Search Video</h2>
          </div>
          <div style={styles.searchSection}>
            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>🔎</span>
             <input
  type="text"
  placeholder="Search for moments... e.g., 'person talking about AI'"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  style={{ ...styles.searchInput, color: "black" }}
  onKeyDown={(e) => e.key === "Enter" && searchKeyword()}
/>
            </div>
            <button onClick={searchKeyword} style={styles.searchButton}>
              <span style={styles.searchBtnIcon}>⚡</span> Search
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div style={styles.resultsSection}>
          <div style={styles.resultsHeader}>
            <div style={styles.resultsTitleWrapper}>
              <span style={styles.resultsIcon}>📋</span>
              <h2 style={styles.resultsTitle}>Search Results</h2>
            </div>
            {results.length > 0 && (
              <span style={styles.resultCount}>{results.length} moments found</span>
            )}
          </div>

          {results.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>🎯</span>
              <p style={styles.emptyTitle}>No results yet</p>
              <p style={styles.emptyText}>
                Upload a video and search for specific moments using natural language.
                <br />
                Try searching for objects, actions, or spoken words.
              </p>
            </div>
          )}

          <div style={styles.resultsList}>
            {results.map((item, index) => (
              <div
                key={index}
                onClick={() => jumpToTimestamp(item.timestamp)}
                style={styles.resultCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8f7ff";
                  e.currentTarget.style.borderColor = "#7c5cfc";
                  e.currentTarget.style.transform = "translateX(8px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateX(0px)";
                }}
              >
                <div style={styles.resultHeader}>
                  <div style={styles.resultBadges}>
                    <span style={styles.timestampBadge}>
                      ⏱️ {item.timestamp}s
                    </span>
                    <span style={styles.sourceBadge}>
                      📹 {item.source || "Uploaded Video"}
                    </span>
                  </div>
                  <span style={styles.resultIndex}>#{index + 1}</span>
                </div>
                <p style={styles.resultText}>
                  {item.text || "No description available"}
                </p>
                {item.video && (
                  <p style={styles.resultVideo}>🎥 File: {item.video}</p>
                )}
                <div style={styles.resultAction}>
                  <span style={styles.jumpHint}>
                    ▶ Click to jump to this moment
                  </span>
                  <span style={styles.playIcon}>▶</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Player */}
        {videoUrl && (
          <div style={styles.videoSection}>
            <div style={styles.videoCard}>
              <div style={styles.videoHeader}>
                <div style={styles.videoTitleWrapper}>
                  <span style={styles.videoIcon}>▶️</span>
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
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              </div>
              <div style={styles.videoFooter}>
                <span style={styles.videoFileName}>📄 {fileName}</span>
                <span style={styles.videoStatus}>● Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)",
    padding: "20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },

  bgBlob1: {
    position: "fixed",
    top: "-200px",
    right: "-200px",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(124, 92, 252, 0.08) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  },

  bgBlob2: {
    position: "fixed",
    bottom: "-150px",
    left: "-150px",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(236, 72, 153, 0.06) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  },

  bgBlob3: {
    position: "fixed",
    top: "50%",
    left: "50%",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(96, 165, 250, 0.04) 0%, transparent 70%)",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  header: {
    textAlign: "center",
    marginBottom: "40px",
    padding: "20px 0",
  },

  logoWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "12px",
  },

  logoIcon: {
    fontSize: "2.8rem",
  },

  title: {
    fontSize: "3.2rem",
    fontWeight: "800",
    letterSpacing: "-0.03em",
    margin: 0,
  },

  titleGradient: {
    background: "linear-gradient(135deg, #7c5cfc 0%, #ec4899 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  subtitle: {
    color: "#6b7280",
    fontSize: "1.1rem",
    fontWeight: "400",
    margin: "8px 0 0 0",
    letterSpacing: "0.3px",
  },

  card: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "28px 32px",
    marginBottom: "20px",
    boxShadow: "0 8px 32px rgba(124, 92, 252, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.7)",
    transition: "all 0.3s ease",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
  },

  cardIcon: {
    fontSize: "1.4rem",
  },

  cardTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },

  uploadSection: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  fileInputWrapper: {
    flex: 1,
    minWidth: "200px",
  },

  fileLabel: {
    display: "block",
    cursor: "pointer",
    width: "100%",
  },

  fileInput: {
    display: "none",
  },

  fileDropZone: {
    border: "2px dashed #d1d5db",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    transition: "all 0.3s ease",
    background: "rgba(255, 255, 255, 0.5)",
    cursor: "pointer",
  },

  fileDropZoneHover: {
    borderColor: "#7c5cfc",
    background: "rgba(124, 92, 252, 0.05)",
  },

  dropIcon: {
    display: "block",
    fontSize: "2rem",
    marginBottom: "8px",
  },

  fileName: {
    display: "block",
    color: "#374151",
    fontSize: "0.95rem",
    fontWeight: "500",
    marginBottom: "4px",
  },

  fileHint: {
    display: "block",
    color: "#9ca3af",
    fontSize: "0.8rem",
  },

  primaryButton: {
    background: "linear-gradient(135deg, #7c5cfc 0%, #6366f1 100%)",
    color: "#fff",
    border: "none",
    padding: "14px 32px",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(124, 92, 252, 0.3)",
    whiteSpace: "nowrap",
    minWidth: "180px",
  },

  primaryButtonHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 24px rgba(124, 92, 252, 0.4)",
  },

  primaryButtonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
    transform: "none !important",
  },

  loadingSpinner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },

  spinner: {
    width: "18px",
    height: "18px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderTop: "3px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  loadingBar: {
    marginTop: "16px",
    padding: "12px 16px",
    background: "rgba(243, 244, 246, 0.8)",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },

  loadingProgress: {
    height: "4px",
    background: "linear-gradient(90deg, #7c5cfc 0%, #ec4899 100%)",
    borderRadius: "4px",
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
    fontSize: "0.85rem",
    margin: 0,
  },

  loadingPercent: {
    color: "#7c5cfc",
    fontSize: "0.85rem",
    fontWeight: "600",
    margin: 0,
  },

  searchSection: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  searchWrapper: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  searchIcon: {
    position: "absolute",
    left: "14px",
    fontSize: "1.1rem",
    color: "#9ca3af",
  },

  searchInput: {
    flex: 1,
    padding: "14px 20px 14px 44px",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "0.95rem",
    transition: "all 0.3s ease",
    outline: "none",
    background: "rgba(255, 255, 255, 0.8)",
    width: "100%",
  },

  searchInputFocus: {
    borderColor: "#7c5cfc",
    boxShadow: "0 0 0 4px rgba(124, 92, 252, 0.1)",
  },

  searchButton: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    border: "none",
    padding: "14px 28px",
    borderRadius: "12px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  searchBtnIcon: {
    fontSize: "1.1rem",
  },

  resultsSection: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "28px 32px",
    boxShadow: "0 8px 32px rgba(124, 92, 252, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.7)",
    marginBottom: "20px",
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  resultsTitleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  resultsIcon: {
    fontSize: "1.4rem",
  },

  resultsTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },

  resultCount: {
    background: "linear-gradient(135deg, #7c5cfc 0%, #6366f1 100%)",
    color: "#fff",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
  },

  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },

  emptyIcon: {
    fontSize: "4rem",
    display: "block",
    marginBottom: "16px",
  },

  emptyTitle: {
    fontSize: "1.3rem",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 8px 0",
  },

  emptyText: {
    color: "#9ca3af",
    fontSize: "0.95rem",
    margin: 0,
    lineHeight: "1.6",
  },

  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  resultCard: {
    padding: "20px 24px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    background: "#ffffff",
    position: "relative",
  },

  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  resultBadges: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  timestampBadge: {
    background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
    color: "#4338ca",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },

  sourceBadge: {
    background: "linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)",
    color: "#6b21a5",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },

  resultIndex: {
    color: "#9ca3af",
    fontSize: "0.75rem",
    fontWeight: "500",
  },

  resultText: {
    color: "#1f2937",
    fontSize: "0.95rem",
    margin: "0 0 6px 0",
    lineHeight: "1.5",
  },

  resultVideo: {
    color: "#6b7280",
    fontSize: "0.85rem",
    margin: "0 0 10px 0",
  },

  resultAction: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid #f3f4f6",
  },

  jumpHint: {
    color: "#7c5cfc",
    fontSize: "0.8rem",
    fontWeight: "500",
  },

  playIcon: {
    color: "#7c5cfc",
    fontSize: "1rem",
    fontWeight: "700",
  },

  videoSection: {
    marginTop: "4px",
  },

  videoCard: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(124, 92, 252, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.7)",
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
    gap: "10px",
  },

  videoIcon: {
    fontSize: "1.3rem",
  },

  videoTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },

  closeButton: {
    background: "rgba(0, 0, 0, 0.05)",
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonHover: {
    background: "rgba(0, 0, 0, 0.1)",
    transform: "rotate(90deg)",
  },

  videoWrapper: {
    borderRadius: "12px",
    overflow: "hidden",
    background: "#000",
    position: "relative",
    aspectRatio: "16/9",
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
    fontSize: "0.85rem",
  },

  videoStatus: {
    color: "#10b981",
    fontSize: "0.8rem",
    fontWeight: "500",
  },
};

// Add keyframes to document
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
  
  /* Smooth scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #7c5cfc 0%, #6366f1 100%);
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  }
  
  /* Focus styles */
  input:focus {
    border-color: #7c5cfc !important;
    box-shadow: 0 0 0 4px rgba(124, 92, 252, 0.1) !important;
  }
  
  /* Button hover */
  button:hover {
    transform: translateY(-2px);
  }
  
  button:active {
    transform: scale(0.98);
  }
  
  /* File drop zone hover */
  .file-drop-zone:hover {
    border-color: #7c5cfc;
    background: rgba(124, 92, 252, 0.05);
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .upload-section,
    .search-section {
      flex-direction: column;
    }
    
    .primary-button,
    .search-button {
      width: 100%;
    }
  }
`;
document.head.appendChild(styleTag);

export default App;