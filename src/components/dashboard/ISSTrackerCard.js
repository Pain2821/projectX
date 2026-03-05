import React, { useState, useEffect } from "react";
import WidgetCard from "./WidgetCard";

export default function ISSTrackerCard() {
  const [pos, setPos] = useState({ lat: 41.2, lon: -120.1 });

  useEffect(() => {
    const timer = setInterval(() => {
      setPos({
        lat: +(Math.random() * 100 - 50).toFixed(2),
        lon: +(Math.random() * 260 - 130).toFixed(2),
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <WidgetCard title="ISS Tracker" icon="🛰" ctaText="Open Tracker" ctaTo="/liveiss">
      {/* Mini SVG Map */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "160px",
          background: "rgba(5,7,13,0.6)",
          borderRadius: "var(--radius-md, 10px)",
          overflow: "hidden",
          marginBottom: "16px",
        }}
      >
        <svg viewBox="0 0 360 180" style={{ width: "100%", height: "100%", opacity: 0.4 }}>
          {/* Simple world outline grid */}
          {[...Array(7)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 30} x2="360" y2={i * 30}
                  stroke="rgba(45,226,230,0.15)" strokeWidth="0.5" />
          ))}
          {[...Array(13)].map((_, i) => (
            <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="180"
                  stroke="rgba(45,226,230,0.15)" strokeWidth="0.5" />
          ))}
          {/* Equator */}
          <line x1="0" y1="90" x2="360" y2="90" stroke="rgba(45,226,230,0.3)" strokeWidth="0.8" strokeDasharray="4,4" />
          {/* ISS orbit path (sinusoidal) */}
          <path
            d={`M ${Array.from({length: 72}, (_, i) => {
              const x = i * 5;
              const y = 90 + Math.sin((x / 360) * Math.PI * 4 + Date.now()/5000) * 50;
              return `${x},${y}`;
            }).join(' L ')}`}
            fill="none"
            stroke="rgba(45,226,230,0.3)"
            strokeWidth="1"
          />
          {/* ISS position dot */}
          <circle
            cx={pos.lon + 180}
            cy={90 - pos.lat}
            r="4"
            fill="#2de2e6"
            style={{ filter: "drop-shadow(0 0 6px rgba(45,226,230,0.8))" }}
          />
          <circle
            cx={pos.lon + 180}
            cy={90 - pos.lat}
            r="10"
            fill="none"
            stroke="rgba(45,226,230,0.3)"
            strokeWidth="1"
          >
            <animate attributeName="r" from="6" to="16" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Data Row */}
      <div style={{ display: "flex", gap: "16px" }}>
        <DataPill label="LAT" value={`${Math.abs(pos.lat).toFixed(1)}° ${pos.lat >= 0 ? "N" : "S"}`} />
        <DataPill label="LON" value={`${Math.abs(pos.lon).toFixed(1)}° ${pos.lon >= 0 ? "E" : "W"}`} />
        <DataPill label="ALT" value="408 km" />
      </div>
    </WidgetCard>
  );
}

function DataPill({ label, value }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "var(--text-muted, #5a6577)",
          marginBottom: "2px",
          fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-primary, #e6edf3)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
