function buildCatalogUrl({ type, source, limit, offset } = {}) {
  const params = new URLSearchParams();

  if (type) {
    params.set("type", type);
  }
  if (source) {
    params.set("source", source);
  }
  if (Number.isFinite(limit)) {
    params.set("limit", String(Math.max(1, Math.floor(limit))));
  }
  if (Number.isFinite(offset)) {
    params.set("offset", String(Math.max(0, Math.floor(offset))));
  }

  const query = params.toString();
  return query ? `/api/catalog?${query}` : "/api/catalog";
}

export const API_URLS = {
  iss: "/api/iss",
  issTle: "/api/iss/tle",
  celestrakTle: (id, name = "ISS") => `/api/tle/celestrak/${id}?name=${encodeURIComponent(name)}`,
  news: (limit, offset) => `/api/news?limit=${limit}&offset=${offset}`,
  launches: (limit, offset) => `/api/launches?limit=${limit}&offset=${offset}`,
  marsWeather: "/api/mars-weather",
  exoplanets: "/api/exoplanets",
  tleIvan: (page, pageSize) => `/api/tle-ivan?page=${page}&pageSize=${pageSize}`,
  CATALOG_URL: buildCatalogUrl,
};

export default API_URLS;
