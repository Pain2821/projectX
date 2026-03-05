import React from "react";

export default function DataStatus({ stale = false, cacheAge = null, style = {} }) {
  const mode = stale ? "Stale" : cacheAge && cacheAge > 0 ? "Cached" : "Live";
  const color = mode === "Live" ? "#34d399" : mode === "Cached" ? "#fbbf24" : "#f87171";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "11px",
        color: "#cbd5e1",
        ...style,
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "999px",
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span>{mode}</span>
    </div>
  );
}
