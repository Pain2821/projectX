import React, { useEffect, useRef, useState } from "react";
import { fetchIssTleData } from "../common/api";
import { calculateNextIssPass, formatPassSummary } from "../common/hooks";

function formatCoordinate(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(3);
}

function formatNumber(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(digits);
}

function formatVisibility(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "eclipsed") {
    return "In Earth's Shadow";
  }
  if (normalized === "daylight") {
    return "In Sunlight";
  }
  if (normalized === "uneclipsed") {
    return "Uneclipsed";
  }

  return "--";
}

function StatItem({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
      <span style={{ color: "#9aa9c4", fontSize: "11px", letterSpacing: "0.3px" }}>{label}</span>
      <strong style={{ color: "#e7f2ff", fontWeight: 600, fontSize: "13px" }}>{value}</strong>
    </div>
  );
}

export default function StatusBar({ position, lastUpdated, loading, error }) {
  const [passMessage, setPassMessage] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleNextPass = () => {
    if (!navigator.geolocation) {
      setPassError("Geolocation is not supported in this browser.");
      return;
    }

    setPassLoading(true);
    setPassError("");
    setPassMessage("");

    navigator.geolocation.getCurrentPosition(
      async (geoPosition) => {
        try {
          const tle = await fetchIssTleData();
          if (!isMountedRef.current) {
            return;
          }

          const pass = calculateNextIssPass({
            line1: tle.line1,
            line2: tle.line2,
            latitude: geoPosition.coords.latitude,
            longitude: geoPosition.coords.longitude,
            heightMeters: geoPosition.coords.altitude || 0,
          });

          if (isMountedRef.current) {
            setPassMessage(formatPassSummary(pass));
          }
        } catch (calculationError) {
          if (isMountedRef.current) {
            setPassError(calculationError.message || "Unable to calculate next ISS pass.");
          }
        } finally {
          if (isMountedRef.current) {
            setPassLoading(false);
          }
        }
      },
      (geoError) => {
        if (isMountedRef.current) {
          setPassLoading(false);
          setPassError(geoError.message || "Unable to access your location.");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <section
      style={{
        position: "absolute",
        left: "16px",
        right: "16px",
        bottom: "16px",
        zIndex: 1000,
        border: "1px solid rgba(124, 148, 183, 0.35)",
        borderRadius: "12px",
        padding: "10px 12px",
        backgroundColor: "rgba(5, 10, 22, 0.58)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "min(420px, calc(100vw - 32px))",
        maxWidth: "420px",
        boxShadow: "0 8px 22px rgba(0, 0, 0, 0.35)",
        boxSizing: "border-box",
      }}
    >
      <StatItem label="LAT" value={formatCoordinate(position?.latitude)} />
      <StatItem label="LON" value={formatCoordinate(position?.longitude)} />
      <StatItem label="ALT" value={`${formatNumber(position?.altitude)} km`} />
      <StatItem label="VEL" value={`${formatNumber(position?.velocity)} km/h`} />
      <StatItem label="VISIBILITY" value={formatVisibility(position?.visibility)} />
      <StatItem
        label="UPDATED"
        value={lastUpdated ? lastUpdated.toLocaleTimeString() : loading ? "Loading..." : "--"}
      />

      <button
        type="button"
        onClick={handleNextPass}
        disabled={passLoading}
        style={{
          marginTop: "4px",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid rgba(103, 232, 249, 0.45)",
          background: passLoading ? "rgba(15, 23, 42, 0.85)" : "rgba(8, 23, 44, 0.9)",
          color: "#dbeafe",
          cursor: passLoading ? "not-allowed" : "pointer",
          fontSize: "12px",
          textAlign: "left",
        }}
      >
        {passLoading ? "Calculating next pass..." : "When will ISS pass over me?"}
      </button>

      {passMessage ? (
        <div style={{ color: "#bfdbfe", fontSize: "12px", lineHeight: 1.35 }}>{passMessage}</div>
      ) : null}
      {passError ? <div style={{ color: "#fca5a5", fontSize: "12px" }}>{passError}</div> : null}
      {error ? <div style={{ color: "#fca5a5", fontSize: "12px" }}>API Error: {error}</div> : null}
    </section>
  );
}
