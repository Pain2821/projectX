import React, { useState, useEffect } from "react";
import WidgetCard from "./WidgetCard";

export default function LaunchCountdownCard() {
  const [countdown, setCountdown] = useState({ h: 2, m: 14, s: 22 });

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

  return (
    <WidgetCard
      title="Next Launch"
      icon="🚀"
      ctaText="View All"
      ctaTo="/launches"
      accentColor="var(--accent-orange, #fb923c)"
    >
      {/* Rocket Visual */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            animation: "float 3s ease-in-out infinite",
            filter: "drop-shadow(0 0 20px rgba(251,146,60,0.3))",
          }}
        >
          🚀
        </div>
      </div>

      {/* Countdown */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        {[
          { val: pad(countdown.h), label: "HRS" },
          { val: pad(countdown.m), label: "MIN" },
          { val: pad(countdown.s), label: "SEC" },
        ].map((unit, i) => (
          <React.Fragment key={unit.label}>
            {i > 0 && (
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "var(--text-muted, #5a6577)",
                  lineHeight: "46px",
                }}
              >
                :
              </span>
            )}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "var(--accent-orange, #fb923c)",
                  background: "rgba(251,146,60,0.08)",
                  borderRadius: "var(--radius-md, 10px)",
                  padding: "4px 12px",
                  border: "1px solid rgba(251,146,60,0.15)",
                  minWidth: "60px",
                }}
              >
                {unit.val}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  color: "var(--text-muted, #5a6577)",
                  marginTop: "6px",
                }}
              >
                {unit.label}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Mission Info */}
      <div
        style={{
          background: "rgba(5,7,13,0.5)",
          borderRadius: "var(--radius-md, 10px)",
          padding: "12px 16px",
          border: "1px solid var(--border, rgba(255,255,255,0.08))",
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--text-primary, #e6edf3)",
            marginBottom: "4px",
          }}
        >
          Falcon 9 — Starlink Group 12-5
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-secondary, #9aa4b2)",
            display: "flex",
            gap: "12px",
          }}
        >
          <span>📍 Cape Canaveral</span>
          <span>🏢 SpaceX</span>
        </div>
      </div>
    </WidgetCard>
  );
}
