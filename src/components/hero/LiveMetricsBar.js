import React, { useEffect, useMemo, useState } from "react";
import { fetchIssLocation, fetchUpcomingLaunches } from "../../common/api";

const ISS_REFRESH_MS = 5000;
const LAUNCH_REFRESH_MS = 60000;

function parseLaunchDate(launch) {
  const raw = launch?.net;
  const time = raw ? Date.parse(raw) : Number.NaN;
  return Number.isFinite(time) ? time : null;
}

function getNextLaunch(results) {
  const items = Array.isArray(results) ? results : [];
  const upcoming = items
    .map((item) => ({ item, ts: parseLaunchDate(item) }))
    .filter((entry) => Number.isFinite(entry.ts) && entry.ts > Date.now())
    .sort((a, b) => a.ts - b.ts);

  return upcoming[0]?.item || items[0] || null;
}

function buildCountdown(targetTs, nowTs) {
  if (!Number.isFinite(targetTs)) {
    return { h: "--", m: "--", s: "--" };
  }

  const delta = Math.max(0, targetTs - nowTs);
  const totalSeconds = Math.floor(delta / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    h: String(hours).padStart(2, "0"),
    m: String(minutes).padStart(2, "0"),
    s: String(seconds).padStart(2, "0"),
  };
}

function formatSignedDegrees(value, pos, neg) {
  if (!Number.isFinite(value)) {
    return { text: "--", dir: "" };
  }

  const dir = value >= 0 ? pos : neg;
  const abs = Math.abs(value).toFixed(1);
  return { text: `${abs}°`, dir };
}

export default function LiveMetricsBar() {
  const [iss, setIss] = useState(null);
  const [nextLaunchTs, setNextLaunchTs] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    let disposed = false;

    async function loadIss() {
      try {
        const payload = await fetchIssLocation();
        if (!disposed) {
          setIss(payload);
          setFlashKey((k) => k + 1);
        }
      } catch (_error) {
        if (!disposed) {
          setIss(null);
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

  useEffect(() => {
    let disposed = false;

    async function loadNextLaunch() {
      try {
        const payload = await fetchUpcomingLaunches(10, 0);
        const nextLaunch = getNextLaunch(payload?.results);
        const ts = parseLaunchDate(nextLaunch);
        if (!disposed) {
          setNextLaunchTs(ts);
        }
      } catch (_error) {
        if (!disposed) {
          setNextLaunchTs(null);
        }
      }
    }

    loadNextLaunch();
    const intervalId = setInterval(loadNextLaunch, LAUNCH_REFRESH_MS);

    return () => {
      disposed = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const lat = Number(iss?.latitude);
  const lon = Number(iss?.longitude);
  const speed = Number(iss?.velocity);
  const latText = formatSignedDegrees(lat, "N", "S");
  const lonText = formatSignedDegrees(lon, "E", "W");
  const countdown = useMemo(() => buildCountdown(nextLaunchTs, nowTs), [nextLaunchTs, nowTs]);

  const metricItems = [
    { label: "ISS LAT", value: latText.text, sub: latText.dir },
    { label: "ISS LON", value: lonText.text, sub: lonText.dir },
    {
      label: "SPEED",
      value: Number.isFinite(speed) ? Number(speed.toFixed(0)).toLocaleString() : "--",
      sub: "km/h",
    },
    {
      label: "NEXT LAUNCH",
      value: `${countdown.h}:${countdown.m}:${countdown.s}`,
      sub: "",
      isMono: true,
    },
    { label: "DEBRIS OBJECTS", value: "27,000+", sub: "catalogued" },
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
                fontFamily: item.isMono
                  ? "var(--font-mono, monospace)"
                  : "var(--font-heading, 'Space Grotesk', sans-serif)",
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


