import React, { useState, useEffect, useRef } from "react";

// Simulated live metrics
function generateMetrics() {
  return {
    issLat: (Math.random() * 100 - 50).toFixed(1),
    issLon: (Math.random() * 260 - 130).toFixed(1),
    issSpeed: (27580 + Math.random() * 40).toFixed(0),
    debrisCount: 29400 + Math.floor(Math.random() * 150),
  };
}

export default function LiveMetricsBar() {
  const [metrics, setMetrics] = useState(generateMetrics);
  const [countdown, setCountdown] = useState({ h: 2, m: 14, s: 22 });
  const [flashKey, setFlashKey] = useState(0);
  const intervalRef = useRef(null);

  // Update metrics every 3s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMetrics(generateMetrics());
      setFlashKey((k) => k + 1);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        let { h, m, s } = prev;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");

  const metricItems = [
    { label: "ISS LAT", value: `${metrics.issLat}°`, sub: metrics.issLat > 0 ? "N" : "S" },
    { label: "ISS LON", value: `${metrics.issLon}°`, sub: metrics.issLon > 0 ? "E" : "W" },
    { label: "SPEED", value: `${Number(metrics.issSpeed).toLocaleString()}`, sub: "km/h" },
    { label: "NEXT LAUNCH", value: `${pad(countdown.h)}:${pad(countdown.m)}:${pad(countdown.s)}`, sub: "", isMono: true },
    { label: "DEBRIS OBJECTS", value: metrics.debrisCount.toLocaleString(), sub: "tracked" },
  ];

  return (
    <div
      style={{
        maxWidth: "1280px",
        margin: "-20px auto 0",
        padding: "0 24px",
        position: "relative",
        zIndex: 3,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "2px",
          background: "rgba(12,16,32,0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(45,226,230,0.15)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "16px 24px",
          boxShadow: "0 0 30px rgba(45,226,230,0.08)",
        }}
      >
        {metricItems.map((item, i) => (
          <div
            key={item.label}
            style={{
              flex: "1 1 140px",
              textAlign: "center",
              padding: "8px 16px",
              borderRight: i < metricItems.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              minWidth: "120px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted, #5a6577)",
                marginBottom: "4px",
                fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
              }}
            >
              {item.label}
            </div>
            <div
              key={flashKey}
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--accent, #2de2e6)",
                fontFamily: item.isMono ? "var(--font-mono, monospace)" : "var(--font-heading, 'Space Grotesk', sans-serif)",
                animation: "countup-flash 600ms ease",
                display: "inline-flex",
                alignItems: "baseline",
                gap: "4px",
              }}
            >
              {item.value}
              {item.sub && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--text-secondary, #9aa4b2)",
                  }}
                >
                  {item.sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
