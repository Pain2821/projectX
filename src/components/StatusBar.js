import React from "react";

function formatCoordinate(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(3);
}

function formatNumber(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(digits);
}

function formatVisibility(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "eclipsed") {
    return "🌑 In Earth's Shadow";
  }
  if (normalized === "daylight") {
    return "☀️ In Sunlight";
  }
  if (normalized === "uneclipsed") {
    return "✨ Uneclipsed";
  }

  return "--";
}

function StatItem({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
      <span style={{ color: "#9aa9c4", fontSize: "11px", letterSpacing: "0.3px" }}>{label}</span>
      <strong style={{ color: "#e7f2ff", fontWeight: 600, fontSize: "13px" }}>{value}</strong>
    </div>
  );
}

export default function StatusBar({ position, lastUpdated, loading, error }) {
  return (
    <section
      style={{
        position: "absolute",
        left: "16px",
        bottom: "16px",
        zIndex: 1000,
        border: "1px solid rgba(124, 148, 183, 0.35)",
        borderRadius: "12px",
        padding: "10px 12px",
        backgroundColor: "rgba(5, 10, 22, 0.58)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        minWidth: "220px",
        boxShadow: "0 8px 22px rgba(0, 0, 0, 0.35)",
      }}
    >
      <StatItem label="LAT" value={formatCoordinate(position?.latitude)} />
      <StatItem label="LON" value={formatCoordinate(position?.longitude)} />
      <StatItem label="ALT" value={`${formatNumber(position?.altitude)} km`} />
      <StatItem label="VEL" value={`${formatNumber(position?.velocity)} km/h`} />
      <StatItem label="VISIBILITY" value={formatVisibility(position?.visibility)} />
      <StatItem
        label="UPDATED"
        value={lastUpdated ? lastUpdated.toLocaleTimeString() : loading ? "Loading..." : "--"}
      />
      {error ? <div style={{ color: "#fca5a5", fontSize: "12px" }}>API Error: {error}</div> : null}
    </section>
  );
}
