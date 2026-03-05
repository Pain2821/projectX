import React, { useState } from "react";

export default function WidgetCard({
  title,
  icon,
  children,
  ctaText,
  ctaTo,
  accentColor = "var(--accent, #2de2e6)",
  span = 1,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "var(--bg-card-hover, rgba(18,24,48,0.85))"
          : "var(--bg-card, rgba(12,16,32,0.7))",
        border: `1px solid ${hovered ? "rgba(45,226,230,0.25)" : "var(--border, rgba(255,255,255,0.08))"}`,
        borderRadius: "var(--radius-lg, 16px)",
        padding: "24px",
        transition: "all var(--transition-base, 250ms ease)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 8px 40px rgba(0,0,0,0.3), 0 0 20px rgba(45,226,230,0.1)"
          : "var(--shadow-card, 0 4px 30px rgba(0,0,0,0.3))",
        gridColumn: span > 1 ? `span ${span}` : undefined,
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle top glow line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20%",
          right: "20%",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
          opacity: hovered ? 1 : 0.4,
          transition: "opacity var(--transition-base, 250ms ease)",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {icon && <span style={{ fontSize: "20px" }}>{icon}</span>}
          <h3
            style={{
              fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary, #e6edf3)",
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
        {ctaText && (
          <a
            href={ctaTo || "#"}
            style={{
              fontSize: "12px",
              color: accentColor,
              textDecoration: "none",
              fontWeight: 500,
              opacity: hovered ? 1 : 0.7,
              transition: "opacity var(--transition-fast, 150ms ease)",
            }}
          >
            {ctaText} →
          </a>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
