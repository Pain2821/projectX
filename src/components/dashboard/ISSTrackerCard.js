import React, { useEffect, useState } from "react";
import { fetchIssLocation } from "../../common/api";
import WidgetCard from "./WidgetCard";

const ISS_REFRESH_MS = 5000;

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ISSTrackerCard() {
  const [pos, setPos] = useState({ lat: null, lon: null, alt: null });

  useEffect(() => {
    let disposed = false;

    async function loadIss() {
      try {
        const payload = await fetchIssLocation();
        if (disposed) {
          return;
        }

        setPos({
          lat: toNumber(payload?.latitude),
          lon: toNumber(payload?.longitude),
          alt: toNumber(payload?.altitude),
        });
      } catch (_error) {
        if (!disposed) {
          setPos((prev) => prev);
        }
      }
    }

    loadIss();
    const intervalId = setInterval(loadIss, ISS_REFRESH_MS);

    return () => {
      disposed = true;
      clearInterval(intervalId);
    };
  }, []);

  const lat = Number.isFinite(pos.lat) ? pos.lat : 0;
  const lon = Number.isFinite(pos.lon) ? pos.lon : 0;

  return (
    <WidgetCard title="ISS Tracker" icon="ISS" ctaText="Open Tracker" ctaTo="/liveiss">
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
          {[...Array(7)].map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 30}
              x2="360"
              y2={i * 30}
              stroke="rgba(45,226,230,0.15)"
              strokeWidth="0.5"
            />
          ))}
          {[...Array(13)].map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 30}
              y1="0"
              x2={i * 30}
              y2="180"
              stroke="rgba(45,226,230,0.15)"
              strokeWidth="0.5"
            />
          ))}
          <line
            x1="0"
            y1="90"
            x2="360"
            y2="90"
            stroke="rgba(45,226,230,0.3)"
            strokeWidth="0.8"
            strokeDasharray="4,4"
          />
          <path
            d={`M ${Array.from({ length: 72 }, (_, i) => {
              const x = i * 5;
              const y = 90 + Math.sin((x / 360) * Math.PI * 4 + Date.now() / 5000) * 50;
              return `${x},${y}`;
            }).join(" L ")}`}
            fill="none"
            stroke="rgba(45,226,230,0.3)"
            strokeWidth="1"
          />
          <circle
            cx={lon + 180}
            cy={90 - lat}
            r="4"
            fill="#2de2e6"
            style={{ filter: "drop-shadow(0 0 6px rgba(45,226,230,0.8))" }}
          />
          <circle cx={lon + 180} cy={90 - lat} r="10" fill="none" stroke="rgba(45,226,230,0.3)" strokeWidth="1">
            <animate attributeName="r" from="6" to="16" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div style={{ display: "flex", gap: "16px" }}>
        <DataPill
          label="LAT"
          value={
            Number.isFinite(pos.lat)
              ? `${Math.abs(pos.lat).toFixed(1)}° ${pos.lat >= 0 ? "N" : "S"}`
              : "--"
          }
        />
        <DataPill
          label="LON"
          value={
            Number.isFinite(pos.lon)
              ? `${Math.abs(pos.lon).toFixed(1)}° ${pos.lon >= 0 ? "E" : "W"}`
              : "--"
          }
        />
        <DataPill
          label="ALT"
          value={Number.isFinite(pos.alt) ? `${pos.alt.toFixed(0)} km` : "--"}
        />
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


