import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
} from "satellite.js";
import { SATELLITES } from "../common/constants/satellites";
import { fetchCatalog, fetchCelestrakTle } from "../common/api";
import { appendUnwrappedTrailPoint, buildTrailSegments } from "../common/utils";
import DataStatus from "../components/common/DataStatus";

const TLE_REFRESH_MS = 6 * 60 * 60 * 1000;
const POSITION_REFRESH_MS = 1000;
const TRAIL_POINT_INTERVAL_MS = 1000;
const MAX_TRAIL_POINTS = 80;
const BATCH_SIZE = 500;

const FALLBACK_COLORS = ["#22d3ee", "#f59e0b", "#a78bfa", "#34d399", "#fb7185", "#60a5fa", "#f43f5e"];

function colorForIndex(index) {
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function buildFromCatalog(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const line1 = String(item?.tle?.line1 || item?.line1 || "").trim();
      const line2 = String(item?.tle?.line2 || item?.line2 || "").trim();
      if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) {
        return null;
      }

      try {
        return {
          id: item?.catalogId || item?.noradCatId || item?.id || `cat-${index}`,
          name: item?.name || "Unknown Satellite",
          color: colorForIndex(index),
          line1,
          line2,
          satrec: twoline2satrec(line1, line2),
        };
      } catch (_error) {
        return null;
      }
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// ViewportFilter — lives inside <MapContainer> so useMap() works.
// ---------------------------------------------------------------------------
function ViewportFilter({ onBoundsChange }) {
  const map = useMap();

  const emitBounds = useCallback(() => {
    const bounds = map.getBounds();
    onBoundsChange({
      south: bounds.getSouth(),
      north: bounds.getNorth(),
      west: bounds.getWest(),
      east: bounds.getEast(),
    });
  }, [map, onBoundsChange]);

  useEffect(() => {
    emitBounds();
  }, [emitBounds]);

  useMapEvents({
    moveend: emitBounds,
    zoomend: emitBounds,
  });

  return null;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function SatellitesPage() {
  const [satellitePoints, setSatellitePoints] = useState([]);
  const [trailHistory, setTrailHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [satrecs, setSatrecs] = useState([]);
  const [catalogStale, setCatalogStale] = useState(false);
  const [catalogCacheAge, setCatalogCacheAge] = useState(null);
  const [catalogTotal, setCatalogTotal] = useState(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [viewBounds, setViewBounds] = useState(null);
  const lastTrailUpdateRef = useRef({});

  // -----------------------------------------------------------------------
  // Progressive catalog loading
  // -----------------------------------------------------------------------
  useEffect(() => {
    let disposed = false;

    async function loadTleData() {
      setStreaming(true);

      try {
        let offset = 0;
        const allRawItems = [];
        let knownTotal = 0;

        while (!disposed) {
          const catalogPayload = await fetchCatalog({
            type: "PAYLOAD",
            limit: BATCH_SIZE,
            offset,
          });

          const batchItems = Array.isArray(catalogPayload?.data) ? catalogPayload.data : [];
          if (Number.isFinite(catalogPayload?.total) && catalogPayload.total > 0) {
            knownTotal = catalogPayload.total;
            setCatalogTotal(knownTotal);
          }
          setCatalogStale(Boolean(catalogPayload?.stale));
          setCatalogCacheAge(catalogPayload?.cacheAge ?? null);

          if (!batchItems.length) {
            break;
          }

          allRawItems.push(...batchItems);

          const fromCatalog = buildFromCatalog(allRawItems);
          if (fromCatalog.length && !disposed) {
            setSatrecs(fromCatalog);
            setLoadedCount(fromCatalog.length);
            setError("");
            setLoading(false);
          }

          offset += BATCH_SIZE;

          if (knownTotal > 0 && offset >= knownTotal) {
            break;
          }

          if (batchItems.length < BATCH_SIZE) {
            break;
          }

          // small delay between batches
          await new Promise((r) => setTimeout(r, 200));
        }

        if (!disposed) {
          setStreaming(false);
          setLoading(false);
        }
        return;
      } catch (_error) {
        // Fall through to CelesTrak fallback.
      }

      // CelesTrak fallback (unchanged)
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
          setLoadedCount(tleRecords.length);
          setCatalogStale(true);
          setCatalogCacheAge(null);
          setError("");
        }
      } catch (requestError) {
        if (!disposed) {
          setError(requestError.message || "Unable to load satellite TLE data.");
        }
      } finally {
        if (!disposed) {
          setLoading(false);
          setStreaming(false);
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

  // -----------------------------------------------------------------------
  // SGP4 propagation — every 1s
  // -----------------------------------------------------------------------
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

          if (!pv || !pv.position || pv.position === true) {
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

  // -----------------------------------------------------------------------
  // Viewport-filtered points
  // -----------------------------------------------------------------------
  const visiblePoints = useMemo(() => {
    if (!viewBounds) {
      return satellitePoints;
    }

    return satellitePoints.filter(
      (p) =>
        p.latitude >= viewBounds.south &&
        p.latitude <= viewBounds.north &&
        p.longitude >= viewBounds.west &&
        p.longitude <= viewBounds.east
    );
  }, [satellitePoints, viewBounds]);

  const visibleIds = useMemo(() => new Set(visiblePoints.map((p) => p.id)), [visiblePoints]);

  const legendItems = useMemo(() => satrecs.map((s) => ({ id: s.id, name: s.name, color: s.color })), [satrecs]);

  const handleBoundsChange = useCallback((bounds) => {
    setViewBounds(bounds);
  }, []);

  const progressText =
    streaming && catalogTotal
      ? `Loading ${loadedCount.toLocaleString()} of ${catalogTotal.toLocaleString()}…`
      : streaming
        ? `Loading ${loadedCount.toLocaleString()} satellites…`
        : null;

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

        <ViewportFilter onBoundsChange={handleBoundsChange} />

        {legendItems.map((satellite) => {
          // Only render trails for satellites visible in viewport
          if (!visibleIds.has(satellite.id)) {
            return null;
          }

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

        {visiblePoints.map((satellite) => (
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
          left: "16px",
          zIndex: 1200,
          border: "1px solid rgba(124, 148, 183, 0.35)",
          borderRadius: "12px",
          padding: "10px 12px",
          backgroundColor: "rgba(5, 10, 22, 0.62)",
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          width: "min(260px, calc(100vw - 32px))",
          boxSizing: "border-box",
        }}
      >
        <strong style={{ color: "#dbeafe", fontSize: "13px" }}>Satellite Legend</strong>
        <DataStatus stale={catalogStale} cacheAge={catalogCacheAge} />
        <div style={{ color: "#94a3b8", fontSize: "11px" }}>
          Showing {visiblePoints.length.toLocaleString()} of{" "}
          {(catalogTotal || satellitePoints.length).toLocaleString()} satellites in view
        </div>
        {legendItems.slice(0, 14).map((satellite) => (
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
        {progressText ? (
          <div style={{ color: "#93c5fd", fontSize: "11px" }}>{progressText}</div>
        ) : null}
        {error ? <div style={{ color: "#fca5a5", fontSize: "12px" }}>{error}</div> : null}
      </section>
    </div>
  );
}
