import React, { useEffect, useState } from "react";
import { fetchSpaceNewsArticles } from "../common/api";

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
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      try {
        const results = await fetchSpaceNewsArticles(20);

        if (!cancelled) {
          setArticles(results);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Unable to load space news.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNews();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        padding: "86px 16px 20px",
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

        {loading ? <div style={{ color: "#cbd5e1", fontSize: "14px" }}>Loading articles...</div> : null}
        {error ? <div style={{ color: "#fca5a5", fontSize: "14px" }}>{error}</div> : null}

        {!loading && !error ? (
          <div
            style={{
              display: "grid",
              gap: "14px",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {articles.map((article) => (
              <ArticleCard key={article.id || article.url} article={article} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
