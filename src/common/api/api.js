import BASE_API_URL from "./baseApi";
import { API_URLS } from "./apiUrls";

const SPACE_NEWS_API_BASE = "https://api.spaceflightnewsapi.net/v4";

function buildUrl(path) {
  return `${BASE_API_URL}${path}`;
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function fetchUnknown(url) {
  const response = await fetch(url);

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

export async function fetchIssLocation() {
  return fetchJson(buildUrl(API_URLS.iss));
}

export async function fetchSatelliteById(id) {
  return fetchJson(buildUrl(API_URLS.satelliteById(id)));
}

export async function fetchSatellitesByIds(ids) {
  return Promise.all(ids.map((id) => fetchSatelliteById(id)));
}

export async function fetchIssTleData() {
  const paths = [API_URLS.tledata, API_URLS.tles];
  let lastError = null;

  for (const path of paths) {
    try {
      const payload = await fetchUnknown(buildUrl(path));
      const tle = extractTleFromUnknown(payload, "ISS");

      if (tle) {
        return tle;
      }
    } catch (error) {
      lastError = error;
    }
  }

  try {
    return await fetchCelestrakTle(25544, "ISS");
  } catch (error) {
    lastError = error;
  }

  throw lastError || new Error("Unable to load ISS TLE data.");
}

export async function fetchCelestrakTle(id, fallbackName) {
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
      const tle = extractTleFromText(text, fallbackName);

      if (!tle) {
        throw new Error(`Invalid TLE data for ${fallbackName}.`);
      }

      return tle;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Unable to fetch TLE for ${fallbackName}.`);
}

export async function fetchSpaceNewsArticles(limit = 20) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, Math.floor(limit))) : 20;
  const url = `${SPACE_NEWS_API_BASE}/articles/?limit=${safeLimit}`;
  const payload = await fetchJson(url);

  return Array.isArray(payload?.results) ? payload.results : [];
}
