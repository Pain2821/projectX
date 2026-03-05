import React from "react";

export default function MarsWeatherWidget() {
  const weatherData = {
    sol: 4127,
    temp: { avg: -63, min: -95, max: -14 },
    wind: { speed: 6.2, direction: "SW" },
    pressure: 755,
    season: "Late Summer",
    opacity: "Sunny",
  };

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
      {/* Reddish gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <span style={{ fontSize: "20px" }}>🔴</span>
        <h3
          style={{
            fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--text-primary, #e6edf3)",
            margin: 0,
          }}
        >
          Mars Weather — Sol {weatherData.sol}
        </h3>
        <a
          href="/mars"
          style={{
            marginLeft: "auto",
            fontSize: "12px",
            color: "#fb923c",
            textDecoration: "none",
          }}
        >
          Details →
        </a>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
        className="mars-grid"
      >
        {/* Temperature */}
        <StatBlock
          label="Temperature"
          value={`${weatherData.temp.avg}°C`}
          sub={`${weatherData.temp.min}° / ${weatherData.temp.max}°`}
          color="#f87171"
        />
        {/* Wind */}
        <StatBlock
          label="Wind"
          value={`${weatherData.wind.speed} m/s`}
          sub={weatherData.wind.direction}
          color="#fbbf24"
        />
        {/* Pressure */}
        <StatBlock
          label="Pressure"
          value={`${weatherData.pressure} Pa`}
          sub={weatherData.season}
          color="#fb923c"
        />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .mars-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function StatBlock({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: "rgba(5,7,13,0.5)",
        borderRadius: "var(--radius-md, 10px)",
        padding: "16px",
        border: "1px solid var(--border, rgba(255,255,255,0.08))",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "var(--text-muted, #5a6577)",
          marginBottom: "8px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: color,
          fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "11px", color: "var(--text-secondary, #9aa4b2)" }}>
        {sub}
      </div>
    </div>
  );
}
