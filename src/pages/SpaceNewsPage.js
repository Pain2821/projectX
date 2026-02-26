import React, { useCallback, useState } from "react";
import { fetchSpaceNewsArticles } from "../common/api";
import { usePaginatedRequest } from "../common/hooks";
import RocketLoader from "../components/RocketLoader";

function formatPublishedDate(value) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
}

function ArticleCard({ article }) {
  const image = article.image_url || "https://placehold.co/1200x675/0b1220/cbd5e1?text=Space+News";

  return (
    <article
      style={{
        border: "1px solid rgba(124, 148, 183, 0.35)",
        borderRadius: "14px",
        overflow: "hidden",
        background: "rgba(5, 10, 22, 0.72)",
        boxShadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#111827",
          overflow: "hidden",
        }}
      >
        <img
          src={image}
          alt={article.title || "Space news"}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      <div
        style={{
          padding: "14px 14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#e2e8f0",
            fontSize: "16px",
            lineHeight: 1.35,
          }}
        >
          {article.title || "Untitled"}
        </h3>

        <div style={{ color: "#9fb5d9", fontSize: "12px" }}>
          Source: {article.news_site || "Unknown"}
        </div>

        <div style={{ color: "#94a3b8", fontSize: "12px" }}>
          Published: {formatPublishedDate(article.published_at)}
        </div>

        <div style={{ marginTop: "auto" }}>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#67e8f9",
              textDecoration: "none",
              fontSize: "13px",
              borderBottom: "1px solid rgba(103, 232, 249, 0.35)",
              paddingBottom: "2px",
            }}
          >
            Read More
          </a>
        </div>
      </div>
    </article>
  );
}

export default function SpaceNewsPage() {
  const [pressedArrow, setPressedArrow] = useState("");
  const itemsPerPage = 20;
  const fetchNewsPage = useCallback(({ limit, offset, signal }) => {
    return fetchSpaceNewsArticles(limit, offset, { signal });
  }, []);
  const {
    items: articles,
    currentPage,
    totalCount,
    totalPages,
    startIndex,
    endIndex,
    loading,
    navigating,
    error,
    displayError,
    retry,
    canRetry,
    goPrevious,
    goNext,
    canGoPrevious,
    canGoNext,
  } = usePaginatedRequest({
    itemsPerPage,
    fetchPage: fetchNewsPage,
  });

  return (
    <section
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        padding: "86px max(12px, env(safe-area-inset-right)) 20px max(12px, env(safe-area-inset-left))",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gap: "14px" }}>
        <header style={{ marginBottom: "2px" }}>
          <h1 style={{ margin: 0, color: "#e2e8f0", fontSize: "28px", lineHeight: 1.2 }}>
            Space News
          </h1>
          <p style={{ margin: "8px 0 0", color: "#9fb5d9", fontSize: "13px" }}>
            Latest articles from Spaceflight News API
          </p>
        </header>

        {error ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#fca5a5", fontSize: "14px" }}>{displayError}</div>
            <button
              onClick={retry}
              disabled={!canRetry}
              style={{
                padding: "8px 14px",
                backgroundColor: "rgba(8, 23, 44, 0.85)",
                color: "#e2e8f0",
                border: "1px solid rgba(124, 148, 183, 0.45)",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: canRetry ? "pointer" : "not-allowed",
                opacity: canRetry ? 1 : 0.6,
              }}
            >
              Relaunch
            </button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                color: "#9fb5d9",
                fontSize: "13px",
              }}
            >
              <div>
                Showing {startIndex}-{endIndex} of {totalCount}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={goPrevious}
                  onMouseDown={() => setPressedArrow("prev")}
                  onMouseUp={() => setPressedArrow("")}
                  onMouseLeave={() => setPressedArrow("")}
                  disabled={!canGoPrevious}
                  aria-label="Previous page"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    border:
                      pressedArrow === "prev"
                        ? "1px solid rgba(14, 165, 233, 0.6)"
                        : "1px solid rgba(124, 148, 183, 0.45)",
                    backgroundColor: pressedArrow === "prev" ? "#0ea5e9" : "rgba(8, 23, 44, 0.85)",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: canGoPrevious ? "pointer" : "not-allowed",
                    opacity: canGoPrevious ? 1 : 0.6,
                  }}
                >
                  {"<"}
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goNext}
                  onMouseDown={() => setPressedArrow("next")}
                  onMouseUp={() => setPressedArrow("")}
                  onMouseLeave={() => setPressedArrow("")}
                  disabled={!canGoNext}
                  aria-label="Next page"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    border:
                      pressedArrow === "next"
                        ? "1px solid rgba(14, 165, 233, 0.6)"
                        : "1px solid rgba(124, 148, 183, 0.45)",
                    backgroundColor: pressedArrow === "next" ? "#0ea5e9" : "rgba(8, 23, 44, 0.85)",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: canGoNext ? "pointer" : "not-allowed",
                    opacity: canGoNext ? 1 : 0.6,
                  }}
                >
                  {">"}
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "14px",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {articles.map((article) => (
                <ArticleCard key={article.id || article.url} article={article} />
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <button
                onClick={goPrevious}
                disabled={!canGoPrevious}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "rgba(8, 23, 44, 0.85)",
                  color: "#e2e8f0",
                  border: "1px solid rgba(124, 148, 183, 0.45)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: canGoPrevious ? "pointer" : "not-allowed",
                  opacity: canGoPrevious ? 1 : 0.6,
                }}
              >
                Previous
              </button>
              <button
                onClick={goNext}
                disabled={!canGoNext}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "rgba(8, 23, 44, 0.85)",
                  color: "#e2e8f0",
                  border: "1px solid rgba(124, 148, 183, 0.45)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: canGoNext ? "pointer" : "not-allowed",
                  opacity: canGoNext ? 1 : 0.6,
                }}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
      {loading || navigating ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(3, 7, 18, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 1500,
          }}
        >
          <RocketLoader
            label={loading ? "Rocket lift-off... loading articles" : "Rocket lift-off... loading page"}
          />
        </div>
      ) : null}
    </section>
  );
}
