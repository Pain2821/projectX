import BASE_API_URL from "./baseApi";
import { API_URLS } from "./apiUrls";

function buildUrl(path) {
  return `${BASE_API_URL}${path}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let detailMessage = "";
    let parsedPayload = null;
    let retryAfterMs = null;

    try {
      parsedPayload = await response.json();
      if (typeof parsedPayload?.detail === "string") {
        detailMessage = parsedPayload.detail;
      } else if (typeof parsedPayload?.message === "string") {
        detailMessage = parsedPayload.message;
      } else if (typeof parsedPayload?.response?.message === "string") {
        detailMessage = parsedPayload.response.message;
      }
    } catch (_error) {
      // Fallback to default message when response is not JSON.
    }

    const retryAfterHeader = response.headers.get("retry-after");
    if (retryAfterHeader) {
      const retrySeconds = Number(retryAfterHeader);
      if (Number.isFinite(retrySeconds) && retrySeconds > 0) {
        retryAfterMs = retrySeconds * 1000;
      } else {
        const retryTs = Date.parse(retryAfterHeader);
        if (Number.isFinite(retryTs)) {
          retryAfterMs = Math.max(0, retryTs - Date.now());
        }
      }
    }

    const message = detailMessage || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = parsedPayload;
    error.retryAfterMs = retryAfterMs;
    throw error;
  }

  return response.json();
}

async function fetchUnknown(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
}

function extractTleFromText(text, fallbackName = "ISS") {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const line1 = lines.find((line) => line.startsWith("1 "));
  const line2 = lines.find((line) => line.startsWith("2 "));

  if (!line1 || !line2) {
    return null;
  }

  const name = lines.find((line) => !line.startsWith("1 ") && !line.startsWith("2 ")) || fallbackName;

  return {
    name,
    line1,
    line2,
  };
}

function extractTleFromUnknown(value, fallbackName = "ISS") {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return extractTleFromText(value, fallbackName);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const extracted = extractTleFromUnknown(item, fallbackName);
      if (extracted) {
        return extracted;
      }
    }
    return null;
  }

  if (typeof value === "object") {
    if (typeof value.line1 === "string" && typeof value.line2 === "string") {
      return {
        name: value.name || fallbackName,
        line1: value.line1.trim(),
        line2: value.line2.trim(),
      };
    }

    if (typeof value.tle === "string") {
      return extractTleFromText(value.tle, value.name || fallbackName);
    }

    return null;
  }

  return null;
}

export async function fetchIssLocation(options = {}) {
  return fetchJson(buildUrl(API_URLS.iss), options);
}

export async function fetchSatelliteById(id, options = {}) {
  return fetchJson(buildUrl(API_URLS.satelliteById(id)), options);
}

export async function fetchSatellitesByIds(ids, options = {}) {
  return Promise.all(ids.map((id) => fetchSatelliteById(id, options)));
}

export async function fetchIssTleData(options = {}) {
  const paths = [API_URLS.issTle].filter(Boolean);
  let lastError = null;

  for (const path of paths) {
    try {
      const payload = await fetchUnknown(buildUrl(path), options);
      const tle = extractTleFromUnknown(payload, "ISS");

      if (tle) {
        return tle;
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }
      lastError = error;
    }
  }

  try {
    return await fetchCelestrakTle(25544, "ISS", options);
  } catch (error) {
    lastError = error;
  }

  throw lastError || new Error("Unable to load ISS TLE data.");
}

export async function fetchCelestrakTle(id, fallbackName, options = {}) {
  const payload = await fetchUnknown(buildUrl(API_URLS.celestrakTle(id, fallbackName)), options);
  const tle = extractTleFromUnknown(payload, fallbackName);

  if (!tle) {
    throw new Error(`Invalid TLE data for ${fallbackName}.`);
  }

  return tle;
}

export async function fetchSpaceNewsArticles(limit = 20, offset = 0, options = {}) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, Math.floor(limit))) : 20;
  const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  const payload = await fetchJson(buildUrl(API_URLS.news(safeLimit, safeOffset)), options);

  return {
    results: Array.isArray(payload?.results) ? payload.results : [],
    count: payload?.count || 0,
    next: payload?.next || null,
    previous: payload?.previous || null,
  };
}

export async function fetchUpcomingLaunches(limit = 10, offset = 0, options = {}) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, Math.floor(limit))) : 10;
  const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  const payload = await fetchJson(buildUrl(API_URLS.launches(safeLimit, safeOffset)), options);

  return {
    results: Array.isArray(payload?.results) ? payload.results : [],
    count: payload?.count || 0,
    next: payload?.next || null,
    previous: payload?.previous || null,
  };
}

export async function fetchMarsWeather(options = {}) {
  return fetchJson(buildUrl(API_URLS.marsWeather), options);
}

export async function fetchExoplanets(options = {}) {
  return fetchJson(buildUrl(API_URLS.exoplanets), options);
}

export async function fetchIvanTlePage(page = 1, pageSize = 100, options = {}) {
  let safePage = 1;
  let safePageSize = Number.isFinite(pageSize) ? Math.max(1, Math.min(100, Math.floor(pageSize))) : 100;

  if (typeof page === "string") {
    if (page.startsWith("http")) {
      try {
        const parsed = new URL(page);
        safePage = Number(parsed.searchParams.get("page") || 1);
        safePageSize = Number(parsed.searchParams.get("page-size") || parsed.searchParams.get("pageSize") || safePageSize);
      } catch (_error) {
        safePage = 1;
      }
    } else {
      safePage = Number(page);
    }
  } else {
    safePage = Number(page);
  }

  safePage = Number.isFinite(safePage) ? Math.max(1, Math.floor(safePage)) : 1;
  safePageSize = Number.isFinite(safePageSize) ? Math.max(1, Math.min(100, Math.floor(safePageSize))) : 100;

  const payload = await fetchJson(buildUrl(API_URLS.tleIvan(safePage, safePageSize)), options);
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.member)
      ? payload.member
      : [];

  return {
    items,
    next: payload?.next || payload?.view?.next || null,
  };
}
