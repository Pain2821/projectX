import React from "react";

export default function SatelliteHeatmap() {
  return (
    <div
      style={{
        background: "var(--bg-card, rgba(12,16,32,0.7))",
        border: "1px solid var(--border, rgba(255,255,255,0.08))",
        borderRadius: "var(--radius-lg, 16px)",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <span style={{ fontSize: "20px" }}>🌐</span>
        <h3
          style={{
            fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--text-primary, #e6edf3)",
            margin: 0,
          }}
        >
          Satellite Density
        </h3>
      </div>

      {/* SVG Globe */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
        }}
      >
        <svg viewBox="0 0 200 200" width="200" height="200">
          {/* Globe background */}
          <defs>
            <radialGradient id="globe-grad" cx="40%" cy="35%" r="50%">
              <stop offset="0%" stopColor="#1e40af" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </radialGradient>
            <radialGradient id="heatspot1" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#2de2e6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2de2e6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatspot2" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#00aaff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#00aaff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatspot3" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Globe sphere */}
          <circle cx="100" cy="100" r="90" fill="url(#globe-grad)" stroke="rgba(45,226,230,0.15)" strokeWidth="1" />

          {/* Grid lines */}
          <ellipse cx="100" cy="100" rx="90" ry="30" fill="none" stroke="rgba(45,226,230,0.1)" strokeWidth="0.5" />
          <ellipse cx="100" cy="100" rx="90" ry="60" fill="none" stroke="rgba(45,226,230,0.08)" strokeWidth="0.5" />
          <ellipse cx="100" cy="100" rx="30" ry="90" fill="none" stroke="rgba(45,226,230,0.08)" strokeWidth="0.5" />
          <ellipse cx="100" cy="100" rx="60" ry="90" fill="none" stroke="rgba(45,226,230,0.08)" strokeWidth="0.5" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(45,226,230,0.12)" strokeWidth="0.5" />

          {/* Heat spots */}
          <circle cx="75" cy="70" r="25" fill="url(#heatspot1)" />
          <circle cx="130" cy="85" r="20" fill="url(#heatspot2)" />
          <circle cx="90" cy="120" r="18" fill="url(#heatspot3)" />
          <circle cx="140" cy="110" r="15" fill="url(#heatspot1)" />
          <circle cx="60" cy="100" r="12" fill="url(#heatspot2)" />

          {/* Satellite dots */}
          {[
            [65, 60], [80, 75], [72, 68], [90, 65],
            [125, 80], [135, 90], [120, 88], [140, 82],
            [85, 115], [95, 125], [92, 118],
            [145, 105], [138, 115],
            [55, 95], [62, 105],
            [110, 70], [100, 95], [115, 130],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="1.5"
              fill="#2de2e6"
              opacity={0.4 + Math.random() * 0.6}
            >
              <animate
                attributeName="opacity"
                values={`${0.3 + Math.random() * 0.3};${0.7 + Math.random() * 0.3};${0.3 + Math.random() * 0.3}`}
                dur={`${2 + Math.random() * 3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {/* Atmosphere glow */}
          <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(45,226,230,0.08)" strokeWidth="3" />
        </svg>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "16px",
          fontSize: "11px",
          color: "var(--text-secondary, #9aa4b2)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2de2e6", display: "inline-block" }} />
          High Density
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00aaff", display: "inline-block" }} />
          Medium
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#7c3aed", display: "inline-block" }} />
          Low
        </span>
      </div>
    </div>
  );
}
