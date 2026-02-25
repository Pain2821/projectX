import BASE_API_URL from "./baseApi";
import { API_URLS } from "./apiUrls";
import { EXTERNAL_API } from "../config";

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
  const paths = [API_URLS.tledata, API_URLS.tles];
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
  const sourceUrl = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`;
  const fallbackProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(sourceUrl)}`;

  const urls = [sourceUrl, fallbackProxyUrl];
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`TLE request failed with status ${response.status}`);
      }

      const text = await response.text();
      const tle = extractTleFromText(text, fallbackName);

      if (!tle) {
        throw new Error(`Invalid TLE data for ${fallbackName}.`);
      }

      return tle;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError || new Error(`Unable to fetch TLE for ${fallbackName}.`);
}

export async function fetchSpaceNewsArticles(limit = 20, offset = 0, options = {}) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, Math.floor(limit))) : 20;
  const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  const url = `${EXTERNAL_API.spaceNewsBase}/articles/?limit=${safeLimit}&offset=${safeOffset}`;
  const payload = await fetchJson(url, options);

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
  const url = `${EXTERNAL_API.launchLibraryBase}/launch/upcoming/?limit=${safeLimit}&offset=${safeOffset}&format=json`;
  const payload = await fetchJson(url, options);

  return {
    results: Array.isArray(payload?.results) ? payload.results : [],
    count: payload?.count || 0,
    next: payload?.next || null,
    previous: payload?.previous || null,
  };
}

export async function fetchMarsWeather(options = {}) {
  return fetchJson(EXTERNAL_API.nasaInsightWeather, options);
}

export async function fetchExoplanets(options = {}) {
  const fallbackProxyUrl1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    EXTERNAL_API.nasaExoplanets
  )}`;
  const fallbackProxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(EXTERNAL_API.nasaExoplanets)}`;
  const urls = [EXTERNAL_API.nasaExoplanets, fallbackProxyUrl1, fallbackProxyUrl2];
  let lastError = null;

  for (const url of urls) {
    try {
      return await fetchJson(url, options);
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to load exoplanet data.");
}

export async function fetchIvanTlePage(page = 1, pageSize = 100, options = {}) {
  let url = "";

  if (typeof page === "string" && page.startsWith("http")) {
    url = page;
  } else {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize) ? Math.max(1, Math.min(100, Math.floor(pageSize))) : 100;
    url = `${EXTERNAL_API.tleIvanBase}?page=${safePage}&page-size=${safePageSize}`;
  }

  const payload = await fetchJson(url, options);
  const items = Array.isArray(payload?.member) ? payload.member : [];

  return {
    items,
    next: payload?.view?.next || null,
  };
}
