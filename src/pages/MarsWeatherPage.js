import React, { useEffect, useMemo, useState } from "react";
import { fetchMarsWeather } from "../common/api";
import RocketLoader from "../components/RocketLoader";

function formatValue(value, unit = "") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return `${value.toFixed(1)}${unit}`;
}

function buildMarsSolRecords(payload) {
  const solKeys = Array.isArray(payload?.sol_keys) ? payload.sol_keys : [];

  return solKeys
    .map((sol) => {
      const record = payload?.[sol];
      if (!record || typeof record !== "object") {
        return null;
      }

      return {
        sol,
        avgTemp: Number(record?.AT?.av),
        minTemp: Number(record?.AT?.mn),
        maxTemp: Number(record?.AT?.mx),
        windSpeed: Number(record?.HWS?.av),
        pressure: Number(record?.PRE?.av),
      };
    })
    .filter(Boolean)
    .filter(
      (record) =>
        Number.isFinite(record.avgTemp) ||
        Number.isFinite(record.minTemp) ||
        Number.isFinite(record.maxTemp)
    );
}

function TemperatureGraph({ sols }) {
  const width = 960;
  const height = 300;
  const padding = 34;
  const points = sols.filter((item) => Number.isFinite(item.avgTemp));

  if (points.length < 2) {
    return <div style={{ color: "#fca5a5", fontSize: "13px" }}>Insufficient Sol temperature data.</div>;
  }

  const values = points.flatMap((item) => [item.minTemp, item.avgTemp, item.maxTemp]).filter(Number.isFinite);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = Math.max(1, maxValue - minValue);

  const xAt = (index) => {
    const denominator = Math.max(1, points.length - 1);
    return padding + ((width - padding * 2) * index) / denominator;
  };

  const yAt = (value) => {
    return height - padding - ((value - minValue) / valueRange) * (height - padding * 2);
  };

  const avgPath = points
    .map((item, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(item.avgTemp)}`)
    .join(" ");

  const bandTop = points.map((item, index) => `${xAt(index)} ${yAt(item.maxTemp)}`).join(" ");
  const bandBottom = points
    .slice()
    .reverse()
    .map((item, index) => {
      const originalIndex = points.length - 1 - index;
      return `${xAt(originalIndex)} ${yAt(item.minTemp)}`;
    })
    .join(" ");
  const bandPath = `M ${bandTop} L ${bandBottom} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: "100%",
        height: "auto",
        borderRadius: "12px",
        background: "linear-gradient(180deg, rgba(36, 11, 7, 0.65) 0%, rgba(18, 7, 5, 0.85) 100%)",
        border: "1px solid rgba(188, 79, 47, 0.3)",
      }}
      role="img"
      aria-label="Mars temperature graph for the last seven Sols"
    >
      <defs>
        <linearGradient id="marsBandFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(252, 165, 165, 0.35)" />
          <stop offset="100%" stopColor="rgba(127, 29, 29, 0.08)" />
        </linearGradient>
      </defs>

      <path d={bandPath} fill="url(#marsBandFill)" />
      <path d={avgPath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((item, index) => (
        <g key={item.sol}>
          <line
            x1={xAt(index)}
            y1={height - padding}
            x2={xAt(index)}
            y2={height - padding + 8}
            stroke="rgba(254, 215, 170, 0.55)"
            strokeWidth="1"
          />
          <text
            x={xAt(index)}
            y={height - padding + 20}
            textAnchor="middle"
            fill="#fed7aa"
            fontSize="11"
          >
            {item.sol}
          </text>
        </g>
      ))}

      {[0, 0.5, 1].map((position) => {
        const value = maxValue - valueRange * position;
        const y = padding + (height - padding * 2) * position;

        return (
          <g key={position}>
            <line
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="rgba(254, 215, 170, 0.15)"
              strokeWidth="1"
            />
            <text x={padding - 6} y={y + 4} textAnchor="end" fill="#fdba74" fontSize="11">
              {Math.round(value)}C
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid rgba(188, 79, 47, 0.35)",
        background: "linear-gradient(180deg, rgba(41, 13, 9, 0.72) 0%, rgba(20, 8, 6, 0.82) 100%)",
        padding: "12px",
        display: "grid",
        gap: "6px",
      }}
    >
      <div style={{ color: "#fdba74", fontSize: "12px" }}>{label}</div>
      <div style={{ color: "#ffedd5", fontSize: "16px", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export default function MarsWeatherPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMarsWeather() {
      try {
        const data = await fetchMarsWeather({ signal: controller.signal });
        setPayload(data);
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }
        setError(requestError.message || "Unable to load Mars weather.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMarsWeather();

    return () => controller.abort();
  }, []);

  const { latest, lastSeven } = useMemo(() => {
    const records = buildMarsSolRecords(payload);
    const lastSevenSols = records.slice(-7);
    const latestRecord = lastSevenSols[lastSevenSols.length - 1] || null;

    return {
      latest: latestRecord,
      lastSeven: lastSevenSols,
    };
  }, [payload]);

  return (
    <section
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        padding: "86px 16px 20px",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gap: "14px" }}>
        <div
          style={{
            borderRadius: "18px",
            border: "1px solid rgba(188, 79, 47, 0.35)",
            background:
              "radial-gradient(circle at 18% 22%, rgba(198, 80, 48, 0.24) 0%, rgba(53, 17, 11, 0.78) 45%, rgba(20, 7, 5, 0.92) 100%)",
            padding: "16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-60px",
              top: "-36px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 30%, rgba(251, 146, 60, 0.34) 0%, rgba(154, 52, 18, 0.25) 42%, rgba(41, 14, 10, 0) 70%)",
              pointerEvents: "none",
            }}
          />
          <header style={{ marginBottom: "2px", position: "relative", zIndex: 1 }}>
            <h1 style={{ margin: 0, color: "#ffedd5", fontSize: "28px", lineHeight: 1.2 }}>Mars Weather</h1>
            <p style={{ margin: "8px 0 0", color: "#fdba74", fontSize: "13px" }}>
              Latest InSight atmospheric report on Elysium Planitia
            </p>
          </header>
        </div>

        {error ? <div style={{ color: "#fca5a5", fontSize: "14px" }}>{error}</div> : null}

        {!loading && !error && latest ? (
          <>
            <div style={{ color: "#fed7aa", fontSize: "15px", fontWeight: 600 }}>Latest Sol: {latest.sol}</div>

            <div
              style={{
                display: "grid",
                gap: "12px",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              }}
            >
              <StatCard label="Average Temperature" value={formatValue(latest.avgTemp, " C")} />
              <StatCard label="Minimum Temperature" value={formatValue(latest.minTemp, " C")} />
              <StatCard label="Maximum Temperature" value={formatValue(latest.maxTemp, " C")} />
              <StatCard label="Wind Speed (avg)" value={formatValue(latest.windSpeed, " m/s")} />
              <StatCard label="Atmospheric Pressure" value={formatValue(latest.pressure, " Pa")} />
            </div>

            <div style={{ marginTop: "2px" }}>
              <h2 style={{ margin: "0 0 10px", color: "#ffedd5", fontSize: "18px" }}>Last 7 Sols Temperature</h2>
              <TemperatureGraph sols={lastSeven} />
            </div>
          </>
        ) : null}
      </div>

      {loading ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(18, 6, 4, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 1500,
          }}
        >
          <RocketLoader label="Scanning Martian atmosphere..." />
        </div>
      ) : null}
    </section>
  );
}
