import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { degreesLat, degreesLong, eciToGeodetic, gstime, propagate, twoline2satrec } from "satellite.js";
import { fetchCatalog, fetchIvanTlePage } from "../common/api";
import { ALTITUDE_BAND, ORBITAL_DEBRIS_CONFIG } from "../common/config";
import DataStatus from "../components/common/DataStatus";

const CACHE_KEY = ORBITAL_DEBRIS_CONFIG.cacheKey;
const RATE_LIMIT_KEY = ORBITAL_DEBRIS_CONFIG.rateLimitKey;
const PAGE_SIZE = ORBITAL_DEBRIS_CONFIG.pageSize;
const MAX_PAGES = ORBITAL_DEBRIS_CONFIG.maxPages;
const FETCH_STEP_DELAY_MS = ORBITAL_DEBRIS_CONFIG.fetchStepDelayMs;
const CACHE_FRESH_MS = ORBITAL_DEBRIS_CONFIG.cacheFreshMs;
const DEFAULT_COOLDOWN_MS = ORBITAL_DEBRIS_CONFIG.defaultCooldownMs;

const BATCH_SIZE = 500;

const ALTITUDE_FILTERS = [
  { key: "all", label: "All" },
  { key: "low", label: "LEO <1000km" },
  { key: "mid", label: "MEO 1000–20000km" },
  { key: "high", label: "GEO >20000km" },
];

function safeNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function classifyAltitude(altitudeKm) {
  if (altitudeKm < 1000) {
    return ALTITUDE_BAND.low;
  }

  if (altitudeKm <= 20000) {
    return ALTITUDE_BAND.mid;
  }

  return ALTITUDE_BAND.high;
}

function colorByBand(band) {
  if (band === ALTITUDE_BAND.low) {
    return "#34d399";
  }
  if (band === ALTITUDE_BAND.mid) {
    return "#facc15";
  }
  return "#ef4444";
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.items)) {
      return null;
    }

    return parsed;
  } catch (_error) {
    return null;
  }
}

function writeCache(items) {
  try {
    const payload = {
      items,
      updatedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (_error) {
    // Ignore storage failures and keep the UI running.
  }
}

function readRateLimitTs() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) {
      return 0;
    }

    const parsed = JSON.parse(raw);
    const retryAt = safeNumber(parsed?.retryAt, 0);
    return retryAt > Date.now() ? retryAt : 0;
  } catch (_error) {
    return 0;
  }
}

function writeRateLimitTs(retryAt) {
  if (!Number.isFinite(retryAt) || retryAt <= Date.now()) {
    localStorage.removeItem(RATE_LIMIT_KEY);
    return;
  }

  localStorage.setItem(
    RATE_LIMIT_KEY,
    JSON.stringify({
      retryAt,
    })
  );
}

function parseRetryAfter(error) {
  if (!error) {
    return Date.now() + DEFAULT_COOLDOWN_MS;
  }

  if (Number.isFinite(error?.retryAfterMs) && error.retryAfterMs > 0) {
    return Date.now() + error.retryAfterMs;
  }

  if (typeof error?.message === "string") {
    const secondsMatch = error.message.match(/Expected available in (\d+) seconds/i);
    if (secondsMatch) {
      const seconds = Number(secondsMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Date.now() + seconds * 1000;
      }
    }

    const isoMatch = error.message.match(/Retry after ([0-9T:\-+.Z]+)/i);
    if (isoMatch) {
      const ts = Date.parse(isoMatch[1]);
      if (Number.isFinite(ts)) {
        return ts;
      }
    }
  }

  return Date.now() + DEFAULT_COOLDOWN_MS;
}

function buildDebrisItems(rawItems) {
  const byObjectId = new Map();

  rawItems.forEach((item) => {
    const line1 = String(item?.line1 || item?.tle?.line1 || "").trim();
    const line2 = String(item?.line2 || item?.tle?.line2 || "").trim();

    if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) {
      return;
    }

    try {
      const objectId = String(
        item?.catalogId || item?.noradCatId || item?.satelliteId || item?.id || `${line1}_${line2}`
      );
      byObjectId.set(objectId, {
        id: item?.catalogId || item?.satelliteId || item?.noradCatId || item?.id || `${line1}_${line2}`,
        name: item?.name || item?.satelliteName || item?.objectName || "Unknown Object",
        noradCatId: item?.catalogId || item?.noradCatId || item?.satelliteId || null,
        line1,
        line2,
        satrec: twoline2satrec(line1, line2),
      });
    } catch (_error) {
      // Ignore malformed rows and continue.
    }
  });

  return Array.from(byObjectId.values());
}

