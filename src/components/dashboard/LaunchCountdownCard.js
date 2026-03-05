import React, { useEffect, useMemo, useState } from "react";
import { fetchUpcomingLaunches } from "../../common/api";
import WidgetCard from "./WidgetCard";

const LAUNCH_REFRESH_MS = 60000;

function toValidDate(value) {
  const ts = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(ts) ? ts : null;
}

function formatCountdown(targetTs, nowTs) {
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

function pickNextLaunch(results) {
  const items = Array.isArray(results) ? results : [];
  const now = Date.now();

  const sorted = items
    .map((item) => ({ item, ts: toValidDate(item?.net) }))
    .filter((entry) => Number.isFinite(entry.ts))
    .sort((a, b) => a.ts - b.ts);

  return sorted.find((entry) => entry.ts >= now)?.item || sorted[0]?.item || null;
}

function getRocketName(launch) {
  return (
    launch?.rocket?.configuration?.full_name ||
    launch?.rocket?.configuration?.name ||
    launch?.rocket?.launcher_stage?.launcher?.configuration?.full_name ||
    launch?.name ||
    "Unknown rocket"
  );
}

function getProviderName(launch) {
  return launch?.launch_service_provider?.name || "Unknown provider";
}

function getPadName(launch) {
  return launch?.pad?.name || launch?.pad?.location?.name || "Unknown pad";
}

export default function LaunchCountdownCard() {
  const [nextLaunch, setNextLaunch] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    let disposed = false;

    async function loadLaunches() {
      try {
        const payload = await fetchUpcomingLaunches(10, 0);
        const launch = pickNextLaunch(payload?.results);
        if (!disposed) {
          setNextLaunch(launch);
        }
      } catch (_error) {
        if (!disposed) {
          setNextLaunch(null);
        }
      }
    }

    loadLaunches();
    const refreshId = setInterval(loadLaunches, LAUNCH_REFRESH_MS);

    return () => {
      disposed = true;
      clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const targetTs = toValidDate(nextLaunch?.net);
  const countdown = useMemo(() => formatCountdown(targetTs, nowTs), [targetTs, nowTs]);

  const missionName = nextLaunch?.mission?.name || nextLaunch?.name || "Upcoming launch";
  const rocketName = getRocketName(nextLaunch);
  const providerName = getProviderName(nextLaunch);
  const padName = getPadName(nextLaunch);

  return (
    <WidgetCard
      title="Next Launch"
      icon="LCH"
      ctaText="View All"
      ctaTo="/launches"
      accentColor="var(--accent-orange, #fb923c)"
    >
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
          ^
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        {[
          { val: countdown.h, label: "HRS" },
          { val: countdown.m, label: "MIN" },
          { val: countdown.s, label: "SEC" },
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
          {missionName}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-secondary, #9aa4b2)",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span>{padName}</span>
          <span>{providerName}</span>
          <span>{rocketName}</span>
        </div>
      </div>
    </WidgetCard>
  );
}

