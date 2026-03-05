import React from "react";
import WidgetCard from "./WidgetCard";

export default function DebrisCard() {
  const trackedObjects = 29483;
  const riskEvents = 12;

  return (
    <WidgetCard
      title="Orbital Debris"
      icon="💫"
      ctaText="View Map"
      ctaTo="/debris"
      accentColor="var(--danger, #f87171)"
    >
      {/* Debris Visualization */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "140px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        {/* Earth */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #1e40af, #0f172a)",
            boxShadow: "0 0 20px rgba(30,64,175,0.3), inset 0 0 20px rgba(255,255,255,0.05)",
            position: "relative",
            zIndex: 2,
          }}
        />

        {/* Debris orbits */}
        {[100, 115, 128].map((size, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "50%",
              border: "1px dashed rgba(248,113,113,0.2)",
              animation: `orbit-rotate ${12 + i * 5}s linear infinite ${i % 2 === 0 ? "" : "reverse"}`,
            }}
          >
            {/* Debris dots */}
            {[...Array(3 + i)].map((_, j) => (
              <div
                key={j}
                style={{
                  position: "absolute",
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  background: i === 0 ? "#f87171" : i === 1 ? "#fbbf24" : "#fb923c",
                  boxShadow: `0 0 4px ${i === 0 ? "rgba(248,113,113,0.5)" : "rgba(251,191,36,0.4)"}`,
                  top: `${10 + j * 20}%`,
                  left: `${j * 30}%`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "16px",
        }}
      >
        <div
          style={{
            flex: 1,
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.15)",
            borderRadius: "var(--radius-md, 10px)",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
              color: "#f87171",
            }}
          >
            {trackedObjects.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted, #5a6577)" }}>
            Tracked Objects
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.15)",
            borderRadius: "var(--radius-md, 10px)",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
              color: "#fbbf24",
            }}
          >
            {riskEvents}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted, #5a6577)" }}>
            Close Approaches / 24h
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