function formatCountdown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0m";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

// ---------------------------------------------------------------------------
// ViewportFilter — lives inside <MapContainer> so useMap() works.
// Listens to moveend/zoomend and pushes bounds back up.
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

  // fire once on mount so initial view is populated
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
export default function OrbitalDebrisPage() {
  const [debrisItems, setDebrisItems] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("Live TLE API");
  const [retryAt, setRetryAt] = useState(() => readRateLimitTs());
  const [nowMs, setNowMs] = useState(Date.now());
  const [catalogStale, setCatalogStale] = useState(false);
  const [catalogCacheAge, setCatalogCacheAge] = useState(null);
  const [catalogTotal, setCatalogTotal] = useState(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [altitudeFilter, setAltitudeFilter] = useState("all");
  const [viewBounds, setViewBounds] = useState(null);
  const hasFirstBatchRef = useRef(false);

  // tick for cooldown display
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // hydrate from localStorage on mount
  useEffect(() => {
    const cached = readCache();
    if (cached?.items?.length) {
      const hydrated = buildDebrisItems(cached.items);
      if (hydrated.length) {
        setDebrisItems(hydrated);
        setLoadedCount(hydrated.length);
        setSourceLabel("Cached TLE data");
        setLoading(false);
      }
    }
  }, []);

  // -----------------------------------------------------------------------
  // Main data-loading effect — progressive catalog batches
  // -----------------------------------------------------------------------
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();

    async function loadAllPages() {
      const blockedUntil = readRateLimitTs();
      const shouldSkipNetwork = blockedUntil > Date.now();
      setRetryAt(blockedUntil);
      const cached = readCache();
      const hasFreshCache =
        Array.isArray(cached?.items) &&
        cached.items.length > 0 &&
        Date.now() - safeNumber(cached.updatedAt, 0) < CACHE_FRESH_MS;

      if (shouldSkipNetwork) {
        if (cached?.items?.length) {
          setSourceLabel("Cached TLE data");
          setLoading(false);
          return;
        }
      }

      if (hasFreshCache) {
        const hydrated = buildDebrisItems(cached.items);
        if (hydrated.length) {
          setDebrisItems(hydrated);
          setLoadedCount(hydrated.length);
          setSourceLabel("Cached TLE data");
          setLoading(false);
          return;
        }
      }

      // ----- progressive catalog loading -----
      setStreaming(true);
      setError("");

      try {
        let offset = 0;
        const allRawItems = [];
        let knownTotal = 0;

        while (!disposed) {
          const catalogPayload = await fetchCatalog(
            { type: "DEBRIS", limit: BATCH_SIZE, offset },
            { signal: controller.signal }
          );

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

          const hydrated = buildDebrisItems(allRawItems);
          if (!disposed) {
            setDebrisItems(hydrated);
            setLoadedCount(hydrated.length);
            setSourceLabel("Catalog API");

            if (!hasFirstBatchRef.current) {
              hasFirstBatchRef.current = true;
              setLoading(false);
            }
          }

          offset += BATCH_SIZE;

          // stop when we've fetched everything the API says exists
          if (knownTotal > 0 && offset >= knownTotal) {
            break;
          }

          // also stop if we got fewer items than requested (last page)
          if (batchItems.length < BATCH_SIZE) {
            break;
          }

          await sleep(200);
        }

        if (!disposed) {
          writeCache(allRawItems);
          setLoading(false);
          setStreaming(false);
        }

        return;
      } catch (catalogError) {
        if (catalogError?.name === "AbortError") {
          return;
        }
        // fall through to Ivan TLE fallback
      }

      // ----- Ivan TLE fallback (unchanged) -----
      const collected = [];
      let page = 1;

      try {
        while (!disposed && page <= MAX_PAGES) {
          const payload = await fetchIvanTlePage(page, PAGE_SIZE, {
            signal: controller.signal,
          });
          const pageItems = Array.isArray(payload?.items) ? payload.items : [];

          if (!pageItems.length) {
            break;
          }

          collected.push(...pageItems);

          const hydrated = buildDebrisItems(collected);
          if (hydrated.length) {
            setDebrisItems(hydrated);
            setLoadedCount(hydrated.length);
            setSourceLabel("Live TLE API (Ivan fallback)");
            writeCache(collected);

            if (!hasFirstBatchRef.current) {
              hasFirstBatchRef.current = true;
              setLoading(false);
            }
          }

          if (!payload?.next) {
            break;
          }

          page += 1;
          await sleep(FETCH_STEP_DELAY_MS);
        }

        if (!disposed) {
          setLoading(false);
        }
      } catch (requestError) {
        if (disposed) {
          return;
        }
        if (requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 429) {
          const nextRetryAt = parseRetryAfter(requestError);
          writeRateLimitTs(nextRetryAt);
          setRetryAt(nextRetryAt);
          setError("API rate limited (429). Using cached data.");

          if (cached?.items?.length) {
            const hydrated = buildDebrisItems(cached.items);
            setDebrisItems(hydrated);
            setLoadedCount(hydrated.length);
            setSourceLabel("Cached TLE data");
            setLoading(false);
          } else {
            setLoading(false);
          }
        } else {
          setError(requestError?.message || "Failed to fetch TLE catalog.");
          if (cached?.items?.length) {
            const hydrated = buildDebrisItems(cached.items);
            setDebrisItems(hydrated);
            setLoadedCount(hydrated.length);
            setSourceLabel("Cached TLE data");
          }
          setLoading(false);
        }
      } finally {
        if (!disposed) {
          setStreaming(false);
        }
      }
    }

    loadAllPages();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Altitude-filtered items
  // -----------------------------------------------------------------------
  const filteredDebrisItems = useMemo(() => {
    if (altitudeFilter === "all") {
      return debrisItems;
    }
    // We can't filter by altitude before propagation, so we pass all items
    // through and filter after position calculation below.
    return debrisItems;
  }, [debrisItems, altitudeFilter]);

  // -----------------------------------------------------------------------
  // SGP4 propagation — produces lat/lng/alt points from TLE satrecs
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!filteredDebrisItems.length) {
      setPoints([]);
      return undefined;
    }

    let disposed = false;

    const update = () => {
      if (disposed) {
        return;
      }

      const now = new Date();
      const gmst = gstime(now);

      const nextPoints = filteredDebrisItems
        .map((item) => {
          const pv = propagate(item.satrec, now);

          if (!pv || !pv.position || pv.position === true) {
            return null;
          }

          const geodetic = eciToGeodetic(pv.position, gmst);
          const altitudeKm = safeNumber(geodetic?.height, 0);
          const band = classifyAltitude(altitudeKm);

          // altitude filter applied post-propagation
          if (altitudeFilter !== "all" && band !== altitudeFilter) {
            return null;
          }

          return {
            id: item.id,
            name: item.name,
            noradCatId: item.noradCatId,
            latitude: degreesLat(geodetic.latitude),
            longitude: degreesLong(geodetic.longitude),
            altitudeKm,
            band,
          };
        })
        .filter(Boolean);

      setPoints(nextPoints);
    };

    update();
    const interval = setInterval(update, ORBITAL_DEBRIS_CONFIG.positionRefreshMs);

    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [filteredDebrisItems, altitudeFilter]);

  // -----------------------------------------------------------------------
  // Viewport-filtered points — only markers inside current map bounds
  // -----------------------------------------------------------------------
  const visiblePoints = useMemo(() => {
    if (!viewBounds) {
      return points;
    }

    return points.filter((p) => {
      return (
        p.latitude >= viewBounds.south &&
        p.latitude <= viewBounds.north &&
        p.longitude >= viewBounds.west &&
        p.longitude <= viewBounds.east
      );
    });
  }, [points, viewBounds]);

  // -----------------------------------------------------------------------
  // Stats derived from visible points
  // -----------------------------------------------------------------------
  const stats = useMemo(() => {
    let low = 0;
    let mid = 0;
    let high = 0;

    visiblePoints.forEach((point) => {
      if (point.band === ALTITUDE_BAND.low) {
        low += 1;
      } else if (point.band === ALTITUDE_BAND.mid) {
        mid += 1;
      } else {
        high += 1;
      }
    });

    return {
      total: visiblePoints.length,
      low,
      mid,
      high,
    };
  }, [visiblePoints]);

  const handleBoundsChange = useCallback((bounds) => {
    setViewBounds(bounds);
  }, []);

  const cooldownText =
    retryAt > nowMs ? `Using cached data - full refresh in ${formatCountdown(retryAt - nowMs)}.` : "";

  const progressText =
    streaming && catalogTotal
      ? `Loading ${loadedCount.toLocaleString()} of ${catalogTotal.toLocaleString()}…`
      : streaming
        ? `Loading ${loadedCount.toLocaleString()} objects…`
        : null;

  return (
    <section
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100dvh",
        background: "#05080f",
      }}
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={5}
        maxBounds={[
          [-85, -180],
          [85, 180],
        ]}
        maxBoundsViscosity={1}
        worldCopyJump={false}
        style={{
          width: "100%",
          height: "100dvh",
        }}
      >
        <TileLayer
          noWrap
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <ViewportFilter onBoundsChange={handleBoundsChange} />

        {visiblePoints.map((point) => {
          const color = colorByBand(point.band);
          return (
            <CircleMarker
              key={point.id}
              center={[point.latitude, point.longitude]}
              radius={1.5}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.55,
                opacity: 0.7,
                weight: 0,
              }}
            />
          );
        })}
      </MapContainer>

      <aside
        style={{
          position: "fixed",
          top: "72px",
          right: "16px",
          left: "16px",
          zIndex: 1300,
          width: "min(420px, calc(100vw - 32px))",
          maxWidth: "480px",
          maxHeight: "calc(100dvh - 96px)",
          overflowY: "auto",
          border: "1px solid rgba(124, 148, 183, 0.3)",
          borderRadius: "12px",
          padding: "12px 14px",
          background: "linear-gradient(145deg, rgba(5, 9, 20, 0.9), rgba(8, 16, 34, 0.75))",
          backdropFilter: "blur(8px)",
          color: "#dbeafe",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>Orbital Debris</div>
        <DataStatus stale={catalogStale} cacheAge={catalogCacheAge} style={{ marginBottom: "8px" }} />

        <div style={{ color: "#cbd5e1", fontSize: "15px", marginBottom: "8px" }}>
          Showing {stats.total.toLocaleString()} of{" "}
          {(catalogTotal || ORBITAL_DEBRIS_CONFIG.officialCatalogSize).toLocaleString()} tracked objects
        </div>

        {/* Altitude filter buttons */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "10px",
          }}
        >
          {ALTITUDE_FILTERS.map((filter) => {
            const isActive = altitudeFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setAltitudeFilter(filter.key)}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: isActive ? "1px solid #22d3ee" : "1px solid rgba(124, 148, 183, 0.35)",
                  borderRadius: "6px",
                  background: isActive
                    ? "rgba(34, 211, 238, 0.15)"
                    : "rgba(255, 255, 255, 0.04)",
                  color: isActive ? "#22d3ee" : "#94a3b8",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div style={{ color: "#34d399", fontSize: "14px", marginBottom: "2px" }}>
          Under 1000km: {stats.low.toLocaleString()}
        </div>
        <div style={{ color: "#facc15", fontSize: "14px", marginBottom: "2px" }}>
          1000-20000km: {stats.mid.toLocaleString()}
        </div>
        <div style={{ color: "#ef4444", fontSize: "14px", marginBottom: "6px" }}>
          Above 20000km: {stats.high.toLocaleString()}
        </div>

        {loading ? <div style={{ color: "#93c5fd", fontSize: "13px" }}>Initializing debris feed...</div> : null}
        {progressText ? (
          <div style={{ color: "#93c5fd", fontSize: "13px" }}>{progressText}</div>
        ) : null}
        {cooldownText ? <div style={{ color: "#fcd34d", fontSize: "13px" }}>{cooldownText}</div> : null}
        {error ? <div style={{ color: "#fca5a5", fontSize: "13px" }}>{error}</div> : null}

        <div style={{ color: "#9fb5d9", fontSize: "12px", marginTop: "8px" }}>
          Source: {sourceLabel} via catalog pipeline + Ivan fallback + satellite.js propagation
        </div>
      </aside>
    </section>
  );
}
