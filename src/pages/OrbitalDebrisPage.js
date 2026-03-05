import React, { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
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
  const hasFirstBatchRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cached = readCache();
    if (cached?.items?.length) {
      const hydrated = buildDebrisItems(cached.items);
      if (hydrated.length) {
        setDebrisItems(hydrated);
        setSourceLabel("Cached TLE data");
        setLoading(false);
      }
    }
  }, []);

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
          setSourceLabel("Cached TLE data");
          setLoading(false);
          return;
        }
      }

      setStreaming(true);
      setError("");

      try {
        const catalogPayload = await fetchCatalog(
          {
            type: "DEBRIS",
            limit: 5000,
            offset: 0,
          },
          { signal: controller.signal }
        );

        const catalogItems = Array.isArray(catalogPayload?.data) ? catalogPayload.data : [];
        const hydratedFromCatalog = buildDebrisItems(catalogItems);

        if (hydratedFromCatalog.length) {
          if (!disposed) {
            setDebrisItems(hydratedFromCatalog);
            setSourceLabel("Catalog API");
            setCatalogStale(Boolean(catalogPayload?.stale));
            setCatalogCacheAge(catalogPayload?.cacheAge ?? null);
            setLoading(false);
            setStreaming(false);
          }
          return;
        }
      } catch (catalogError) {
        if (catalogError?.name === "AbortError") {
          return;
        }
      }

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

  useEffect(() => {
    if (!debrisItems.length) {
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

      const nextPoints = debrisItems
        .map((item) => {
          const pv = propagate(item.satrec, now);

          if (!pv?.position) {
            return null;
          }

          const geodetic = eciToGeodetic(pv.position, gmst);
          const altitudeKm = safeNumber(geodetic?.height, 0);
          const band = classifyAltitude(altitudeKm);

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
  }, [debrisItems]);

  const stats = useMemo(() => {
    let low = 0;
    let mid = 0;
    let high = 0;

    points.forEach((point) => {
      if (point.band === ALTITUDE_BAND.low) {
        low += 1;
      } else if (point.band === ALTITUDE_BAND.mid) {
        mid += 1;
      } else {
        high += 1;
      }
    });

    return {
      total: points.length,
      low,
      mid,
      high,
    };
  }, [points]);

  const cooldownText =
    retryAt > nowMs ? `Using cached data - full refresh in ${formatCountdown(retryAt - nowMs)}.` : "";

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

        {points.map((point) => {
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
          Tracking {stats.total.toLocaleString()} objects of {ORBITAL_DEBRIS_CONFIG.officialCatalogSize.toLocaleString()}+
          officially catalogued by US Space Surveillance Network
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
        {streaming && !loading ? (
          <div style={{ color: "#93c5fd", fontSize: "13px" }}>Streaming additional pages...</div>
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
