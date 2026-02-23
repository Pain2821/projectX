import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchIssLocation } from "../common/api";
import { IssContext } from "../common/context";

const POLL_INTERVAL_MS = 1000;
const MAX_HISTORY_POINTS = 80;

export function ThemeProvider({ children }) {
  const theme = useMemo(
    () => ({
      colors: {
        background:
          "radial-gradient(circle at 15% 20%, #202d4a 0%, #0a1020 45%, #03050c 100%)",
        text: "#e2e8f0",
      },
    }),
    []
  );

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: theme.colors.background,
        color: theme.colors.text,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      {children}
    </div>
  );
}

export function IssProvider({ children }) {
  const [position, setPosition] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchIssLocation();
      const nextPosition = {
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        altitude: Number(data.altitude),
        velocity: Number(data.velocity),
        visibility: String(data.visibility || ""),
        timestamp: Number(data.timestamp || Date.now() / 1000) * 1000,
      };

      setPosition(nextPosition);
      setHistory((prev) => {
        const previous = prev[prev.length - 1];

        if (
          previous &&
          Math.abs(previous.latitude - nextPosition.latitude) < 0.0001 &&
          Math.abs(previous.longitude - nextPosition.longitude) < 0.0001
        ) {
          return prev;
        }

        const updated = [...prev, nextPosition];
        return updated.slice(-MAX_HISTORY_POINTS);
      });
      setLastUpdated(new Date(nextPosition.timestamp));
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load ISS location.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refresh]);

  const contextValue = useMemo(
    () => ({
      position,
      history,
      loading,
      error,
      lastUpdated,
      refresh,
    }),
    [position, history, loading, error, lastUpdated, refresh]
  );

  return <IssContext.Provider value={contextValue}>{children}</IssContext.Provider>;
}

export default function AppWrapper({ children }) {
  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
      }}
    >
      {children}
    </main>
  );
}
