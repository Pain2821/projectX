import React from "react";
import WidgetCard from "./WidgetCard";

const constellations = [
  { name: "Starlink", count: 6284, color: "#2de2e6" },
  { name: "OneWeb", count: 634, color: "#00aaff" },
  { name: "Iridium", count: 66, color: "#7c3aed" },
  { name: "GPS", count: 31, color: "#f472b6" },
  { name: "Galileo", count: 28, color: "#34d399" },
];

const totalActive = 9847;

export default function SatellitesCard() {
  return (
    <WidgetCard
      title="Satellites"
      icon="📡"
      ctaText="Explore"
      ctaTo="/satellites"
      accentColor="var(--accent-soft, #00aaff)"
    >
      {/* Big number */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "36px",
            fontWeight: 700,
            fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
            color: "var(--text-primary, #e6edf3)",
            lineHeight: 1,
          }}
        >
          {totalActive.toLocaleString()}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-secondary, #9aa4b2)",
            marginTop: "4px",
          }}
        >
          Active Satellites in Orbit
        </div>
      </div>

      {/* Constellation bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {constellations.map((c) => (
          <div key={c.name}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "var(--text-secondary, #9aa4b2)" }}>{c.name}</span>
              <span
                style={{
                  color: "var(--text-primary, #e6edf3)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 600,
                }}
              >
                {c.count.toLocaleString()}
              </span>
            </div>
            <div
              style={{
                height: "4px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(c.count / constellations[0].count) * 100}%`,
                  background: `linear-gradient(90deg, ${c.color}, ${c.color}88)`,
                  borderRadius: "2px",
                  transition: "width 1s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
