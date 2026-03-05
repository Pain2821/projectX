import React from "react";

const MOCK_NEWS = [
  {
    id: 1,
    title: "NASA's Artemis III Mission Sets New Timeline for 2026 Lunar Landing",
    source: "NASA",
    time: "2 hours ago",
    color: "#2de2e6",
  },
  {
    id: 2,
    title: "SpaceX Successfully Launches 60 More Starlink Satellites",
    source: "SpaceX",
    time: "5 hours ago",
    color: "#00aaff",
  },
  {
    id: 3,
    title: "ESA's JUICE Spacecraft Enters Jupiter Orbit After 3-Year Journey",
    source: "ESA",
    time: "8 hours ago",
    color: "#7c3aed",
  },
  {
    id: 4,
    title: "James Webb Telescope Discovers New Exoplanet with Water Vapor",
    source: "NASA",
    time: "12 hours ago",
    color: "#f472b6",
  },
  {
    id: 5,
    title: "China's Tiangong Space Station Completes Module Expansion",
    source: "CNSA",
    time: "1 day ago",
    color: "#fb923c",
  },
  {
    id: 6,
    title: "New Debris Collision Risk Assessment Shows Growing LEO Congestion",
    source: "CelesTrak",
    time: "1 day ago",
    color: "#f87171",
  },
  {
    id: 7,
    title: "India's ISRO Announces Plans for Venus Orbiter Mission in 2028",
    source: "ISRO",
    time: "2 days ago",
    color: "#34d399",
  },
];

export default function NewsRail() {
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
          View All →
        </a>
      </div>

      {/* Scrollable rail */}
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
        {MOCK_NEWS.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

function NewsCard({ article }) {
  return (
    <div
      style={{
        flex: "0 0 280px",
        background: "var(--bg-card, rgba(12,16,32,0.7))",
        border: "1px solid var(--border, rgba(255,255,255,0.08))",
        borderRadius: "var(--radius-lg, 16px)",
        overflow: "hidden",
        scrollSnapAlign: "start",
        transition: "all var(--transition-base, 250ms ease)",
        cursor: "pointer",
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
      {/* Image placeholder */}
      <div
        style={{
          height: "120px",
          background: `linear-gradient(135deg, ${article.color}15, ${article.color}05)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative space elements */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: `1px solid ${article.color}30`,
            position: "absolute",
            animation: "orbit-rotate 15s linear infinite",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-2px",
              left: "50%",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: article.color,
              boxShadow: `0 0 6px ${article.color}80`,
            }}
          />
        </div>
        <span style={{ fontSize: "28px", opacity: 0.6 }}>
          {article.source === "NASA" ? "🔭" :
           article.source === "SpaceX" ? "🚀" :
           article.source === "ESA" ? "🛰" :
           article.source === "CNSA" ? "🏛" :
           article.source === "CelesTrak" ? "💫" :
           article.source === "ISRO" ? "🌏" : "📰"}
        </span>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Source badge */}
        <div
          style={{
            display: "inline-block",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: article.color,
            background: `${article.color}15`,
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
    </div>
  );
}
