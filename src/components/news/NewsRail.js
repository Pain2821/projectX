import React, { useEffect, useState } from "react";
import { fetchSpaceNewsArticles } from "../../common/api";

export default function NewsRail() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    let disposed = false;

    async function loadNews() {
      try {
        const payload = await fetchSpaceNewsArticles(12, 0);
        if (!disposed) {
          setArticles(Array.isArray(payload?.results) ? payload.results : []);
        }
      } catch (_error) {
        if (!disposed) {
          setArticles([]);
        }
      }
    }

    loadNews();
  }, []);

  return (
    <section className="section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Space News</h2>
        <a
          href="/news"
          style={{
            fontSize: "13px",
            color: "var(--accent, #2de2e6)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          View All
        </a>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          paddingBottom: "8px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {articles.map((article) => (
          <NewsCard
            key={article.id || article.url}
            article={{
              title: article.title || "Untitled",
              source: article.news_site || "Unknown",
              time: article.published_at ? new Date(article.published_at).toLocaleString() : "",
              url: article.url,
              image: article.image_url || "",
            }}
          />
        ))}
      </div>
    </section>
  );
}

function NewsCard({ article }) {
  return (
    <a
      href={article.url || "/news"}
      target="_blank"
      rel="noreferrer"
      style={{
        flex: "0 0 280px",
        background: "var(--bg-card, rgba(12,16,32,0.7))",
        border: "1px solid var(--border, rgba(255,255,255,0.08))",
        borderRadius: "var(--radius-lg, 16px)",
        overflow: "hidden",
        scrollSnapAlign: "start",
        transition: "all var(--transition-base, 250ms ease)",
        cursor: "pointer",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(45,226,230,0.2)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border, rgba(255,255,255,0.08))";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          height: "120px",
          background: article.image
            ? "#0b1220"
            : "linear-gradient(135deg, rgba(45,226,230,0.08), rgba(0,170,255,0.06))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <span style={{ fontSize: "26px", opacity: 0.7 }}>News</span>
        )}
      </div>

      <div style={{ padding: "16px" }}>
        <div
          style={{
            display: "inline-block",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#2de2e6",
            background: "rgba(45,226,230,0.15)",
            borderRadius: "var(--radius-sm, 6px)",
            padding: "3px 8px",
            marginBottom: "8px",
          }}
        >
          {article.source}
        </div>

        <h4
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-primary, #e6edf3)",
            lineHeight: 1.4,
            marginBottom: "8px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {article.title}
        </h4>

        <div
          style={{
            fontSize: "12px",
            color: "var(--text-muted, #5a6577)",
          }}
        >
          {article.time}
        </div>
      </div>
    </a>
  );
}
