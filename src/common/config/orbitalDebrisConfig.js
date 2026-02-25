export const ORBITAL_DEBRIS_CONFIG = {
  cacheKey: "orbital_debris_cache_v1",
  rateLimitKey: "orbital_debris_rate_limit_v1",
  pageSize: 100,
  maxPages: 280,
  positionRefreshMs: 4000,
  fetchStepDelayMs: 120,
  officialCatalogSize: 27000,
  defaultCooldownMs: 10 * 60 * 1000,
  cacheFreshMs: 15 * 60 * 1000,
};

export const ALTITUDE_BAND = {
  low: "low",
  mid: "mid",
  high: "high",
};

export default ORBITAL_DEBRIS_CONFIG;
