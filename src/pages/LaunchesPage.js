import React, { useCallback, useEffect, useState } from "react";
import { fetchUpcomingLaunches } from "../common/api";
import { usePaginatedRequest } from "../common/hooks";
import RocketLoader from "../components/RocketLoader";

function formatCountdown(launchDate, nowMs) {
  const launchTimeMs = new Date(launchDate).getTime();

  if (Number.isNaN(launchTimeMs)) {
    return "Unknown";
  }

  const delta = launchTimeMs - nowMs;

  if (delta <= 0) {
    return "Launched";
  }

  const totalSeconds = Math.floor(delta / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
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

function getPadLocation(launch) {
  const padName = launch?.pad?.name;
  const locationName = launch?.pad?.location?.name;
  const countryCode = launch?.pad?.location?.country_code;
  const parts = [padName, locationName, countryCode].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Unknown location";
}

function LaunchCard({ launch, nowMs }) {
  const hasImage = Boolean(launch?.image);
  const countdown = formatCountdown(launch?.net, nowMs);
  const missionName = launch?.mission?.name || launch?.name || "Unknown mission";
  const rocketName = getRocketName(launch);
  const providerName = getProviderName(launch);
  const padLocation = getPadLocation(launch);

  return (
    <article
      style={{
        border: "1px solid rgba(124, 148, 183, 0.35)",
        borderRadius: "14px",
        overflow: "hidden",
        background: hasImage ? "#060c18" : "rgba(5, 10, 22, 0.72)",
        boxShadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
        position: "relative",
        minHeight: "280px",
        display: "flex",
      }}
    >
      {hasImage ? (
        <img
          src={launch.image}
          alt={missionName}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.4)",
          }}
        />
      ) : null}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          padding: "14px 14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: hasImage
            ? "linear-gradient(180deg, rgba(5, 10, 22, 0.55) 0%, rgba(5, 10, 22, 0.9) 100%)"
            : "transparent",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#e2e8f0",
            fontSize: "18px",
            lineHeight: 1.3,
          }}
        >
          {missionName}
        </h3>

        <div style={{ color: "#9fb5d9", fontSize: "13px" }}>Rocket: {rocketName}</div>
        <div style={{ color: "#9fb5d9", fontSize: "13px" }}>Provider: {providerName}</div>
        <div style={{ color: "#9fb5d9", fontSize: "13px" }}>Pad: {padLocation}</div>

        <div
          style={{
            marginTop: "auto",
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            background: "rgba(8, 23, 44, 0.72)",
            color: "#dbeafe",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          T-{countdown}
        </div>
      </div>
    </article>
  );
}

export default function LaunchesPage() {
  const [pressedArrow, setPressedArrow] = useState("");
  const [nowMs, setNowMs] = useState(Date.now());
  const itemsPerPage = 10;
  const fetchLaunchesPage = useCallback(({ limit, offset, signal }) => {
    return fetchUpcomingLaunches(limit, offset, { signal });
  }, []);
  const {
    items: launches,
    currentPage,
    totalCount,
    totalPages,
    startIndex,
    endIndex,
    loading,
    navigating,
    error,
    displayError,
    retry,
    canRetry,
    goPrevious,
    goNext,
    canGoPrevious,
    canGoNext,
  } = usePaginatedRequest({
    itemsPerPage,
    fetchPage: fetchLaunchesPage,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <section
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        padding: "86px max(12px, env(safe-area-inset-right)) 20px max(12px, env(safe-area-inset-left))",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gap: "14px" }}>
        <header style={{ marginBottom: "2px" }}>
          <h1 style={{ margin: 0, color: "#e2e8f0", fontSize: "28px", lineHeight: 1.2 }}>Launches</h1>
          <p style={{ margin: "8px 0 0", color: "#9fb5d9", fontSize: "13px" }}>
            Upcoming rocket launches from Launch Library 2
          </p>
        </header>

        {error ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#fca5a5", fontSize: "14px" }}>{displayError}</div>
            <button
              onClick={retry}
              disabled={!canRetry}
              style={{
                padding: "8px 14px",
                backgroundColor: "rgba(8, 23, 44, 0.85)",
                color: "#e2e8f0",
                border: "1px solid rgba(124, 148, 183, 0.45)",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: canRetry ? "pointer" : "not-allowed",
                opacity: canRetry ? 1 : 0.6,
              }}
            >
              Relaunch
            </button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                color: "#9fb5d9",
                fontSize: "13px",
              }}
            >
              <div>
                Showing {startIndex}-{endIndex} of {totalCount}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={goPrevious}
                  onMouseDown={() => setPressedArrow("prev")}
                  onMouseUp={() => setPressedArrow("")}
                  onMouseLeave={() => setPressedArrow("")}
                  disabled={!canGoPrevious}
                  aria-label="Previous page"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    border:
                      pressedArrow === "prev"
                        ? "1px solid rgba(14, 165, 233, 0.6)"
                        : "1px solid rgba(124, 148, 183, 0.45)",
                    backgroundColor: pressedArrow === "prev" ? "#0ea5e9" : "rgba(8, 23, 44, 0.85)",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: canGoPrevious ? "pointer" : "not-allowed",
                    opacity: canGoPrevious ? 1 : 0.6,
                  }}
                >
                  {"<"}
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goNext}
                  onMouseDown={() => setPressedArrow("next")}
                  onMouseUp={() => setPressedArrow("")}
                  onMouseLeave={() => setPressedArrow("")}
                  disabled={!canGoNext}
                  aria-label="Next page"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    border:
                      pressedArrow === "next"
                        ? "1px solid rgba(14, 165, 233, 0.6)"
                        : "1px solid rgba(124, 148, 183, 0.45)",
                    backgroundColor: pressedArrow === "next" ? "#0ea5e9" : "rgba(8, 23, 44, 0.85)",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: canGoNext ? "pointer" : "not-allowed",
                    opacity: canGoNext ? 1 : 0.6,
                  }}
                >
                  {">"}
                </button>
              </div>
            </div>

            {launches.length === 0 ? (
              <div style={{ color: "#cbd5e1", fontSize: "14px" }}>No upcoming launches found.</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "14px",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                {launches.map((launch) => (
                  <LaunchCard key={launch.id || launch.url || launch.name} launch={launch} nowMs={nowMs} />
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <button
                onClick={goPrevious}
                disabled={!canGoPrevious}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "rgba(8, 23, 44, 0.85)",
                  color: "#e2e8f0",
                  border: "1px solid rgba(124, 148, 183, 0.45)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: canGoPrevious ? "pointer" : "not-allowed",
                  opacity: canGoPrevious ? 1 : 0.6,
                }}
              >
                Previous
              </button>
              <button
                onClick={goNext}
                disabled={!canGoNext}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "rgba(8, 23, 44, 0.85)",
                  color: "#e2e8f0",
                  border: "1px solid rgba(124, 148, 183, 0.45)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: canGoNext ? "pointer" : "not-allowed",
                  opacity: canGoNext ? 1 : 0.6,
                }}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
      {loading || navigating ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(3, 7, 18, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 1500,
          }}
        >
          <RocketLoader
            label={loading ? "Rocket lift-off... loading launches" : "Rocket lift-off... loading page"}
          />
        </div>
      ) : null}
    </section>
  );
}
