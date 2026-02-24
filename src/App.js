import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import MapView from "./components/MapView";
import StatusBar from "./components/StatusBar";
import { useIss } from "./common/hooks";
import AppWrapper, { IssProvider, ThemeProvider } from "./layouts/appWrapper";

const SATELLITES = [
  { id: 25544, name: "ISS", color: "#38bdf8" },
  { id: 20580, name: "Hubble Space Telescope", color: "#f59e0b" },
  { id: 33591, name: "NOAA-19", color: "#34d399" },
];

const TLE_REFRESH_MS = 6 * 60 * 60 * 1000;
const POSITION_REFRESH_MS = 1000;
const TRAIL_POINT_INTERVAL_MS = 1000;
const MAX_TRAIL_POINTS = 80;

function parseTleText(text, fallbackName) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const line1 = lines.find((line) => line.startsWith("1 "));
  const line2 = lines.find((line) => line.startsWith("2 "));

  if (!line1 || !line2) {
    throw new Error(`Invalid TLE data for ${fallbackName}.`);
  }

  const nameLine = lines.find((line) => !line.startsWith("1 ") && !line.startsWith("2 "));

  return {
    name: nameLine || fallbackName,
    line1,
    line2,
  };
}

async function fetchCelestrakTle(id, fallbackName) {
  const sourceUrl = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`;
  const fallbackProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(sourceUrl)}`;

  const urls = [sourceUrl, fallbackProxyUrl];

  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`TLE request failed with status ${response.status}`);
      }

      const text = await response.text();
      return parseTleText(text, fallbackName);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Unable to fetch TLE for ${fallbackName}.`);
}

function shortestLongitudeDelta(fromLongitude, toLongitude) {
  let delta = toLongitude - fromLongitude;

  if (delta > 180) {
    delta -= 360;
  } else if (delta < -180) {
    delta += 360;
  }

  return delta;
}

function buildTrailSegments(points) {
  if (!points || points.length < 2) {
    return [];
  }

  const segments = [];
  let currentSegment = [[points[0].latitude, points[0].longitude]];

  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const deltaLon = Math.abs(current.longitude - previous.longitude);

    if (deltaLon > 45) {
      if (currentSegment.length > 1) {
        segments.push(currentSegment);
      }
      currentSegment = [[current.latitude, current.longitude]];
      continue;
    }

    currentSegment.push([current.latitude, current.longitude]);
  }

  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
}

function TopNav() {
  const linkStyle = ({ isActive }) => ({
    color: isActive ? "#dbeafe" : "#9fb5d9",
    textDecoration: "none",
    fontSize: "13px",
    padding: "6px 10px",
    borderRadius: "8px",
    background: isActive ? "rgba(56, 189, 248, 0.2)" : "transparent",
    border: isActive ? "1px solid rgba(56, 189, 248, 0.45)" : "1px solid transparent",
  });

  return (
    <nav
      style={{
        position: "fixed",
        top: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1400,
        display: "flex",
        gap: "8px",
        padding: "6px",
        borderRadius: "12px",
        border: "1px solid rgba(124, 148, 183, 0.35)",
        backgroundColor: "rgba(6, 10, 20, 0.68)",
        backdropFilter: "blur(8px)",
      }}
    >
      <NavLink to="/liveiss" style={linkStyle}>
        ISS Tracker
      </NavLink>
      <NavLink to="/satellites" style={linkStyle}>
        Satellites
      </NavLink>
    </nav>
  );
}

function HomePage() {
  const buttonStyle = {
    display: "inline-block",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid rgba(124, 148, 183, 0.45)",
    background: "rgba(8, 23, 44, 0.85)",
    color: "#e2e8f0",
    fontSize: "14px",
    minWidth: "180px",
    textAlign: "center",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(124, 148, 183, 0.35)",
          borderRadius: "14px",
          background: "rgba(5, 10, 22, 0.62)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "260px",
        }}
      >
        <Link to="/liveiss" style={buttonStyle}>
          Track ISS
        </Link>
        <Link to="/satellites" style={buttonStyle}>
          Track Satellites
        </Link>
      </div>
    </div>
  );
}

function LiveIssPage() {
  const { position, history, loading, error, lastUpdated } = useIss();

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <MapView position={position} history={history} />
      <StatusBar
        position={position}
        loading={loading}
        error={error}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}

function SatellitesPage() {
  const [satellitePoints, setSatellitePoints] = useState([]);
  const [trailHistory, setTrailHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [satrecs, setSatrecs] = useState([]);
  const lastTrailUpdateRef = useRef({});

  useEffect(() => {
    let disposed = false;

    async function loadTleData() {
      if (!window.satellite) {
        if (!disposed) {
          setError("satellite.js CDN is not available.");
          setLoading(false);
        }
        return;
      }

      try {
        const tleRecords = await Promise.all(
          SATELLITES.map(async (satellite) => {
            const tle = await fetchCelestrakTle(satellite.id, satellite.name);
            return {
              ...satellite,
              ...tle,
              satrec: window.satellite.twoline2satrec(tle.line1, tle.line2),
            };
          })
        );

        if (!disposed) {
          setSatrecs(tleRecords);
          setError("");
        }
      } catch (requestError) {
        if (!disposed) {
          setError(requestError.message || "Unable to load CelesTrak TLE data.");
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    loadTleData();
    const tleInterval = setInterval(loadTleData, TLE_REFRESH_MS);

    return () => {
      disposed = true;
      clearInterval(tleInterval);
    };
  }, []);

  useEffect(() => {
    if (!satrecs.length || !window.satellite) {
      return undefined;
    }

    const updatePositions = () => {
      const now = new Date();
      const nowTs = now.getTime();
      const gmst = window.satellite.gstime(now);

      const nextPoints = satrecs
        .map((record) => {
          const pv = window.satellite.propagate(record.satrec, now);

          if (!pv.position) {
            return null;
          }

          const geodetic = window.satellite.eciToGeodetic(pv.position, gmst);

          return {
            id: record.id,
            name: record.name,
            color: record.color,
            latitude: window.satellite.degreesLat(geodetic.latitude),
            longitude: window.satellite.degreesLong(geodetic.longitude),
            altitude: geodetic.height,
          };
        })
        .filter(Boolean);

      setSatellitePoints(nextPoints);
      setTrailHistory((prev) => {
        const nextHistory = { ...prev };

        nextPoints.forEach((point) => {
          const lastTs = lastTrailUpdateRef.current[point.id] || 0;
          const existing = nextHistory[point.id] || [];

          if (existing.length === 0) {
            nextHistory[point.id] = [
              {
                latitude: point.latitude,
                longitude: point.longitude,
              },
            ];
            lastTrailUpdateRef.current[point.id] = nowTs;
            return;
          }

          if (nowTs - lastTs < TRAIL_POINT_INTERVAL_MS) {
            return;
          }

          lastTrailUpdateRef.current[point.id] = nowTs;
          const lastPoint = existing[existing.length - 1];
          const unwrappedLongitude =
            lastPoint.longitude + shortestLongitudeDelta(lastPoint.longitude, point.longitude);

          nextHistory[point.id] = [
            ...existing,
            { latitude: point.latitude, longitude: unwrappedLongitude },
          ].slice(-MAX_TRAIL_POINTS);
        });

        return nextHistory;
      });
      setLastUpdated(now);
    };

    updatePositions();
    const intervalId = setInterval(updatePositions, POSITION_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [satrecs]);

  const legendItems = useMemo(() => SATELLITES, []);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        style={{ height: "100%", width: "100%" }}
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        {SATELLITES.map((satellite) => {
          const segments = buildTrailSegments(trailHistory[satellite.id] || []);

          if (segments.length === 0) {
            return null;
          }

          return (
            <React.Fragment key={`trail-${satellite.id}`}>
              {segments.map((segment, index) => (
                <React.Fragment key={`${satellite.id}-segment-${index}`}>
                  <Polyline
                    positions={segment}
                    pathOptions={{
                      color: satellite.color,
                      weight: 8,
                      opacity: 0.28,
                    }}
                  />
                  <Polyline
                    positions={segment}
                    pathOptions={{
                      color: satellite.color,
                      weight: 3,
                      opacity: 0.95,
                    }}
                  />
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}

        {satellitePoints.map((satellite) => (
          <CircleMarker
            key={satellite.id}
            center={[satellite.latitude, satellite.longitude]}
            radius={6}
            pathOptions={{
              color: satellite.color,
              fillColor: satellite.color,
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{satellite.name}</strong>
              <br />
              Lat: {satellite.latitude.toFixed(3)}
              <br />
              Lon: {satellite.longitude.toFixed(3)}
              <br />
              Alt: {satellite.altitude.toFixed(1)} km
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <section
        style={{
          position: "absolute",
          right: "16px",
          bottom: "16px",
          zIndex: 1200,
          border: "1px solid rgba(124, 148, 183, 0.35)",
          borderRadius: "12px",
          padding: "10px 12px",
          backgroundColor: "rgba(5, 10, 22, 0.62)",
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          minWidth: "230px",
        }}
      >
        <strong style={{ color: "#dbeafe", fontSize: "13px" }}>Satellite Legend</strong>
        {legendItems.map((satellite) => (
          <div key={satellite.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                background: satellite.color,
                boxShadow: `0 0 8px ${satellite.color}`,
              }}
            />
            <span style={{ color: "#cbd5e1", fontSize: "12px" }}>{satellite.name}</span>
          </div>
        ))}
        <div style={{ color: "#9aa9c4", fontSize: "11px", marginTop: "2px" }}>
          {loading && !lastUpdated
            ? "Loading TLE..."
            : `Updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}`}
        </div>
        {error ? <div style={{ color: "#fca5a5", fontSize: "12px" }}>{error}</div> : null}
      </section>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppWrapper>
        <BrowserRouter>
          <TopNav />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/liveiss"
              element={
                <IssProvider>
                  <LiveIssPage />
                </IssProvider>
              }
            />
            <Route path="/satellites" element={<SatellitesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppWrapper>
    </ThemeProvider>
  );
}
