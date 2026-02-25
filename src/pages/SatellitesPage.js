import React, { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
} from "satellite.js";
import { SATELLITES } from "../common/constants/satellites";
import { fetchCelestrakTle } from "../common/api";
import { appendUnwrappedTrailPoint, buildTrailSegments } from "../common/utils";

const TLE_REFRESH_MS = 6 * 60 * 60 * 1000;
const POSITION_REFRESH_MS = 1000;
const TRAIL_POINT_INTERVAL_MS = 1000;
const MAX_TRAIL_POINTS = 80;

export default function SatellitesPage() {
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
      try {
        const tleRecords = await Promise.all(
          SATELLITES.map(async (satellite) => {
            const tle = await fetchCelestrakTle(satellite.id, satellite.name);
            return {
              ...satellite,
              ...tle,
              satrec: twoline2satrec(tle.line1, tle.line2),
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
    if (!satrecs.length) {
      return undefined;
    }

    const updatePositions = () => {
      const now = new Date();
      const nowTs = now.getTime();
      const gmst = gstime(now);

      const nextPoints = satrecs
        .map((record) => {
          const pv = propagate(record.satrec, now);

          if (!pv.position) {
            return null;
          }

          const geodetic = eciToGeodetic(pv.position, gmst);

          return {
            id: record.id,
            name: record.name,
            color: record.color,
            latitude: degreesLat(geodetic.latitude),
            longitude: degreesLong(geodetic.longitude),
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

          if (nowTs - lastTs < TRAIL_POINT_INTERVAL_MS && existing.length > 0) {
            return;
          }

          lastTrailUpdateRef.current[point.id] = nowTs;
          nextHistory[point.id] = appendUnwrappedTrailPoint(existing, point, MAX_TRAIL_POINTS);
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
